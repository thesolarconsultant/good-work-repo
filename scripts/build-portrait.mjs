// Brands a portrait as GOOD WORK. — team card, avatar and banner in one pass.
//
//   npm run portrait -- --photo ./path/to/headshot.jpg --name "Your Name" --role "Founder"
//   npm run portrait                       # no --photo: renders the design with a placeholder
//
// Options:
//   --focus-y <0-100>  where the face sits vertically, for the tighter crops (default 32)
//   --slug <name>      output filename stem (default: from --name, else "portrait")
//   --on-light         dark type on white, for light-background use
//
// Same pipeline as build-og.mjs and build-logo.mjs: real Poppins, real gradient,
// Chromium renders it, sharp crops it. Nothing is approximated.

import { writeFileSync, mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, extname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "brand", "portraits");

const arg = (flag, fallback = null) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--")
    ? process.argv[i + 1]
    : fallback;
};
const has = (flag) => process.argv.includes(flag);

const photo = arg("--photo");
const name = arg("--name", "");
const role = arg("--role", "Creative agency");
const focusY = Number(arg("--focus-y", "32"));
const onLight = has("--on-light");
const slug =
  arg("--slug") || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "portrait");

const CHROME = [
  process.env.CHROME_PATH,
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) {
  console.error("No Chromium found. Set CHROME_PATH.");
  process.exit(1);
}

const fontDir = join(root, "node_modules", "@fontsource", "poppins", "files");
const font = (w) => readFileSync(join(fontDir, `poppins-latin-${w}-normal.woff2`)).toString("base64");

// Inline the photo so the render never depends on a path resolving.
let photoUri = null;
if (photo) {
  if (!existsSync(photo)) {
    console.error(`Photo not found: ${photo}`);
    process.exit(1);
  }
  const ext = extname(photo).slice(1).toLowerCase();
  const mime = { jpg: "jpeg", jpeg: "jpeg", png: "png", webp: "webp" }[ext];
  if (!mime) {
    console.error(`Unsupported photo type: .${ext}`);
    process.exit(1);
  }
  photoUri = `data:image/${mime};base64,${readFileSync(photo).toString("base64")}`;
}

const GRADIENT = "linear-gradient(90deg,#3366FF 0%,#7A5CFF 32%,#FF2DB3 68%,#FF6B5E 100%)";
const SILVER_DARK = "linear-gradient(100deg,#C3C9D2 0%,#8D949E 14%,#EEF1F5 34%,#949BA5 52%,#D3D9E1 72%,#98A0AA 100%)";
const SILVER_LIGHT = "linear-gradient(100deg,#6B7280 0%,#4E555F 14%,#868D97 34%,#545B65 52%,#7C838D 72%,#4E555F 100%)";

const ink = onLight ? "#111111" : "#FFFFFF";
const ground = onLight ? "#FFFFFF" : "#111111";
const silver = onLight ? SILVER_LIGHT : SILVER_DARK;

// Grain, exactly as the site's dark panels use it.
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")";

const media = photoUri
  ? `<img class="photo" src="${photoUri}" alt="">`
  : `<div class="placeholder"><span>drop your<br>headshot here</span></div>`;

