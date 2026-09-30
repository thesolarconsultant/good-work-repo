/**
 * Beauty Heaven Hub — email artwork.
 *
 * Email clients drop border-radius and CSS gradients, so every shape an email
 * needs has to be baked into the artwork on the exact colour that sits behind
 * it. This script is that bake, so the art can be regenerated when the
 * photography is replaced instead of being hand-cropped once and lost.
 *
 *   node scripts/build-bh-email-art.mjs
 *
 * Images are written at 2x their display width, because retina is the normal
 * case on a phone, and served as JPEG for the photographs (universal in email,
 * unlike WebP) and PNG for line art.
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BRAND = join(dirname(fileURLToPath(import.meta.url)), "..", "public/goodwork/brands/beauty-heaven-hub");
const OUT = join(BRAND, "email");

const IVORY = "#F4F0E9";
const ESPRESSO = "#24211E";
const GOLD = "#C9A65C";

/** The arch: a rectangle whose top is a half-circle of the full width. */
const archPath = (w, h) => `M 0 ${h} L 0 ${w / 2} A ${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2} L ${w} ${h} Z`;

/**
 * A photograph cut to the arch, sat on `ground`, with the brand's gold
 * hairline following the shape a hair inside the edge.
 */
async function arch({ src, out, w, h, ground, hairline = true, brightness = 1 }) {
  const photo = await sharp(join(BRAND, src))
    .resize(w, h, { fit: "cover", position: "attention" })
    .modulate({ brightness })
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${w}" height="${h}"><path d="${archPath(w, h)}" fill="#fff"/></svg>`,
  );

  const cut = await sharp(photo)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const layers = [{ input: cut, top: 0, left: 0 }];
  if (hairline) {
    const inset = 3;
    layers.push({
      input: Buffer.from(
        `<svg width="${w}" height="${h}"><g transform="translate(${inset} ${inset})">
           <path d="${archPath(w - inset * 2, h - inset * 2)}" fill="none" stroke="${GOLD}" stroke-width="3"/>
         </g></svg>`,
      ),
      top: 0,
      left: 0,
    });
  }

  await sharp({ create: { width: w, height: h, channels: 3, background: ground } })
    .composite(layers)
    .jpeg({ quality: 82, chromaSubsampling: "4:4:4" })
    .toFile(join(OUT, out));
  console.log(`${out}  ${w}x${h}  on ${ground}`);
}

/**
 * A full-bleed photograph that dissolves into the dark ground beneath it, so
 * the image has no bottom edge — the trick the noir layout is built on, and
 * one no email client will do with CSS.
 */
async function fade({ src, out, w, h, ground, brightness = 1, position = "attention", from = 0.1 }) {
  const photo = await sharp(join(BRAND, src))
    .resize(w, h, { fit: "cover", position })
    .modulate({ brightness })
    .toBuffer();

  const veil = Buffer.from(
    `<svg width="${w}" height="${h}">
       <defs>
         <linearGradient id="down" x1="0" y1="${from}" x2="0" y2="1">
           <stop offset="0%" stop-color="${ground}" stop-opacity="0"/>
           <stop offset="55%" stop-color="${ground}" stop-opacity="0.72"/>
           <stop offset="100%" stop-color="${ground}" stop-opacity="1"/>
         </linearGradient>
         <linearGradient id="up" x1="0" y1="0" x2="0" y2="0.3">
           <stop offset="0%" stop-color="${ground}" stop-opacity="0.85"/>
           <stop offset="100%" stop-color="${ground}" stop-opacity="0"/>
         </linearGradient>
       </defs>
       <rect width="${w}" height="${h}" fill="url(#down)"/>
       <rect width="${w}" height="${h}" fill="url(#up)"/>
     </svg>`,
  );

  await sharp(photo)
    .composite([{ input: veil, top: 0, left: 0 }])
    .jpeg({ quality: 84, chromaSubsampling: "4:4:4" })
    .toFile(join(OUT, out));
  console.log(`${out}  ${w}x${h}  fading into ${ground}`);
}

/**
 * One of the drawn botanicals, in gold on a flat ground. The source SVGs take
 * their stroke and fill from the page's stylesheet, which a standalone render
 * doesn't have, so the paths are re-dressed on the way through: stems stroked,
 * leaves filled.
 */
async function sprig({ src, out, w, h, ground }) {
  const svg = readFileSync(join(BRAND, src), "utf8");
  const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
  const paths = [...svg.matchAll(/<path class="([^"]+)"[^>]*d="([^"]+)"/g)].map(([, cls, d]) =>
    cls.includes("leaf")
      ? `<path d="${d}" fill="${GOLD}"/>`
      : `<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
  );

  const drawn = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${paths.join("")}</svg>`,
  );

  await sharp({ create: { width: w, height: h, channels: 3, background: ground } })
    .composite([{ input: await sharp(drawn).png().toBuffer(), top: 0, left: 0 }])
    .png()
    .toFile(join(OUT, out));
  console.log(`${out}  ${w}x${h}  gold on ${ground}`);
}

await arch({
  src: "photos/treatment-room.jpg",
  out: "maison-arch.jpg",
  w: 700,
  h: 875,
  ground: IVORY,
  brightness: 1.04,
});

await fade({
  src: "photos/treatment-room.jpg",
  out: "noir-hero.jpg",
  w: 1200,
  h: 760,
  ground: ESPRESSO,
  position: "top",
  brightness: 0.72,
});

await sprig({ src: "botanicals/olive-small.svg", out: "letter-sprig.png", w: 200, h: 353, ground: IVORY });
