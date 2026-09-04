// Responsive photography for a client brand folder.
//
//   node scripts/build-brand-photos.mjs <brand-slug>
//   e.g. npm run brand:photos -- beauty-heaven-hub
//
// Reads every image in public/goodwork/brands/<slug>/photos/ and writes WebP
// copies into photos/derived/ at 480, 800 and 1200 wide, plus one at the
// photo's own width when that is smaller. The pages reference the derived
// files through `srcset`, so a phone pulls the 480 and a desktop the largest.
//
// Run this after adding or replacing any photograph, and commit the output —
// like the rest of the brand folder, the deploy is a static copy and must not
// depend on this script having run.
//
// The manifest it writes alongside them records each source's native size, so
// the markup can carry width/height and the page never jumps as images land.

import { readdirSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/build-brand-photos.mjs <brand-slug>");
  process.exit(1);
}

const photoDir = join(root, "public", "goodwork", "brands", slug, "photos");
if (!existsSync(photoDir)) {
  console.error(`No photos folder at ${photoDir}`);
  process.exit(1);
}
const outDir = join(photoDir, "derived");
mkdirSync(outDir, { recursive: true });

const WIDTHS = [480, 800, 1200];
const SOURCES = /\.(png|jpe?g)$/i;

const manifest = {};
let written = 0;
let saved = 0;

for (const file of readdirSync(photoDir).filter((f) => SOURCES.test(f))) {
  const name = basename(file, extname(file));
  const src = join(photoDir, file);
  const meta = await sharp(src).metadata();

  // Never upscale: a 400px phone screenshot gets one 400px copy, not three
  // blurry enlargements of it.
  const widths = [...new Set(WIDTHS.filter((w) => w < meta.width).concat(meta.width))].sort(
    (a, b) => a - b,
  );

  const out = [];
  for (const width of widths) {
    const dest = join(outDir, `${name}-${width}.webp`);
    await sharp(src).resize({ width }).webp({ quality: 78, effort: 6 }).toFile(dest);
    out.push({ w: width, kb: Math.round(statSync(dest).size / 1024) });
    written += 1;
  }
  saved += statSync(src).size - statSync(join(outDir, `${name}-${widths.at(-1)}.webp`)).size;
  manifest[name] = { native: `${meta.width}x${meta.height}`, widths: out.map((o) => ({ w: o.w })) };
  console.log(`${name.padEnd(20)} ${meta.width}x${meta.height}  ${out.map((o) => `${o.w}w:${o.kb}kB`).join("  ")}`);

  if (meta.width < 1000) {
    console.warn(`  ↳ only ${meta.width}px wide — ask for the original; it will be soft in a full-width arch`);
  }
}

writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`photos: ${written} WebP files in photos/derived/ (${Math.round(saved / 1024)}kB lighter than the sources at full size)`);
