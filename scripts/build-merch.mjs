// GOOD WORK. marks for garments and print.
//
//   npm run merch
//
// The website wordmark is a wide horizontal lockup with a smooth four-stop
// gradient. Neither of those survives contact with a garment: a cap crown is
// roughly square, and thread cannot do a smooth gradient at all. This renders
// the shapes and treatments that actually go to an embroiderer or printer.
//
// Shapes:   cap-badge (stacked), monogram (GW.), chest (horizontal lockup)
// Finishes: gradient  — DTF / digital print / screen, where a ramp is possible
//           stepped   — the ramp snapped to the four brand colours, one per
//                       letter, so it reads as the gradient in solid threads
//           white / black — the one-colour workhorses

import { writeFileSync, mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "brand", "merch");

const CHROME = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) { console.error("No Chromium found. Set CHROME_PATH."); process.exit(1); }

const fontDir = join(root, "node_modules", "@fontsource", "poppins", "files");
const font = (w) => readFileSync(join(fontDir, `poppins-latin-${w}-normal.woff2`)).toString("base64");

const BRAND = ["#3366FF", "#7A5CFF", "#FF2DB3", "#FF6B5E"];
const GRADIENT = `linear-gradient(90deg,${BRAND[0]} 0%,${BRAND[1]} 32%,${BRAND[2]} 68%,${BRAND[3]} 100%)`;

// Snap each character to the brand colour its position in the ramp lands on.
// Four thread colours, stepping left to right — the gradient made stitchable.
function stepped(text) {
  const chars = [...text];
  const letters = chars.filter((c) => c !== " ").length;
  let i = 0;
  return chars
    .map((c) => {
      if (c === " ") return " ";
      const t = letters > 1 ? i++ / (letters - 1) : 0;
      return `<span style="color:${BRAND[Math.min(3, Math.round(t * 3))]}">${c}</span>`;
    })
    .join("");
}

const gradientStyle =
  `background:${GRADIENT};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent`;

function mark(shape, finish) {
  const solid = finish === "white" ? "#FFFFFF" : finish === "black" ? "#111111" : null;
  const paint = (text) => {
    if (finish === "stepped") return stepped(text);
    return text;
  };
  const style = finish === "gradient" ? gradientStyle : solid ? `color:${solid}` : "";

  if (shape === "monogram") {
    return `<div class="mono" style="${style}">${paint("GW")}<i class="dot"></i></div>`;
  }
  if (shape === "cap-badge") {
    return `<div class="stack" style="${style}">
      <div class="l1">${paint("GOOD")}</div>
      <div class="l2">${paint("WORK.")}</div>
      <div class="desc">Creative agency</div>
    </div>`;
  }
  return `<div class="chest">
    <div class="word" style="${style}">${paint("GOOD WORK.")}</div>
    <div class="desc">Creative agency</div>
  </div>`;
}

function page(shape, finish, w, h) {
  const onDark = finish === "white";
  const descColour = finish === "white" ? "rgba(255,255,255,.75)"
    : finish === "black" ? "#4E555F"
    : finish === "stepped" ? "#4E555F" : "#6B7280";
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face{font-family:PoppinsGW;font-weight:600;src:url(data:font/woff2;base64,${font(600)}) format("woff2")}
  @font-face{font-family:PoppinsGW;font-weight:800;src:url(data:font/woff2;base64,${font(800)}) format("woff2")}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;background:transparent;font-family:PoppinsGW,sans-serif}
  body{display:grid;place-items:center;padding:60px}
  .dot{display:inline-block;width:.2em;height:.2em;border-radius:50%;background:#FF6B5E;
       vertical-align:baseline;margin-left:.06em}

  .mono{font-size:300px;font-weight:800;letter-spacing:-.07em;line-height:.9}
  .stack{text-align:center;line-height:.86}
  .stack .l1,.stack .l2{font-size:200px;font-weight:800;letter-spacing:-.06em}
  .chest .word{font-size:150px;font-weight:800;letter-spacing:-.06em;line-height:.92;white-space:nowrap}
  .desc{margin-top:.9em;font-size:34px;font-weight:600;letter-spacing:.34em;
        text-transform:uppercase;white-space:nowrap;margin-right:-.34em;color:${descColour};
        -webkit-text-fill-color:${descColour}}
  .chest{text-align:left}
  .chest .desc{text-align:center}
</style>
${mark(shape, finish)}`;
}

const tmp = mkdtempSync(join(tmpdir(), "gw-merch-"));
mkdirSync(outDir, { recursive: true });

const SHAPES = [
  { id: "cap-badge", w: 1800, h: 1400 },
  { id: "monogram", w: 1400, h: 1000 },
  { id: "chest", w: 2600, h: 900 },
];
const FINISHES = ["gradient", "stepped", "white", "black"];

let n = 0;
for (const s of SHAPES) {
  for (const f of FINISHES) {
    const html = join(tmp, `${s.id}-${f}.html`);
    const shot = join(tmp, `${s.id}-${f}.png`);
    writeFileSync(html, page(s.id, f, s.w, s.h));
    execFileSync(CHROME, [
      "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=1", "--default-background-color=00000000",
      `--window-size=${s.w},${s.h}`, `--screenshot=${shot}`, `file://${html}`,
    ], { stdio: "pipe" });

    // Trim to the ink, then restore an even margin.
    const trimmed = await sharp(shot).trim({ threshold: 1 }).toBuffer();
    const { width } = await sharp(trimmed).metadata();
    const m = Math.round(width * 0.05);
    await sharp(trimmed)
      .extend({ top: m, bottom: m, left: m, right: m, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(join(outDir, `goodwork-${s.id}-${f}.png`));
    n++;
  }
}

rmSync(tmp, { recursive: true, force: true });
console.log(`merch: ${n} marks in brand/merch/`);
