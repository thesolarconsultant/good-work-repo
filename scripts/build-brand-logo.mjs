// Builds a client brand's logo artwork from its typeface, as real vector
// outlines — no font dependency in the output.
//
//   node scripts/build-brand-logo.mjs <brand-slug>
//   e.g. npm run brand:logo -- beauty-heaven-hub
//
// Reads public/goodwork/brands/<slug>/logo.config.mjs, which describes the
// marks (which words, in which weights, on which lines) and the colour
// applications (which ink on which ground). Every glyph is converted to a
// path with opentype.js, so the SVGs are genuine artwork a printer or
// sign-maker can open with nothing installed, and the PNGs are rasterised
// from those same paths — computed edges, never interpolated ones.
//
// Output: public/goodwork/brands/<slug>/logo/
//   <slug>-<mark>-<application>.svg           vector master
//   <slug>-<mark>-<application>-<width>.png   raster export
//   plus any hand-drawn SVGs listed under `statics` rasterised at the sizes
//   the config asks for (favicons, app icons).

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/build-brand-logo.mjs <brand-slug>");
  process.exit(1);
}

const brandDir = join(root, "public", "goodwork", "brands", slug);
const configPath = join(brandDir, "logo.config.mjs");
if (!existsSync(configPath)) {
  console.error(`No logo config at ${configPath}`);
  process.exit(1);
}
const config = (await import(pathToFileURL(configPath).href)).default;
const outDir = join(brandDir, "logo");
mkdirSync(outDir, { recursive: true });

// opentype wants an ArrayBuffer that starts at the file's first byte. A Node
// Buffer can sit inside a shared pool, so slice to exactly its own bytes.
function loadFont(rel) {
  const b = readFileSync(join(brandDir, rel));
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
}
const fonts = Object.fromEntries(
  Object.entries(config.fonts).map(([weight, rel]) => [weight, loadFont(rel)]),
);

// Everything is laid out at this em size and scaled by the viewBox, so the
// proportions in the config are in ems and hold at any output size.
const EM = 1000;

// A run's advance, without the tracking opentype adds after the last glyph.
function runWidth(run, size, tracking) {
  const font = fonts[run.weight];
  return font.getAdvanceWidth(run.text, size, { letterSpacing: tracking }) - tracking * size;
}

// Lays a mark out and returns its paths (absolute coordinates, baseline of
// the first line at y = 0) plus the ink bounding box.
function layout(mark) {
  const paths = [];
  let baseline = 0;
  const lines = mark.lines.map((line) => {
    const size = (line.size ?? 1) * EM;
    const tracking = line.tracking ?? 0;
    const gap = (line.gap ?? 0.3) * size;
    const widths = line.runs.map((run) => runWidth(run, size, tracking));
    const width = widths.reduce((a, b) => a + b, 0) + gap * (line.runs.length - 1);
    return { line, size, tracking, gap, widths, width };
  });
  const maxWidth = Math.max(...lines.map((l) => l.width));

  for (const [i, l] of lines.entries()) {
    if (i > 0) baseline += (l.line.before ?? 1.08) * EM * (l.line.size ?? 1);
    const align = mark.align ?? "left";
    let x = align === "center" ? (maxWidth - l.width) / 2 : 0;
    for (const [j, run] of l.line.runs.entries()) {
      const font = fonts[run.weight];
      const path = font.getPath(run.text, x, baseline, l.size, {
        letterSpacing: l.tracking,
        kerning: true,
      });
      paths.push(path);
      x += l.widths[j] + l.gap;
    }
  }

  const box = paths.reduce(
    (acc, p) => {
      const b = p.getBoundingBox();
      return {
        x1: Math.min(acc.x1, b.x1),
        y1: Math.min(acc.y1, b.y1),
        x2: Math.max(acc.x2, b.x2),
        y2: Math.max(acc.y2, b.y2),
      };
    },
    { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity },
  );
  return { paths, box };
}

function svgFor(mark, app, { paths, box }) {
  // Ground tiles get generous room; transparent artwork stays tight so the
  // ink is what a designer places, not an invisible margin.
  const pad = (app.ground ? (config.groundPad ?? 0.4) : (config.pad ?? 0.16)) * EM;
  const x = box.x1 - pad;
  const y = box.y1 - pad;
  const w = box.x2 - box.x1 + pad * 2;
  const h = box.y2 - box.y1 + pad * 2;
  const r = (n) => Math.round(n * 100) / 100;
  const ink = config.colours[app.ink];
  const ground = app.ground ? config.colours[app.ground] : null;
  const d = paths.map((p) => `    <path d="${p.toPathData(2)}"/>`).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r(x)} ${r(y)} ${r(w)} ${r(h)}" width="${r(w)}" height="${r(h)}">
  <title>${config.name} — ${mark.title} — ${app.title}</title>
${ground ? `  <rect x="${r(x)}" y="${r(y)}" width="${r(w)}" height="${r(h)}" fill="${ground}"/>\n` : ""}  <g fill="${ink}">
${d}
  </g>
</svg>
`;
}

// Rasterise an SVG at a target pixel width. Sharp renders SVG at its
// declared size unless told the density, so the density is set to land on
// the target and the resize is only there to make the width exact.
async function png(svg, width, file) {
  const declared = Number(/width="([\d.]+)"/.exec(svg)[1]);
  const density = Math.ceil((72 * width) / declared) + 1;
  await sharp(Buffer.from(svg), { density })
    .resize({ width })
    .png({ compressionLevel: 9 })
    .toFile(file);
}

let svgs = 0;
let pngs = 0;

for (const mark of config.marks) {
  const laid = layout(mark);
  for (const app of config.applications) {
    const name = `${slug}-${mark.id}-${app.id}`;
    const svg = svgFor(mark, app, laid);
    writeFileSync(join(outDir, `${name}.svg`), svg);
    svgs += 1;
    const widths = (mark.png ?? config.png ?? {})[app.ground ? "ground" : "transparent"] ?? [];
    for (const width of widths) {
      await png(svg, width, join(outDir, `${name}-${width}.png`));
      pngs += 1;
    }
  }
  console.log(`${mark.id}: ${Math.round(laid.box.x2 - laid.box.x1)}×${Math.round(laid.box.y2 - laid.box.y1)} em-units`);
}

for (const asset of config.statics ?? []) {
  const svg = readFileSync(join(brandDir, asset.file), "utf8");
  for (const width of asset.widths) {
    await png(svg, width, join(outDir, `${asset.name}-${width}.png`));
    pngs += 1;
  }
}

console.log(`logo: ${svgs} SVGs + ${pngs} PNGs in ${outDir.replace(root + "/", "")}`);
