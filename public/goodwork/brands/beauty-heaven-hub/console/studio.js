/* ============================================================================
   Studio: the content styles, drawn.

   Each style is a fixed template. The week's photos and words go in; a post
   in the brand comes out, at full size, ready to download. Drawn on a canvas
   from the brand's own typeface, colours and logo files, so the result is the
   same every time and nothing about the look is left to whoever is posting.

   The samples in content-styles/sample-posts.html are the reference these
   match: same sizes, same spacing, same type.
   ========================================================================== */

const ESP = "#24211E";
const IVORY = "#F4F0E9";
const GOLD = "#C9A65C";
const GOLD_LT = "#E3CD94";
const GOLD_INK = "#7F6329";
const TAUPE = "#746B60";
const STONE = "#B9AFA2";
const LEDE = "#E9E2D7";

const MARKS = {
  gold: "../logo/beauty-heaven-hub-wordmark-gold.svg",
  espresso: "../logo/beauty-heaven-hub-wordmark-espresso.svg",
  academy: "../logo/beauty-heaven-hub-academy-gold.svg",
};

/* The styles, what each is for, and the shape of its words. `slides` is how
   many images one post makes. */
export const STYLES = {
  room: { name: "The room", size: [1080, 1920], slides: 1, kinds: ["film", "photo"], note: "Reel cover. A room, one line." },
  explainer: { name: "Close-up explainer", size: [1080, 1350], slides: 3, kinds: ["ai", "photo"], note: "Carousel: the question, what happens, aftercare." },
  week: { name: "This week at the Hub", size: [1080, 1350], slides: 1, kinds: ["photo", "film"], photos: 4, note: "Four of the week's own photos." },
  first: { name: "First time?", size: [1080, 1350], slides: 1, kinds: ["ai", "photo"], note: "Reassurance for first-timers." },
  academy: { name: "Academy", size: [1080, 1350], slides: 1, kinds: ["ai", "photo"], note: "Course, next intake." },
  story: { name: "Story", size: [1080, 1920], slides: 1, kinds: ["ai", "photo", "film"], note: "One ask. Link in bio." },
};

/* ------------------------------------------------------------------ ASSETS -- */
const cache = new Map();

/* Pictures from another domain are asked for with CORS so the finished post
   can still be saved; if that domain won't allow it, the picture still shows
   (and the download says why it can't be saved). */
const foreign = (src) => { try { return new URL(src, location.href).origin !== location.origin; } catch { return false; } };

function loadImg(src) {
  if (!cache.has(src)) {
    cache.set(src, new Promise((res) => {
      const attempt = (cors) => {
        const img = new Image();
        img.decoding = "async";
        if (cors) img.crossOrigin = "anonymous";
        img.onload = () => res(img);
        img.onerror = () => (cors ? attempt(false) : res(null));
        img.src = src;
      };
      attempt(foreign(src));
    }));
  }
  return cache.get(src);
}

/* A film is drawn from one of its frames: two and a half seconds in, where
   the camera has settled. */
function filmFrame(src, at = 2.5) {
  const key = `${src}#${at}`;
  if (!cache.has(key)) {
    cache.set(key, new Promise((res) => {
      const v = document.createElement("video");
      v.muted = true; v.playsInline = true; v.preload = "auto";
      if (foreign(src)) v.crossOrigin = "anonymous";
      v.src = src;
      const done = (x) => { v.removeAttribute("src"); v.load(); res(x); };
      v.addEventListener("error", () => done(null), { once: true });
      v.addEventListener("loadedmetadata", () => { v.currentTime = Math.min(at, (v.duration || 5) - 0.1); }, { once: true });
      v.addEventListener("seeked", () => {
        const c = document.createElement("canvas");
        c.width = v.videoWidth; c.height = v.videoHeight;
        c.getContext("2d").drawImage(v, 0, 0);
        done(c);
      }, { once: true });
      setTimeout(() => done(null), 8000);
    }));
  }
  return cache.get(key);
}

export function source(asset) {
  if (!asset) return Promise.resolve(null);
  return asset.kind === "video" ? filmFrame(asset.src) : loadImg(asset.src);
}

export async function readyFonts() {
  if (!document.fonts) return;
  await Promise.all(["300 80px Jost", "400 30px Jost", "500 24px Jost", "700 80px Jost"].map((f) => document.fonts.load(f)));
  await document.fonts.ready;
}

