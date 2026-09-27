// Renders the 1200×630 Open Graph card (public/og.png) from the brand system,
// so what gets pasted into WhatsApp, Slack or LinkedIn looks like the site.
//
//   node scripts/build-og.mjs
//
// Uses the Chromium that Playwright installs; set CHROME_PATH to override.

import { writeFileSync, mkdtempSync, existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

// Embed the real Poppins rather than trusting the render box to have it.
const fontDir = join(root, "node_modules", "@fontsource", "poppins", "files");
const font = (weight) =>
  readFileSync(join(fontDir, `poppins-latin-${weight}-normal.woff2`)).toString("base64");

const html = `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: Poppins; font-weight: 400; src: url(data:font/woff2;base64,${font(400)}) format("woff2"); }
  @font-face { font-family: Poppins; font-weight: 600; src: url(data:font/woff2;base64,${font(600)}) format("woff2"); }
  @font-face { font-family: Poppins; font-weight: 800; src: url(data:font/woff2;base64,${font(800)}) format("woff2"); }

  * { box-sizing: border-box; margin: 0; }
  body {
    width: 1200px; height: 630px; overflow: hidden; position: relative;
    background: #0a0b0e; font-family: Poppins, sans-serif; color: #f4f0e8;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 64px 72px 72px;
  }
  .grid { position: absolute; inset: 0; opacity: .5;
    background-image: linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
    background-size: 56px 56px;
    -webkit-mask-image: radial-gradient(ellipse 70% 70% at 50% 0%, #000 20%, transparent 100%); }
  .top { position: relative; display: flex; align-items: center; justify-content: space-between; }
  .mark { font-size: 40px; font-weight: 800; letter-spacing: -0.06em; line-height: 1;
          background: linear-gradient(90deg,#3366FF,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E);
          -webkit-background-clip: text; background-clip: text; color: transparent; }
  .eyebrow { font-family: ui-monospace, Menlo, monospace; font-size: 14px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(244,240,232,.55); }
  .headline { position: relative; font-size: 96px; font-weight: 800; letter-spacing: -0.045em; line-height: 0.98; max-width: 12ch; }
  .headline span { color: #7a9bff; }
  .foot { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; }
  .foot p { font-size: 22px; font-weight: 400; color: rgba(244,240,232,.72); max-width: 44ch; line-height: 1.4; }
  .pills { display: flex; gap: 10px; flex: none; }
  .pill { font-family: ui-monospace, Menlo, monospace; font-size: 13px; letter-spacing: .06em; padding: 9px 14px; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; color: rgba(244,240,232,.8); }
  .pill.on { border-color: #3366FF; background: rgba(51,102,255,.14); color: #7a9bff; }
  .rule { position: absolute; left: 0; right: 0; bottom: 0; height: 6px; background: linear-gradient(90deg,#3366FF,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E); }
</style>
<div class="grid"></div>
<div class="top">
  <div class="mark">GOOD WORK.</div>
  <div class="eyebrow">Websites · Agents · Business systems</div>
</div>
<h1 class="headline">Build better.<br><span>Launch faster.</span></h1>
<div class="foot">
  <p>Production-ready websites, AI agents and business systems. Use the tools yourself, or let Goodwork build the complete operation for you.</p>
  <div class="pills"><span class="pill on">£280 Library</span><span class="pill">£888 Studio</span><span class="pill">£2,800 Built</span></div>
</div>
<div class="rule"></div>
`;

const dir = mkdtempSync(join(tmpdir(), "gw-og-"));
const page = join(dir, "og.html");
writeFileSync(page, html);

const out = join(root, "public", "og.png");
const raw = join(dir, "raw.png");

// Headless renders into a viewport shorter than the window size it's given, so
// the card is drawn into an oversized window and cropped to the exact
// 1200×630 body box afterwards. Deterministic, rather than guessing an offset.
execFileSync(
  chrome,
  [
    "--headless",
    "--no-sandbox",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1200,900",
    `--screenshot=${raw}`,
    `file://${page}`,
  ],
  { stdio: "pipe" },
);

const sharp = (await import("sharp")).default;
await sharp(raw)
  .extract({ left: 0, top: 0, width: 1200, height: 630 })
  .png({ compressionLevel: 9 })
  .toFile(out);

console.log(`og: ${out}`);
