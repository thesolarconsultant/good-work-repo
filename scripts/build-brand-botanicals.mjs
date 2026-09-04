// Drawn botanicals for a client brand — olive sprigs, flowering stems, vines.
//
//   node scripts/build-brand-botanicals.mjs <brand-slug>
//   e.g. npm run brand:botanicals -- beauty-heaven-hub
//
// Writes SVGs into public/goodwork/brands/<slug>/botanicals/, one file per
// sprig, plus a paste-ready inline copy of each in inline.html.
//
// They are GENERATED rather than drawn by hand because a branch has to look
// grown: every leaf sits on the stem's own tangent, at its own angle, at its
// own size, and no two are alike. A hand-written path with copy-pasted leaves
// reads as clip art immediately, and clip art is exactly what the brand's
// guidelines rule out.
//
// The output is stroke-only, single weight, no fills — a fine line the page
// paints in champagne gold, so it inherits the brand rather than carrying a
// colour of its own. Every leaf and bloom carries `--t`, its position along
// the stem, so the page can open each one exactly as the drawn line reaches
// it using nothing but CSS.

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const slug = process.argv[2];
if (!slug) {
  console.error("usage: node scripts/build-brand-botanicals.mjs <brand-slug>");
  process.exit(1);
}
const brandDir = join(root, "public", "goodwork", "brands", slug);
if (!existsSync(brandDir)) {
  console.error(`No brand folder at ${brandDir}`);
  process.exit(1);
}
const outDir = join(brandDir, "botanicals");
mkdirSync(outDir, { recursive: true });

// A seeded generator, so a sprig is the same every build. Changing a seed is
// how you get a different plant; nothing else needs touching.
function rng(seed) {
  let s = seed >>> 0;
  return () => (((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296));
}
const r2 = (n) => Math.round(n * 100) / 100;

// ---- the stem -------------------------------------------------------------
// A chain of cubic segments that leans as it climbs, so it grows rather than
// bends uniformly. Returns the path data plus a sampler for tangents.
function stem({ from, to, sway, segments, rand, profile = 1.35, jitter = 0.6 }) {
  // The sway is perpendicular to the run, so a stem that climbs leans
  // sideways and one that travels across arcs up and over.
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    // profile 1 is a clean arc that returns to the line at both ends; above
    // that the stem leans and keeps going, the way a climbing shoot does.
    const bend = Math.sin(t * Math.PI * profile) * sway * (1 - jitter / 2 + rand() * jitter);
    pts.push([from[0] + dx * t + nx * bend, from[1] + dy * t + ny * bend]);
  }
  // Catmull-Rom through the points, converted to cubics — smooth, no kinks.
  let d = `M ${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || pts[i + 1];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${r2(c1[0])} ${r2(c1[1])}, ${r2(c2[0])} ${r2(c2[1])}, ${r2(p2[0])} ${r2(p2[1])}`;
  }
  const at = (t) => {
    const i = Math.min(pts.length - 2, Math.floor(t * (pts.length - 1)));
    const f = t * (pts.length - 1) - i;
    const p = pts[i], q = pts[i + 1];
    return { x: p[0] + (q[0] - p[0]) * f, y: p[1] + (q[1] - p[1]) * f, a: Math.atan2(q[1] - p[1], q[0] - p[0]) };
  };
  return { d, at };
}

// ---- a leaf ---------------------------------------------------------------
// An almond: two mirrored quadratics from the base to the tip. Olive leaves
// are long and narrow; a flower's are shorter and fuller, hence `fat`.
function leaf(x, y, angle, len, fat) {
  const tx = x + Math.cos(angle) * len, ty = y + Math.sin(angle) * len;
  const nx = Math.cos(angle + Math.PI / 2) * len * fat, ny = Math.sin(angle + Math.PI / 2) * len * fat;
  const mx = x + Math.cos(angle) * len * 0.45, my = y + Math.sin(angle) * len * 0.45;
  return `M ${r2(x)} ${r2(y)} Q ${r2(mx + nx)} ${r2(my + ny)}, ${r2(tx)} ${r2(ty)} Q ${r2(mx - nx)} ${r2(my - ny)}, ${r2(x)} ${r2(y)} Z`;
}

