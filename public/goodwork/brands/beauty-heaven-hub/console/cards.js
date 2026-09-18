/* ============================================================================
   Slides.

   The console already writes an Instagram carousel as five headings with a
   line or two beneath each. Those are slides in everything but form, and the
   gap between "here is the text of a carousel" and "here is a carousel" was
   the last bit of work left on the salon's desk.

   So this draws them. On a canvas, from the brand's own typeface and palette,
   with no model involved and nothing to pay for. A generated photograph of a
   salon that does not exist is worse than no photograph; a line of the brand's
   own type on the brand's own espresso is better than either, and it is right
   every single time.

   1080 × 1350 because the feed crops 4:5 and a square wastes a fifth of the
   height it will give you.
   ========================================================================== */

const W = 1080;
const H = 1350;

/* Straight from brand.css. Repeated rather than read out of the cascade
   because a canvas cannot resolve a custom property, and a wrong gold is more
   obvious than a wrong anything else. */
const ESPRESSO = "#24211E";
const ESPRESSO_2 = "#2C2824";
const IVORY = "#F4F0E9";
const IVORY_2 = "#ECE6DD";
const GOLD = "#C9A65C";
const GOLD_INK = "#7F6329";
const STONE = "#B9AFA2";
const TAUPE_INK = "#6B6257";

const MARK_GOLD = "../logo/beauty-heaven-hub-wordmark-gold.svg";
const MARK_ESPRESSO = "../logo/beauty-heaven-hub-wordmark-espresso.svg";

/* ------------------------------------------------------------------ PARSE --
   The model writes markdown, and it writes it slightly differently every time:
   "**Slide 1**" on its own line, sometimes "Slide 1:" inline, sometimes just a
   bold heading with no slide marker at all. Rather than force one shape on the
   prompt — which would make the text worse to read on screen — this accepts
   all three and gives up gracefully.

   Everything after a "Caption" or "Hashtags" heading is not a slide. */
export function parseSlides(text) {
  const stop = /^\s*(?:\*\*)?(?:caption|hashtags|hash tags)\b/i;
  const marker = /^\s*(?:\*\*)?\s*slide\s*(\d+)\s*[:.)]?\s*(?:\*\*)?\s*(.*)$/i;

  const slides = [];
  let cur = null;

  for (const raw of String(text || "").split("\n")) {
    const line = raw.trim();
    if (stop.test(line)) break;
    if (!line) continue;

    const m = line.match(marker);
    if (m) {
      cur = { heading: strip(m[2]) || "", body: [] };
      slides.push(cur);
      continue;
    }
    if (!cur) continue;

    /* The first bold line after a slide marker is its heading; anything after
       that is the body, bold or not. */
    const bold = line.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
    if (bold && !cur.heading) {
      cur.heading = strip(bold[1]);
      if (bold[2]) cur.body.push(strip(bold[2]));
    } else {
      cur.body.push(strip(line));
    }
  }

  return slides
    .map((s) => ({ heading: s.heading, body: s.body.join(" ").trim() }))
    .filter((s) => s.heading || s.body);
}

const strip = (s) =>
  String(s || "")
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/, "")
    .replace(/^[-–—•]\s*/, "")
    .trim();

/* ------------------------------------------------------------------- DRAW -- */

/* Canvas has no word wrap. This returns the lines and, because the caller has
   to know whether the type still fits, the height they will occupy. */
