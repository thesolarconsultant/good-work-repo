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
    background: #fff; font-family: Poppins, sans-serif; color: #111;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 66px 74px 78px;
  }
  .aurora { position: absolute; inset: -20% -10%; filter: blur(90px); opacity: 0.5; }
  .aurora i { position: absolute; display: block; border-radius: 50%; }
  .a1 { width: 460px; height: 460px; left: 2%;  top: 26%; background: rgba(51,102,255,.55); }
  .a2 { width: 380px; height: 380px; left: 32%; top: 40%; background: rgba(122,92,255,.5); }
  .a3 { width: 340px; height: 340px; left: 58%; top: 16%; background: rgba(255,45,179,.38); }
  .a4 { width: 300px; height: 300px; left: 78%; top: 46%; background: rgba(255,107,94,.38); }

  .top { position: relative; display: flex; align-items: flex-start; justify-content: space-between; }
  .mark { font-size: 44px; font-weight: 800; letter-spacing: -0.06em; line-height: 1;
          background: linear-gradient(90deg,#3366FF,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E);
          -webkit-background-clip: text; background-clip: text; color: transparent; }
  .eyebrow { font-size: 15px; font-weight: 600; letter-spacing: 0.26em; text-transform: uppercase; color: #555; }

  .headline { position: relative; font-size: 74px; font-weight: 800; letter-spacing: -0.045em; line-height: 1.0; max-width: 15ch; }
  .headline em { font-style: normal;
                 background: linear-gradient(90deg,#3366FF,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E);
                 -webkit-background-clip: text; background-clip: text; color: transparent; }
  .dot { display: inline-block; width: 0.13em; height: 0.13em; border-radius: 50%; background: #FF6B5E; vertical-align: baseline; }

  .foot { position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; }
  .foot p { font-size: 20px; font-weight: 500; color: #555; max-width: 60ch; line-height: 1.45; }
  /* Anchored to the 630px body box, not the viewport — headless reports a
     shorter viewport than the window size it was given. */
  .rule { position: absolute; left: 0; right: 0; bottom: 0; height: 10px;
          background: linear-gradient(90deg,#3366FF,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E); }
</style>
<div class="aurora"><i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i></div>

<div class="top">
  <div class="mark">GOOD WORK.</div>
  <div class="eyebrow">Brand · Web · Systems</div>
</div>

<h1 class="headline">We make businesses look and <em>work better</em><span class="dot"></span></h1>

<div class="foot">
  <p>Brand identity, hand-built websites, and the systems that keep enquiries, content and quoting running after launch.</p>
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
