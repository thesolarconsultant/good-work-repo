// Device photographs for the site. A laptop and a phone were rendered in
// Higgsfield with a flat green screen (brand/devices/). This puts each
// showcase project's real screenshot on the laptop's screen, and cuts the
// phone out with a clear screen so live markup can show through it. Nothing
// on a screen is generated.
//
//   npm run devices   -> public/devices/ and src/data/phoneFrame.json
//
// `npm run images` then makes the responsive sizes; it runs before every build.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { LAPTOP_SHOTS } from "../src/data/devices.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "brand", "devices");
const outDir = join(root, "public", "devices");
mkdirSync(outDir, { recursive: true });

// The showcase panels are 1.12:1, and the laptop takes this share of the width.
const PANEL_ASPECT = 1.12;
const LAPTOP_SHARE = 0.86;

const median = (values) => [...values].sort((a, b) => a - b)[values.length >> 1];
const byte = (v) => Math.max(0, Math.min(255, Math.round(v)));

async function load(file) {
  const { data, info } = await sharp(join(sourceDir, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const rgb = (x, y) => {
    const i = (y * w + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const lum = (x, y) => {
    const i = (y * w + x) * 3;
    return (data[i] + data[i + 1] + data[i + 2]) / 3;
  };
  return { data, w, h: info.height, rgb, lum };
}

/** How much of each pixel is green screen (0 to 1), the pure green, and the screen's box. */
function greenKey({ w, h, rgb }) {
  const samples = [];
  for (let i = 0; i < w * h; i += 5) {
    const p = rgb(i % w, Math.floor(i / w));
    if (p[1] > 200 && p[0] < 90 && p[2] < 90) samples.push(p);
  }
  const green = [0, 1, 2].map((c) => median(samples.map((p) => p[c])));
  const span = green[1] - Math.max(green[0], green[2]);
  const key = new Float32Array(w * h);
  const box = { x0: w, y0: h, x1: -1, y1: -1 };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const [r, g, b] = rgb(x, y);
      let k = (g - Math.max(r, b)) / span;
      k = k < 0.06 ? 0 : k > 0.94 ? 1 : k;
      key[y * w + x] = k;
      if (k > 0.5) {
        box.x0 = Math.min(box.x0, x);
        box.x1 = Math.max(box.x1, x);
        box.y0 = Math.min(box.y0, y);
        box.y1 = Math.max(box.y1, y);
      }
    }
  box.w = box.x1 - box.x0 + 1;
  box.h = box.y1 - box.y0 + 1;
  return { green, key, box };
}

/**
 * A pixel that is k parts green screen is k·green + (1−k)·bezel, so taking
 * k·green away leaves the bezel's share. Any green that survives is spill.
 */
function bezelShare(pixel, k, green) {
  const share = pixel.map((v, c) => Math.max(0, v - k * green[c]));
  share[1] = Math.min(share[1], Math.max(share[0], share[2]));
  return share;
}

/** The studio grey, from patches in the given corners. */
function studioGrey(img, corners) {
  const values = [];
  for (const [cx, cy] of corners) for (let y = cy; y < cy + 40; y++) for (let x = cx; x < cx + 40; x++) values.push(img.lum(x, y));
  return median(values);
}

async function laptopPhotos() {
  const img = await load("laptop-green.webp");
  const { green, key, box } = greenKey(img);

  // The laptop and its shadow, then a frame of the panel's shape around it,
  // a touch below centre so the shadow has room.
  const grey = studioGrey(img, [[0, 0], [img.w - 40, 0], [0, img.h - 40], [img.w - 40, img.h - 40]]);
  const seen = { x0: img.w, y0: img.h, x1: -1, y1: -1 };
  for (let y = 0; y < img.h; y++)
    for (let x = 0; x < img.w; x++)
      if (grey - img.lum(x, y) > 28) {
        seen.x0 = Math.min(seen.x0, x);
        seen.x1 = Math.max(seen.x1, x);
        seen.y0 = Math.min(seen.y0, y);
        seen.y1 = Math.max(seen.y1, y);
      }
  const width = Math.min(img.w, Math.round((seen.x1 - seen.x0) / LAPTOP_SHARE));
  const height = Math.min(img.h, Math.round(width / PANEL_ASPECT));
  const cx = (seen.x0 + seen.x1) / 2;
  const cy = (seen.y0 + seen.y1) / 2;
  const crop = {
    left: Math.max(0, Math.min(img.w - width, Math.round(cx - width / 2))),
    top: Math.max(0, Math.min(img.h - height, Math.round(cy - height / 2 + height * 0.02))),
    width,
    height,
  };

  for (const [id, shot] of Object.entries(LAPTOP_SHOTS)) {
    // The screenshot covers the screen, keeping the top of the page in view.
    const sw = box.w + 2;
    const sh = box.h + 2;
    const screen = await sharp(join(root, "public", shot))
      .resize({ width: sw, height: sh, fit: "cover", position: "top", kernel: "lanczos3" })
      .removeAlpha()
      .raw()
      .toBuffer();
    const pixels = Buffer.from(img.data);
    for (let y = Math.max(0, box.y0 - 6); y <= Math.min(img.h - 1, box.y1 + 6); y++)
      for (let x = Math.max(0, box.x0 - 6); x <= Math.min(img.w - 1, box.x1 + 6); x++) {
        const k = key[y * img.w + x];
        const j = (Math.min(sh - 1, Math.max(0, y - box.y0 + 1)) * sw + Math.min(sw - 1, Math.max(0, x - box.x0 + 1))) * 3;
        const s = [screen[j], screen[j + 1], screen[j + 2]];
        const p = k >= 1 ? s : bezelShare(img.rgb(x, y), k, green).map((v, c) => v + k * s[c]);
        const i = (y * img.w + x) * 3;
        pixels[i] = byte(p[0]);
        pixels[i + 1] = byte(p[1]);
        pixels[i + 2] = byte(p[2]);
      }
    await sharp(pixels, { raw: { width: img.w, height: img.h, channels: 3 } })
      .extract(crop)
      .jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: "4:4:4" })
      .toFile(join(outDir, `${id}-laptop.jpg`));
  }
  return Object.keys(LAPTOP_SHOTS).length;
}

async function phoneFrame() {
  const img = await load("phone-green.webp");
  const { green, key, box } = greenKey(img);
  const grey = studioGrey(img, [[0, 0], [img.w - 40, 0]]);

  // The body's sides, from the rows beside the screen, buttons included.
  let left = img.w;
  let right = -1;
  for (let y = box.y0; y <= box.y1; y++)
    for (let x = 0; x < img.w; x++)
      if (grey - img.lum(x, y) > 30) {
        left = Math.min(left, x);
        right = Math.max(right, x);
      }

  // Its top and bottom. The studio shading under a floating phone is dark
  // enough to pass for body, so take the outermost near-black row above and
  // below the screen, as a median across the phone's width.
  const darkRow = (y) => {
    let n = 0;
    for (let x = box.x0; x <= box.x1; x++) if (grey - img.lum(x, y) > 40) n++;
    return n > box.w * 0.2;
  };
  let top = box.y0;
  let bottom = box.y1;
  while (top > 0 && darkRow(top - 1)) top--;
  while (bottom < img.h - 1 && darkRow(bottom + 1)) bottom++;
  const outermostBlack = (from, to, step) => {
    const rows = [];
    for (let x = box.x0 + 40; x <= box.x1 - 40; x += 3)
      for (let y = from; y !== to; y += step)
        if (img.lum(x, y) < 70) {
          rows.push(y);
          break;
        }
    return median(rows);
  };
  bottom = Math.min(bottom, outermostBlack(Math.min(img.h - 1, bottom + 12), box.y1, -1));
  top = Math.max(top, outermostBlack(Math.max(0, top - 12), box.y0, 1));

  const f = { x0: left - 6, y0: top - 1, x1: right + 6, y1: bottom + 1 };
  const fw = f.x1 - f.x0 + 1;
  const fh = f.y1 - f.y0 + 1;

  // The grey behind each row, from the frame's outer columns.
  const rowGrey = [];
  for (let y = 0; y < fh; y++) {
    const edge = [];
    for (let x = 0; x < 3; x++) for (const X of [f.x0 + x, f.x1 - x]) edge.push(img.rgb(X, y + f.y0));
    rowGrey.push([0, 1, 2].map((c) => median(edge.map((p) => p[c]))));
  }

  // The body as a mask: on each row from its first dark pixel to its last, and
  // the same down each column.
  const rowL = new Int32Array(fh).fill(-1);
  const rowR = new Int32Array(fh).fill(-1);
  const colT = new Int32Array(fw).fill(-1);
  const colB = new Int32Array(fw).fill(-1);
  for (let y = 0; y < fh; y++) {
    const g = (rowGrey[y][0] + rowGrey[y][1] + rowGrey[y][2]) / 3;
    for (let x = 0; x < fw; x++)
      if (g - img.lum(x + f.x0, y + f.y0) > 30) {
        if (rowL[y] < 0) rowL[y] = x;
        rowR[y] = x;
        if (colT[x] < 0) colT[x] = y;
        colB[x] = y;
      }
  }

  // The corners, as circles meeting the body's sides, top and bottom:
  // anything outside them is studio floor, however dark.
  let screenRadius = 0;
  while (screenRadius < 200 && key[box.y0 * img.w + box.x0 + screenRadius] <= 0.5) screenRadius++;
  const sideRows = [];
  for (let y = Math.round(box.y0 + box.h * 0.6 - f.y0); y < box.y1 - 150 - f.y0; y++) sideRows.push(y);
  const bodyL = median(sideRows.map((y) => rowL[y]));
  const bodyR = median(sideRows.map((y) => rowR[y]));
  const bodyT = top - f.y0;
  const bodyB = bottom - f.y0;
  const R = screenRadius + (box.x0 - f.x0 - bodyL);
  const outsideCorner = (x, y) => {
    const cx = x < bodyL + R ? bodyL + R : x > bodyR - R ? bodyR - R : null;
    const cy = y < bodyT + R ? bodyT + R : y > bodyB - R ? bodyB - R : null;
    return cx !== null && cy !== null && Math.hypot(x - cx, y - cy) > R + 2;
  };

  const rgba = Buffer.alloc(fw * fh * 4);
  for (let y = 0; y < fh; y++) {
    const G = rowGrey[y];
    const g = (G[0] + G[1] + G[2]) / 3;
    for (let x = 0; x < fw; x++) {
      const X = x + f.x0;
      const Y = y + f.y0;
      const C = img.rgb(X, Y);
      let alpha = 0;
      let px = C;
      const inRow = Y >= top && Y <= bottom && rowL[y] >= 0 && x >= rowL[y] - 2 && x <= rowR[y] + 2;
      const inCol = colT[x] >= 0 && y >= colT[x] - 2 && y <= colB[x] + 2;
      if (inRow && inCol && !outsideCorner(x, y)) {
        const inner = x > rowL[y] + 1 && x < rowR[y] - 1 && y > colT[x] + 1 && y < colB[x] - 1;
        const l = (C[0] + C[1] + C[2]) / 3;
        alpha = inner ? 1 : Math.max(0, Math.min(1, (g - l) / (g - 70)));
        // An edge pixel is part body, part studio grey: take the grey back out.
        if (alpha > 0 && alpha < 1) px = C.map((v, c) => (v - (1 - alpha) * G[c]) / alpha);
        // The screen: clear it, keeping the bezel's own share of its edge.
        const k = key[Y * img.w + X];
        if (k > 0) {
          px = k < 1 ? bezelShare(C, k, green).map((v) => v / (1 - k)) : [0, 0, 0];
          alpha *= 1 - k;
        }
      }
      const o = (y * fw + x) * 4;
      rgba[o] = byte(px[0]);
      rgba[o + 1] = byte(px[1]);
      rgba[o + 2] = byte(px[2]);
      rgba[o + 3] = byte(alpha * 255);
    }
  }
  await sharp(rgba, { raw: { width: fw, height: fh, channels: 4 } })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(join(outDir, "phone-frame.webp"));

  // Where the screen sits, in percent of the frame, reaching 2px under the
  // bezel all round so no edge of the clear glass is left uncovered.
  const pct = (v) => Math.round(v * 100000) / 1000;
  const geometry = {
    src: "/devices/phone-frame.webp",
    width: fw,
    height: fh,
    screen: {
      left: pct((box.x0 - f.x0 - 2) / fw),
      top: pct((box.y0 - f.y0 - 2) / fh),
      width: pct((box.w + 4) / fw),
      height: pct((box.h + 4) / fh),
      radius: pct((screenRadius + 2) / fw),
    },
  };
  writeFileSync(join(root, "src", "data", "phoneFrame.json"), `${JSON.stringify(geometry, null, 2)}\n`);
  return geometry;
}

const laptops = await laptopPhotos();
const phone = await phoneFrame();
console.log(`devices: ${laptops} laptop photographs, phone frame ${phone.width}x${phone.height}`);
