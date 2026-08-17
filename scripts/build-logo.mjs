// Exports the logo as high-resolution artwork for anyone outside this repo:
// printers, sign-makers, merch suppliers, social profiles, decks.
//
//   npm run logo
//
// The logo on the site is live text — Poppins ExtraBold with the brand
// gradient — so it has no fixed resolution to "improve". This renders it from
// the same type and the same gradient at whatever size is asked for, which is
// exact: every edge is computed, not interpolated and not guessed. Running the
// mark through an image upscaler would do the opposite, because generative
// models reliably mangle letterforms.
//
// Output: brand/ (not part of the site build — these are files to hand over).

import { writeFileSync, mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "brand");

const CANDIDATES = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].filter(Boolean);

const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.");
  process.exit(1);
}

const fontDir = join(root, "node_modules", "@fontsource", "poppins", "files");
const font = (weight) =>
  readFileSync(join(fontDir, `poppins-latin-${weight}-normal.woff2`)).toString("base64");

// Brand values, kept identical to src/styles.css.
const GRADIENT = "linear-gradient(90deg,#3366FF 0%,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E 100%)";
const SILVER_ON_LIGHT =
  "linear-gradient(100deg,#6B7280 0%,#4E555F 14%,#868D97 34%,#545B65 52%,#7C838D 72%,#4E555F 100%)";
// The descriptor has to invert for dark backgrounds — the on-light silver is
// deliberately dark and would vanish on black.
const SILVER_ON_DARK =
  "linear-gradient(100deg,#C3C9D2 0%,#8D949E 14%,#EEF1F5 34%,#949BA5 52%,#D3D9E1 72%,#98A0AA 100%)";

// Render size. Everything below is expressed as a ratio of this, so the
// proportions match the site exactly at any output width. Set so the natural
// render comes out wider than the largest export — every PNG is then a
// downsample, never an enlargement.
const BASE = 700;
const PAD = Math.round(BASE * 0.12);

function page({ descriptor, silver }) {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: Poppins; font-weight: 600; src: url(data:font/woff2;base64,${font(600)}) format("woff2"); }
  @font-face { font-family: Poppins; font-weight: 800; src: url(data:font/woff2;base64,${font(800)}) format("woff2"); }
  * { margin: 0; box-sizing: border-box; }
  html, body { background: transparent; }
  body { padding: ${PAD}px; font-family: Poppins, sans-serif; }
  .lockup { display: inline-flex; flex-direction: column; align-items: center; line-height: 1; }
  .wordmark {
    font-size: ${BASE}px; font-weight: 800; letter-spacing: -0.06em; line-height: 0.92;
    background: ${GRADIENT};
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
  .descriptor {
    margin-top: ${Math.round(BASE * 0.19)}px; margin-right: -0.34em;
    font-size: ${Math.round(BASE * 0.2727)}px; font-weight: 600;
    letter-spacing: 0.34em; text-transform: uppercase; line-height: 1; white-space: nowrap;
    background: ${silver === "dark" ? SILVER_ON_DARK : SILVER_ON_LIGHT};
    -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
  }
</style>
<div class="lockup">
  <div class="wordmark">GOOD WORK.</div>
  ${descriptor ? '<div class="descriptor">Creative agency</div>' : ""}
</div>
`;
}

function render(html, file) {
  execFileSync(
    chrome,
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      // ARGB with a zero alpha channel — without this the page is painted
      // opaque white and there is no transparency to keep.
      "--default-background-color=00000000",
      "--window-size=6000,2400",
      `--screenshot=${file}`,
      `file://${html}`,
    ],
    { stdio: "pipe" },
  );
}

const tmp = mkdtempSync(join(tmpdir(), "gw-logo-"));
mkdirSync(outDir, { recursive: true });

// Transparent artwork goes up to 4096 for print; the flattened convenience
// files stop at 2048, which is past anything they get used for on screen.
const WIDTHS = [1024, 2048, 4096];
const FLAT_WIDTHS = [1024, 2048];

const VARIANTS = [
  // The wordmark has no descriptor, so the silver never applies to it and a
  // second rendering would be a byte-identical duplicate.
  { id: "lockup", descriptor: true, silvers: ["light", "dark"] },
  { id: "wordmark", descriptor: false, silvers: ["light"] },
];