function page({ w, h, layout }) {
  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face{font-family:PoppinsGW;font-weight:600;src:url(data:font/woff2;base64,${font(600)}) format("woff2")}
  @font-face{font-family:PoppinsGW;font-weight:800;src:url(data:font/woff2;base64,${font(800)}) format("woff2")}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;overflow:hidden;background:${ground};font-family:PoppinsGW,sans-serif}
  .frame{position:relative;width:${w}px;height:${h}px;overflow:hidden;background:${ground}}

  .photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% ${focusY}%}
  .placeholder{position:absolute;inset:0;display:grid;place-items:center;
    background:${onLight
      ? "radial-gradient(120% 90% at 50% 20%,#eeeeee,#d8d8d8)"
      : "radial-gradient(120% 90% at 50% 20%,#2b2b2b,#141414)"};
    color:${onLight ? "rgba(17,17,17,.32)" : "rgba(255,255,255,.35)"};font-size:${Math.round(w * 0.032)}px;font-weight:600;
    letter-spacing:.18em;text-transform:uppercase;text-align:center;line-height:1.8}

  /* The subject stays photographic; the brand arrives at the edges. */
  .scrim{position:absolute;inset:0;background:
    linear-gradient(to top, ${ground} 0%, ${ground}E6 12%, ${ground}00 46%)}
  .grain{position:absolute;inset:0;opacity:.13;background-image:${GRAIN};mix-blend-mode:overlay}
  .rule{position:absolute;left:0;right:0;bottom:0;height:${Math.max(6, Math.round(h * 0.008))}px;background:${GRADIENT}}

  .lockup{position:absolute;left:${Math.round(w * 0.07)}px;bottom:${Math.round(h * 0.075)}px;
    display:flex;flex-direction:column;align-items:flex-start}
  .wordmark{font-size:${Math.round(w * 0.082)}px;font-weight:800;letter-spacing:-.06em;line-height:.92;
    background:${GRADIENT};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
  .descriptor{margin-top:${Math.round(w * 0.016)}px;font-size:${Math.round(w * 0.0224)}px;font-weight:600;
    letter-spacing:.34em;text-transform:uppercase;white-space:nowrap;margin-right:-.34em;
    background:${silver};-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}

  .person{position:absolute;right:${Math.round(w * 0.07)}px;bottom:${Math.round(h * 0.075)}px;text-align:right}
  .person .n{font-size:${Math.round(w * 0.042)}px;font-weight:800;letter-spacing:-.03em;color:${ink};line-height:1}
  .person .r{margin-top:${Math.round(w * 0.012)}px;font-size:${Math.round(w * 0.02)}px;font-weight:600;
    letter-spacing:.2em;text-transform:uppercase;color:${onLight ? "#5F666F" : "rgba(255,255,255,.55)"}}
  .dot{display:inline-block;width:.34em;height:.34em;border-radius:50%;background:#FF6B5E;margin-left:.08em}

  /* Avatar: no words, just the mark as a gradient ring. */
  .ring{position:absolute;inset:0;border-radius:50%;padding:${Math.round(w * 0.022)}px;background:${GRADIENT};
    -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
  .round{border-radius:50%;overflow:hidden}
</style>
<div class="frame ${layout === "avatar" ? "round" : ""}">
  ${media}
  ${layout === "avatar" ? "" : '<div class="scrim"></div>'}
  <div class="grain"></div>
  ${layout === "avatar" ? '<div class="ring"></div>' : '<div class="rule"></div>'}
  ${layout === "card" || layout === "banner" ? `
    <div class="lockup">
      <div class="wordmark">GOOD WORK.</div>
      <div class="descriptor">Creative agency</div>
    </div>
    ${name ? `<div class="person"><div class="n">${name}<span class="dot"></span></div><div class="r">${role}</div></div>` : ""}
  ` : ""}
</div>`;
}

const tmp = mkdtempSync(join(tmpdir(), "gw-portrait-"));
mkdirSync(outDir, { recursive: true });

const VARIANTS = [
  { id: "card", w: 1200, h: 1500 },
  { id: "avatar", w: 1024, h: 1024 },
  { id: "banner", w: 1584, h: 640 },
];

for (const v of VARIANTS) {
  const html = join(tmp, `${v.id}.html`);
  const shot = join(tmp, `${v.id}.png`);
  writeFileSync(html, page({ w: v.w, h: v.h, layout: v.id }));

  execFileSync(CHROME, [
    "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--default-background-color=00000000",
    `--window-size=${v.w},${v.h + 400}`,
    `--screenshot=${shot}`,
    `file://${html}`,
  ], { stdio: "pipe" });

  // Chromium's viewport is shorter than the window it reports, so crop to the
  // exact frame box rather than trusting the screenshot's height.
  await sharp(shot)
    .extract({ left: 0, top: 0, width: v.w, height: v.h })
    .png({ compressionLevel: 9 })
    .toFile(join(outDir, `${slug}-${v.id}.png`));
}

rmSync(tmp, { recursive: true, force: true });
console.log(`portrait: ${VARIANTS.length} files in brand/portraits/ (${slug}-*)${photo ? "" : " — placeholder, pass --photo for the real thing"}`);