/* ------------------------------------------------------------------- DRAWING -- */
function cover(ctx, img, x, y, w, h) {
  if (!img) { ctx.fillStyle = "#3a3530"; ctx.fillRect(x, y, w, h); return; }
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih);
  const sw = w / s, sh = h / s;
  ctx.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, w, h);
}

function archPath(ctx, x, y, w, h) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function arch(ctx, img, x, y, w, h, line = 16) {
  ctx.save(); archPath(ctx, x, y, w, h); ctx.clip(); cover(ctx, img, x, y, w, h); ctx.restore();
  if (line) {
    const r = w / 2 + line;
    ctx.save();
    ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - line, y + h + 0);
    ctx.lineTo(x - line, y + w / 2);
    ctx.arc(x + w / 2, y + w / 2, r, Math.PI, 0);
    ctx.lineTo(x + w + line, y + h);
    ctx.stroke();
    ctx.restore();
  }
}

/* Dark at the top for the logo, clear through the middle, dark at the foot
   for the words. */
function shade(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(36,33,30,.55)");
  g.addColorStop(0.22, "rgba(36,33,30,0)");
  g.addColorStop(0.45, "rgba(36,33,30,0)");
  g.addColorStop(0.78, "rgba(36,33,30,.88)");
  g.addColorStop(1, "rgba(36,33,30,.96)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}

async function mark(ctx, which, x, y, h, align = "left") {
  const img = await loadImg(MARKS[which]);
  if (!img) return;
  const w = h * (img.naturalWidth / img.naturalHeight || 6.4);
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  ctx.drawImage(img, left, y, w, h);
}

function spaced(ctx, text, x, y, size, color, { weight = 500, track = 0.32, align = "left" } = {}) {
  ctx.save();
  ctx.font = `${weight} ${size}px Jost, 'Century Gothic', sans-serif`;
  ctx.fillStyle = color; ctx.textBaseline = "alphabetic";
  const t = String(text || "").toUpperCase();
  const gap = size * track;
  const w = [...t].reduce((a, c) => a + ctx.measureText(c).width + gap, -gap);
  let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  for (const c of t) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + gap; }
  ctx.restore();
  return w;
}

/* A headline in the brand: light, with *one word* (or a few) bold. Returns
   lines of runs so it can be measured before it is drawn. */
function rich(ctx, text, size, maxW) {
  const lines = [];
  for (const para of String(text || "").split("\n")) {
    const words = [];
    let bold = false;
    for (const part of para.split(/(\*)/)) {
      if (part === "*") { bold = !bold; continue; }
      part.split(/(\s+)/).forEach((w) => { if (w) words.push({ t: w, bold }); });
    }
    let line = [], width = 0;
    for (const w of words) {
      ctx.font = `${w.bold ? 700 : 300} ${size}px Jost, sans-serif`;
      const ww = ctx.measureText(w.t).width;
      if (/^\s+$/.test(w.t)) { if (line.length) { line.push({ ...w, w: ww }); width += ww; } continue; }
      if (width + ww > maxW && line.length) {
        while (line.length && /^\s+$/.test(line[line.length - 1].t)) width -= line.pop().w;
        lines.push({ runs: line, width }); line = []; width = 0;
      }
      line.push({ ...w, w: ww }); width += ww;
    }
    while (line.length && /^\s+$/.test(line[line.length - 1].t)) width -= line.pop().w;
    if (line.length) lines.push({ runs: line, width });
  }
  return lines;
}

/* The biggest size, from `max` down, at which the headline fits in `maxLines`. */
function fit(ctx, text, maxW, max, min, maxLines) {
  for (let s = max; s >= min; s -= 2) {
    const lines = rich(ctx, text, s, maxW);
    if (lines.length <= maxLines) return { size: s, lines };
  }
  return { size: min, lines: rich(ctx, text, min, maxW) };
}

function drawRich(ctx, { size, lines }, x, y, color, { align = "left", leading = 1.02 } = {}) {
  ctx.save(); ctx.fillStyle = color; ctx.textBaseline = "alphabetic";
  lines.forEach((l, i) => {
    let cx = align === "center" ? x - l.width / 2 : x;
    const ly = y + size * 0.82 + i * size * leading;
    for (const r of l.runs) {
      ctx.font = `${r.bold ? 700 : 300} ${size}px Jost, sans-serif`;
      ctx.fillText(r.t, cx, ly); cx += r.w;
    }
  });
  ctx.restore();
  return lines.length * size * leading;
}

function para(ctx, text, x, y, maxW, size, color, { align = "left", leading = 1.45, weight = 300 } = {}) {
  ctx.save(); ctx.font = `${weight} ${size}px Jost, sans-serif`; ctx.fillStyle = color;
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = []; let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => {
    const lw = ctx.measureText(l).width;
    ctx.fillText(l, align === "center" ? x - lw / 2 : x, y + size + i * size * leading);
  });
  ctx.restore();
  return lines.length * size * leading;
}