let written = 0;

for (const variant of VARIANTS) {
  for (const silver of variant.silvers) {
    const htmlPath = join(tmp, `${variant.id}-${silver}.html`);
    const shotPath = join(tmp, `${variant.id}-${silver}.png`);
    writeFileSync(htmlPath, page({ descriptor: variant.descriptor, silver }));
    render(htmlPath, shotPath);

    // Trim the transparent surround down to the ink, then put an even margin
    // back, so the artwork is tightly and consistently framed.
    const trimmed = await sharp(shotPath)
      .trim({ threshold: 1 })
      .toBuffer();
    const { width, height } = await sharp(trimmed).metadata();
    const margin = Math.round(width * 0.04);
    const padded = await sharp(trimmed)
      .extend({
        top: margin, bottom: margin, left: margin, right: margin,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    // For the lockup, "onlight" is the dark-silver artwork for white and pale
    // backgrounds and "ondark" is the light-silver one. The wordmark works on
    // either, so it's just "transparent".
    const facing = variant.descriptor ? (silver === "dark" ? "ondark" : "onlight") : "transparent";
    const flats = variant.descriptor
      ? [silver === "dark" ? { name: "black", bg: "#111111" } : { name: "white", bg: "#FFFFFF" }]
      : [
          { name: "white", bg: "#FFFFFF" },
          { name: "black", bg: "#111111" },
        ];

    const full = width + margin * 2;
    for (const w of WIDTHS) {
      if (w > full) {
        console.warn(`  skipped ${w}px — source is only ${full}px wide, raise BASE`);
        continue;
      }
      await sharp(padded)
        .resize({ width: w })
        .png({ compressionLevel: 9 })
        .toFile(join(outDir, `goodwork-${variant.id}-${facing}-${w}.png`));
      written += 1;
    }

    for (const flat of flats) {
      for (const w of FLAT_WIDTHS) {
        await sharp(padded)
          .resize({ width: w })
          .flatten({ background: flat.bg })
          .png({ compressionLevel: 9 })
          .toFile(join(outDir, `goodwork-${variant.id}-${flat.name}-${w}.png`));
        written += 1;
      }
    }
    console.log(`${variant.id}/${facing}: rendered ${full}x${height + margin * 2}`);
  }
}

// A vector master alongside the PNGs. The font is embedded so it renders
// correctly without Poppins installed; for print, send a PNG or convert the
// text to outlines in a vector editor first.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300" width="1000" height="300">
  <title>GOOD WORK. — creative agency</title>
  <defs>
    <style>
      @font-face { font-family: PoppinsGW; font-weight: 600; src: url(data:font/woff2;base64,${font(600)}) format("woff2"); }
      @font-face { font-family: PoppinsGW; font-weight: 800; src: url(data:font/woff2;base64,${font(800)}) format("woff2"); }
    </style>
    <linearGradient id="gwGradient" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3366FF"/><stop offset="0.32" stop-color="#7A5CFF"/>
      <stop offset="0.68" stop-color="#FF2DB3"/><stop offset="1" stop-color="#FF6B5E"/>
    </linearGradient>
    <linearGradient id="gwSilver" x1="0" y1="0" x2="1000" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6B7280"/><stop offset="0.14" stop-color="#4E555F"/>
      <stop offset="0.34" stop-color="#868D97"/><stop offset="0.52" stop-color="#545B65"/>
      <stop offset="0.72" stop-color="#7C838D"/><stop offset="1" stop-color="#4E555F"/>
    </linearGradient>
  </defs>
  <text x="500" y="170" text-anchor="middle" font-family="PoppinsGW, Poppins, sans-serif"
        font-size="180" font-weight="800" letter-spacing="-10.8" fill="url(#gwGradient)">GOOD WORK.</text>
  <text x="500" y="245" text-anchor="middle" font-family="PoppinsGW, Poppins, sans-serif"
        font-size="49" font-weight="600" letter-spacing="16.7" fill="url(#gwSilver)">CREATIVE AGENCY</text>
</svg>
`;
writeFileSync(join(outDir, "goodwork-lockup.svg"), svg);

rmSync(tmp, { recursive: true, force: true });
console.log(`logo: ${written} PNGs + 1 SVG in brand/`);