// ---- a bloom --------------------------------------------------------------
// Five petals around a centre, each a small almond, with a dot in the middle.
function bloom(x, y, radius, rand) {
  const petals = [];
  const turn = rand() * Math.PI;
  for (let i = 0; i < 5; i++) {
    const a = turn + (i / 5) * Math.PI * 2;
    petals.push(leaf(x, y, a, radius * (0.85 + rand() * 0.3), 0.42));
  }
  petals.push(`M ${r2(x + radius * 0.16)} ${r2(y)} A ${r2(radius * 0.16)} ${r2(radius * 0.16)} 0 1 1 ${r2(x - radius * 0.16)} ${r2(y)} A ${r2(radius * 0.16)} ${r2(radius * 0.16)} 0 1 1 ${r2(x + radius * 0.16)} ${r2(y)}`);
  return petals;
}

// ---- a sprig --------------------------------------------------------------
function sprig({ seed, w, h, from, to, sway, leaves, leafLen, fat, blooms, bloomRadius, first, last, profile, jitter, segments = 9 }) {
  const rand = rng(seed);
  const s = stem({ from, to, sway, segments, rand, profile, jitter });
  const parts = [`  <path class="bh-bot__stem" d="${s.d}"/>`];

  // Leaves start a little way up the stem — nothing sprouts from the cut end.
  for (let i = 0; i < leaves; i++) {
    const t = first + (last - first) * (i / (leaves - 1 || 1));
    const p = s.at(t);
    const side = i % 2 ? 1 : -1;
    // Lean the leaf off the stem's tangent, more sharply near the tip.
    const spread = (0.75 - t * 0.3) * side + (rand() - 0.5) * 0.22;
    const len = leafLen * (1 - t * 0.35) * (0.8 + rand() * 0.45);
    parts.push(`  <path class="bh-bot__leaf" style="--t:${r2(t)}" d="${leaf(p.x, p.y, p.a + spread, len, fat)}"/>`);
  }
  for (let i = 0; i < (blooms || 0); i++) {
    const t = 0.42 + (0.5 * i) / Math.max(1, blooms - 1);
    const p = s.at(Math.min(0.97, t));
    const off = (i % 2 ? 1 : -1) * bloomRadius * 1.5;
    for (const d of bloom(p.x + Math.cos(p.a + Math.PI / 2) * off, p.y + Math.sin(p.a + Math.PI / 2) * off, bloomRadius, rand)) {
      parts.push(`  <path class="bh-bot__bloom" style="--t:${r2(t)}" d="${d}"/>`);
    }
  }
  return `<svg class="bh-bot" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true" focusable="false">
${parts.join("\n")}
</svg>`;
}

// The set. Each is placed once on the site — a drawn line is a punctuation
// mark, and punctuation stops working when it is everywhere.
const SET = {
  // Climbs the left edge of the scroll story, one leaf per beat.
  "olive-tall": sprig({ seed: 12, w: 170, h: 900, from: [104, 892], to: [66, 34], sway: 46,
    leaves: 16, leafLen: 52, fat: 0.3, first: 0.05, last: 0.99, jitter: 0.35 }),
  // Beside the treatments heading: shorter, fuller, with three blooms.
  "flower-stem": sprig({ seed: 7, w: 190, h: 420, from: [104, 412], to: [72, 22], sway: 34,
    leaves: 8, leafLen: 40, fat: 0.4, blooms: 3, bloomRadius: 17, first: 0.08, last: 0.78 }),
  // Arcs over the closing band's logo.
  "vine-arc": sprig({ seed: 31, w: 620, h: 210, from: [18, 190], to: [602, 190], sway: -128,
    leaves: 16, leafLen: 30, fat: 0.32, first: 0.04, last: 0.98,
    profile: 1, jitter: 0.12, segments: 14 }),
  // A small olive sprig for the reviews wall.
  "olive-small": sprig({ seed: 55, w: 170, h: 300, from: [22, 292], to: [150, 26], sway: 26,
    leaves: 9, leafLen: 34, fat: 0.3, first: 0.08, last: 0.96 }),
};

let inline = "<!-- Generated by scripts/build-brand-botanicals.mjs — paste, don't edit. -->\n";
for (const [name, svg] of Object.entries(SET)) {
  writeFileSync(join(outDir, `${name}.svg`), svg + "\n");
  inline += `\n<!-- ${name} -->\n${svg}\n`;
  const paths = (svg.match(/<path/g) || []).length;
  console.log(`${name.padEnd(14)} ${paths} paths`);
}
writeFileSync(join(outDir, "inline.html"), inline);
console.log(`botanicals: ${Object.keys(SET).length} SVGs in botanicals/`);