function rule(ctx, x, y, w = 72) { ctx.fillStyle = GOLD; ctx.fillRect(x, y, w, 2); }

function canvas([w, h], bg) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  return [c, ctx];
}

/* ------------------------------------------------------------------- STYLES -- */
async function room(p, img) {
  const [c, ctx] = canvas(STYLES.room.size, ESP);
  cover(ctx, img[0], 0, 0, 1080, 1920); shade(ctx, 1080, 1920);
  await mark(ctx, "gold", 540, 96, 84, "center");
  const h = fit(ctx, p.headline, 920, 108, 72, 3);
  const hh = h.lines.length * h.size * 1.02;
  const top = 1920 - 170 - hh;
  spaced(ctx, p.eyebrow, 80, top - 80, 24, GOLD_LT);
  rule(ctx, 80, top - 44);
  drawRich(ctx, h, 80, top, IVORY);
  return c;
}

async function explainer(p, img) {
  const out = [];
  // 1. The cover: the close-up and the question.
  {
    const [c, ctx] = canvas(STYLES.explainer.size, ESP);
    cover(ctx, img[0], 0, 0, 1080, 1350); shade(ctx, 1080, 1350);
    await mark(ctx, "gold", 540, 84, 74, "center");
    const h = fit(ctx, p.headline, 920, 104, 70, 3);
    const hh = h.lines.length * h.size * 1.02;
    const top = 1350 - 150 - hh;
    spaced(ctx, p.eyebrow, 80, top - 40, 22, GOLD_LT);
    drawRich(ctx, h, 80, top, IVORY);
    spaced(ctx, "Swipe  →", 1000, 1350 - 86, 22, GOLD_LT, { align: "right", track: 0.28 });
    out.push(c);
  }
  // 2. Inside: what happens, in two steps.
  {
    const [c, ctx] = canvas(STYLES.explainer.size, IVORY);
    arch(ctx, img[1] || img[0], 80, 80, 430, 600);
    const s = p.steps || [];
    spaced(ctx, "01", 580, 150, 26, GOLD_INK, { track: 0.3 });
    const t1 = fit(ctx, s[0]?.title || "", 420, 80, 54, 3);
    const h1 = drawRich(ctx, t1, 580, 176, ESP);
    para(ctx, s[0]?.text, 580, 176 + h1 + 14, 420, 30, TAUPE);
    spaced(ctx, "02", 80, 810, 26, GOLD_INK, { track: 0.3 });
    const t2 = fit(ctx, s[1]?.title || "", 920, 80, 54, 2);
    const h2 = drawRich(ctx, t2, 80, 836, ESP);
    para(ctx, s[1]?.text, 80, 836 + h2 + 14, 900, 30, TAUPE);
    await mark(ctx, "espresso", 80, 1350 - 60 - 62, 62);
    out.push(c);
  }
  // 3. Aftercare: the next few days, in four lines.
  {
    const [c, ctx] = canvas(STYLES.explainer.size, ESP);
    spaced(ctx, "Afterwards", 80, 160, 22, GOLD_LT);
    const t = fit(ctx, p.aftercareTitle || "the next few days, *simply.*", 920, 92, 60, 2);
    const th = drawRich(ctx, t, 80, 200, IVORY);
    let y = 200 + th + 50;
    const items = (p.aftercare || []).slice(0, 4);
    ctx.fillStyle = "rgba(201,166,92,.45)"; ctx.fillRect(80, y, 920, 1);
    items.forEach((it, i) => {
      spaced(ctx, String(i + 1).padStart(2, "0"), 80, y + 76, 26, GOLD_LT, { track: 0.2 });
      const hh = para(ctx, it, 160, y + 44, 840, 40, IVORY, { leading: 1.3 });
      y += Math.max(118, hh + 70);
      ctx.fillStyle = "rgba(201,166,92,.45)"; ctx.fillRect(80, y, 920, 1);
    });
    await mark(ctx, "gold", 80, 1350 - 62 - 64, 64);
    spaced(ctx, "Book · link in bio", 1000, 1350 - 84, 20, STONE, { align: "right", track: 0.12 });
    out.push(c);
  }
  return out;
}