function wrap(ctx, text, maxW) {
  const out = [];
  for (const para of String(text).split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

/* Type that must fit a box, rather than a box that grows to fit type: a slide
   is a fixed rectangle and the heading is however long the model made it.
   Steps down until it fits, which is what a designer would do. */
function fitLines(ctx, text, maxW, maxH, { weight, from, to, leading }) {
  for (let size = from; size >= to; size -= 2) {
    ctx.font = `${weight} ${size}px Jost, system-ui, sans-serif`;
    const lines = wrap(ctx, text, maxW);
    const h = lines.length * size * leading;
    if (h <= maxH) return { lines, size, lineHeight: size * leading };
  }
  ctx.font = `${weight} ${to}px Jost, system-ui, sans-serif`;
  return { lines: wrap(ctx, text, maxW), size: to, lineHeight: to * leading };
}

function drawLines(ctx, lines, x, y, lineHeight) {
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return y + lines.length * lineHeight;
}

/* The fluted panel, at the edge of visible — the same texture the deck and the
   end cards use. On a dark card only: on ivory it reads as a printing fault.

   Wider and fainter than it first was. At 28px on a 1080 card it stopped being
   texture and started being banding, which is the failure mode of every
   pattern that is nearly invisible at the size it was designed for and plainly
   visible at the size it ships at. */
function flute(ctx) {
  ctx.save();
  ctx.fillStyle = ESPRESSO_2;
  for (let x = 0; x < W; x += 54) ctx.fillRect(x, 0, 1, H);
  ctx.restore();
}

let markCache = {};
function loadMark(src) {
  if (markCache[src]) return markCache[src];
  markCache[src] = new Promise((res, rej) => {
    const img = new Image();
    /* The SVG is pure paths on the same origin, so it neither taints the
       canvas nor needs a fetch. It has no intrinsic size the browser will
       agree on, though, so it gets told one. */
    img.width = 1200;
    img.height = 187;
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Could not load ${src}`));
    img.src = src;
  });
  return markCache[src];
}

/* ------------------------------------------------------------------- CARD --
   One slide, one canvas. Dark for the first and last — the hook and the ask —
   and light in between, so a set has a rhythm rather than five identical
   rectangles. */
export async function drawCard({ heading, body, index, total, dark }) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");

  const ink = dark ? IVORY : ESPRESSO;
  const soft = dark ? STONE : TAUPE_INK;
  const rule = dark ? GOLD : GOLD_INK;

  ctx.fillStyle = dark ? ESPRESSO : IVORY;
  ctx.fillRect(0, 0, W, H);
  if (dark) flute(ctx);
  else {
    ctx.fillStyle = IVORY_2;
    ctx.fillRect(0, H - 4, W, 4);
  }

  const M = 96;                       // the gutter, and it does not move
  const maxW = W - M * 2;
  ctx.textBaseline = "top";

  /* The counter. Small, because it is wayfinding and not a design feature —
     but a five-slide carousel with no counter loses people on slide three. */
  ctx.fillStyle = rule;
  ctx.font = `400 22px Jost, system-ui, sans-serif`;
  ctx.letterSpacing = "6px";
  ctx.fillText(`${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, M, M);
  ctx.letterSpacing = "0px";

  /* The mark is measured before anything is placed, because the type is
     anchored off the bottom rather than poured from the top. A block that
     starts at a fixed height leaves whatever is left over as dead space under
     it, and on a tall card that is most of the card. */
  let mark = null;
  try {
    const img = await loadMark(dark ? MARK_GOLD : MARK_ESPRESSO);
    const mw = 300;
    mark = { img, w: mw, h: (mw / img.width) * img.height };
  } catch {
    /* A card without the mark still beats no card. */
  }

  const floor = H - M - (mark ? mark.h + 64 : 0);

  /* Measure the whole block first — heading, rule, body — then place it so it
     sits on that floor. Short headings ride low and long ones grow upward,
     which is what a person laying this out by hand would do. */
  const h = fitLines(ctx, heading || "", maxW, H * 0.40, {
    weight: 300, from: 88, to: 44, leading: 1.14,
  });
  const headH = h.lines.length * h.lineHeight;

  let b = null;
  if (body) {
    b = fitLines(ctx, body, maxW, H * 0.26, {
      weight: 300, from: 40, to: 27, leading: 1.45,
    });
  }
  const bodyH = b ? b.lines.length * b.lineHeight : 0;
  const ruleH = b ? 38 + 2 + 42 : 0;          // gap, hairline, gap

  const blockH = headH + ruleH + bodyH;
  /* Never higher than the counter's baseline, and never so low it crowds the
     mark — between those two it floats to the bottom. */
  let y = Math.max(M + 92, floor - blockH);

  ctx.fillStyle = ink;
  ctx.font = `300 ${h.size}px Jost, system-ui, sans-serif`;
  y = drawLines(ctx, h.lines, M, y, h.lineHeight);

  if (b) {
    y += 38;
    ctx.fillStyle = rule;
    ctx.fillRect(M, y, 88, 2);
    y += 44;
    ctx.fillStyle = soft;
    ctx.font = `300 ${b.size}px Jost, system-ui, sans-serif`;
    drawLines(ctx, b.lines, M, y, b.lineHeight);
  }

  if (mark) ctx.drawImage(mark.img, M, H - M - mark.h, mark.w, mark.h);

  return c;
}

/* Fonts are loaded by CSS for the page, which does not mean the canvas can use
   them — a face the document has not actually rendered at that weight is not
   in the font set yet, and canvas silently falls back to something else.
   Nothing about the result says "the wrong font"; it just looks cheap. */
export async function readyFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load("300 84px Jost"),
    document.fonts.load("400 22px Jost"),
    document.fonts.load("500 34px Jost"),
  ]);
  await document.fonts.ready;
}

export async function makeSet(text) {
  const slides = parseSlides(text);
  if (!slides.length) return [];
  await readyFonts();
  const total = slides.length;
  return Promise.all(
    slides.map((s, i) =>
      drawCard({ ...s, index: i, total, dark: i === 0 || i === total - 1 }),
    ),
  );
}

export function toBlob(canvas) {
  return new Promise((res) => canvas.toBlob(res, "image/png"));
}
