import { chromium } from "/home/user/good-work-repo/node_modules/playwright-core/index.mjs";
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const SCR = process.argv[2] || HERE;
const B = "/home/user/good-work-repo/public/goodwork/brands/beauty-heaven-hub";
const FONTS = "file://" + path.join(B, "fonts");

/* The wordmark goes in as markup, not as an <img>. Inlined it inherits the
   page's own colour handling and, more to the point, it is the only way a
   file:// page reliably gets it — a linked one is a subresource and can be
   refused before it draws. */
const mark = fs.readFileSync(path.join(B, "logo/beauty-heaven-hub-wordmark-gold.svg"), "utf8")
  .replace(/width="\d+"\s*height="\d+"/, 'width="100%" height="auto" class="mark"');

const page1 = (s) => `<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:Jost;src:url("${FONTS}/Jost-Light.woff2") format("woff2");font-weight:300;font-display:block}
@font-face{font-family:Jost;src:url("${FONTS}/Jost-Medium.woff2") format("woff2");font-weight:500;font-display:block}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{background:#24211E;color:#F4F0E9;font-family:Jost,sans-serif;font-weight:300;
  display:grid;place-items:center;overflow:hidden}
/* the fluted panel — the brand's own texture, held right at the edge of visible */
body::before{content:"";position:fixed;inset:0;
  background:repeating-linear-gradient(90deg,#312D28 0 2px,transparent 2px 2.6%);opacity:.45}
.card{position:relative;text-align:center;width:${s.mark}}
.mark{display:block;width:100%;height:auto}
.rule{width:38%;height:2px;background:#C9A65C;opacity:.5;margin:${s.g1} auto ${s.g2}}
.line{font-size:${s.fs};letter-spacing:.15em;text-transform:uppercase;line-height:1.85;
  white-space:nowrap}
.addr{font-size:calc(${s.fs}*.78);letter-spacing:.22em;text-transform:uppercase;
  color:#B9AFA2;margin-top:calc(${s.fs}*1.9);white-space:nowrap}
</style>
<div class="card">
  ${mark}
  <div class="rule"></div>
  <p class="line">Consultations with Hollie</p>
  <p class="line">Tuesdays &amp; Thursdays</p>
  <p class="addr">[street] &middot; Wombwell, Barnsley</p>
</div>`;

/* A 30-second reel does not live in one aspect ratio: the reel, the grid,
   the 4:5 that the feed actually crops to, and a landscape cut for the site. */
const sizes = [
  { name: "endcard-9x16-2160x3840", w: 2160, h: 3840, mark: "58%", fs: "50px", g1: "9%", g2: "8%" },
  { name: "endcard-4x5-2048x2560",  w: 2048, h: 2560, mark: "56%", fs: "44px", g1: "9%", g2: "8%" },
  { name: "endcard-1x1-2048",       w: 2048, h: 2048, mark: "52%", fs: "40px", g1: "9%", g2: "8%" },
  { name: "endcard-16x9-3840x2160", w: 3840, h: 2160, mark: "40%", fs: "44px", g1: "7%", g2: "6%" },
];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const out = path.join(SCR, "endcards");
fs.mkdirSync(out, { recursive: true });

for (const s of sizes) {
  const file = path.join(out, s.name + ".html");
  fs.writeFileSync(file, page1(s));
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  await page.goto("file://" + file, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const ok = await page.evaluate(() => ({
    jost: document.fonts.check("300 50px Jost"),
    markW: document.querySelector("svg.mark")?.getBoundingClientRect().width | 0,
  }));
  await page.screenshot({ path: path.join(out, s.name + ".png") });
  console.log("✓", s.name, `${s.w}×${s.h}`, "jost:", ok.jost, "mark:", ok.markW + "px");
  await page.close();
  fs.unlinkSync(file);
}
await browser.close();