async function week(p, img) {
  const [c, ctx] = canvas(STYLES.week.size, IVORY);
  spaced(ctx, p.eyebrow || "This week at the Hub", 80, 130, 22, GOLD_INK);
  const h = fit(ctx, p.headline, 920, 72, 54, 1);
  drawRich(ctx, h, 80, 160, ESP);
  const cw = (920 - 18) / 2, ch = 410;
  for (let i = 0; i < 4; i++) {
    const x = 80 + (i % 2) * (cw + 18), y = 300 + Math.floor(i / 2) * (ch + 18);
    if (i === 0) arch(ctx, img[i], x, y, cw, ch, 0); else cover(ctx, img[i], x, y, cw, ch);
  }
  await mark(ctx, "espresso", 80, 1350 - 60 - 62, 62);
  return c;
}

async function first(p, img) {
  const [c, ctx] = canvas(STYLES.first.size, ESP);
  arch(ctx, img[0], 290, 90, 500, 640, 18);
  spaced(ctx, p.eyebrow || "First time?", 540, 860, 22, GOLD_LT, { align: "center" });
  const h = fit(ctx, p.headline, 920, 80, 56, 2);
  const hh = drawRich(ctx, h, 540, 890, IVORY, { align: "center" });
  para(ctx, p.body, 540, 890 + hh + 16, 780, 30, LEDE, { align: "center" });
  await mark(ctx, "gold", 540, 1350 - 60 - 66, 66, "center");
  return c;
}

async function academy(p, img) {
  const [c, ctx] = canvas(STYLES.academy.size, TAUPE);
  cover(ctx, img[0], 1080 * 0.42, 0, 1080 * 0.58, 1350);
  const g = ctx.createLinearGradient(0, 0, 1080, 0);
  g.addColorStop(0.42, TAUPE); g.addColorStop(0.7, "rgba(116,107,96,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 1350);
  await mark(ctx, "academy", 80, 80, 156);
  const h = fit(ctx, p.headline, 560, 84, 56, 3);
  const hh = h.lines.length * h.size * 1.02;
  ctx.font = "300 30px Jost";
  const bodyLines = Math.ceil(ctx.measureText(p.body || "").width / 540) || 0;
  const bh = bodyLines * 30 * 1.45;
  const top = 1350 - 120 - bh - 28 - hh;
  spaced(ctx, p.eyebrow, 80, top - 64, 22, GOLD_LT);
  rule(ctx, 80, top - 34);
  drawRich(ctx, h, 80, top, IVORY);
  para(ctx, p.body, 80, top + hh + 12, 540, 30, "#F1EBE1");
  return c;
}

async function story(p, img) {
  const [c, ctx] = canvas(STYLES.story.size, ESP);
  cover(ctx, img[0], 0, 0, 1080, 1920); shade(ctx, 1080, 1920);
  await mark(ctx, "gold", 540, 96, 84, "center");
  const h = fit(ctx, p.headline, 920, 104, 70, 3);
  const hh = h.lines.length * h.size * 1.02;
  const top = 1920 - 220 - 120 - hh;
  spaced(ctx, p.eyebrow, 540, top - 36, 24, GOLD_LT, { align: "center" });
  drawRich(ctx, h, 540, top, IVORY, { align: "center" });
  // The ask, as an outlined pill.
  ctx.save(); ctx.font = "400 26px Jost";
  const label = (p.cta || "Book · link in bio").toUpperCase();
  const gap = 26 * 0.2;
  const lw = [...label].reduce((a, ch) => a + ctx.measureText(ch).width + gap, -gap);
  const pw = lw + 80, py = top + hh + 40;
  ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(540 - pw / 2, py, pw, 72, 36); ctx.stroke(); ctx.restore();
  spaced(ctx, label, 540, py + 46, 26, GOLD_LT, { align: "center", track: 0.2, weight: 400 });
  return c;
}

const DRAW = { room, explainer, week, first, academy, story };

/* A post in, its images out: one canvas per slide. */
export async function render(post, assets) {
  await readyFonts();
  const style = STYLES[post.style];
  const want = style.photos || (post.style === "explainer" ? 2 : 1);
  const imgs = await Promise.all(Array.from({ length: want }, (_, i) => source(assets.get(post.photos?.[i]))));
  const out = await DRAW[post.style](post, imgs);
  return Array.isArray(out) ? out : [out];
}

export function toBlob(canvas, type = "image/png", q) {
  return new Promise((res) => {
    try { canvas.toBlob(res, type, q); } catch { res(null); } // a picture from elsewhere taints the canvas
  });
}
