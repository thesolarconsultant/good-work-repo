// Generates responsive AVIF/WebP derivatives for every screenshot in public/,
// plus a manifest the <Shot> component reads for srcset and intrinsic size.
//
//   node scripts/optimise-images.mjs        (runs automatically before dev/build)
//   node scripts/optimise-images.mjs --force
//
// The source JPEGs are 2160px wide. Shipping those to a phone is the single
// most expensive thing this site could do, so nothing here is optional.

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const outRoot = join(publicDir, "derived");
const manifestPath = join(root, "src", "data", "imageManifest.json");

// Widths cover: a phone at 2x, a half-width grid cell at 2x, and a
// full-bleed container shot at 2x. Nothing above the source resolution.
const WIDTHS = [640, 960, 1440, 2000];
const SOURCE_DIRS = ["case-studies", "console"];
const force = process.argv.includes("--force");

const manifest = {};
let written = 0;
let skipped = 0;

for (const dir of SOURCE_DIRS) {
  const srcDir = join(publicDir, dir);
  if (!existsSync(srcDir)) continue;

  for (const file of readdirSync(srcDir).sort()) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;

    const srcPath = join(srcDir, file);
    const name = basename(file, extname(file));
    const key = `/${dir}/${file}`;
    const image = sharp(srcPath);
    const { width, height } = await image.metadata();

    const outDir = join(outRoot, dir);
    mkdirSync(outDir, { recursive: true });

    const widths = WIDTHS.filter((w) => w <= width);
    if (widths.length === 0) widths.push(width);

    const srcMtime = statSync(srcPath).mtimeMs;

    for (const w of widths) {
      for (const [format, options] of [
        ["avif", { quality: 52, effort: 5 }],
        ["webp", { quality: 76, effort: 5 }],
      ]) {
        const outPath = join(outDir, `${name}-${w}.${format}`);
        // Regenerate only when the source is newer than the derivative.
        if (!force && existsSync(outPath) && statSync(outPath).mtimeMs >= srcMtime) {
          skipped++;
          continue;
        }
        await sharp(srcPath)
          .resize({ width: w, withoutEnlargement: true })
          [format](options)
          .toFile(outPath);
        written++;
      }
    }

    manifest[key] = {
      width,
      height,
      widths,
      base: `/derived/${dir}/${name}`,
      // A mid-size WebP, used by the single-file preview build where every
      // asset gets inlined as base64 and a full srcset would be absurd.
      flat: `/derived/${dir}/${name}-960.webp`,
    };
  }
}

const previous = existsSync(manifestPath) ? readFileSync(manifestPath, "utf8") : "";
const next = `${JSON.stringify(manifest, null, 2)}\n`;
if (previous !== next) writeFileSync(manifestPath, next);

console.log(
  `images: ${Object.keys(manifest).length} sources, ${written} derivatives written, ${skipped} up to date`,
);
