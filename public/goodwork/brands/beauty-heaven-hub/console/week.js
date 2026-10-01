/* ============================================================================
   This week.

   The console opens here. The week's posts are already made: one a day in
   the brand's fixed styles, with photos chosen and words written. The salon's
   job is to look, change what's wrong, approve, and download (and, when the
   scheduler is connected, nothing more). A week nobody touched still has
   something good in it; a week somebody wrote a line for is better.
   ========================================================================== */

import * as store from "./store.js";
import { STYLES, render, toBlob } from "./studio.js";

let $, $$, esc, toast;

/* ---------------------------------------------------------------- ASSETS --
   Everything a post can be made from: the films and pictures in the library,
   and the salon's own photographs. Photos dropped in the Drive join this list
   when the Drive is connected. */
const SALON = `${location.origin}/goodwork/brands/beauty-heaven-hub/photos/`;
const OWN = [
  { id: "photo:treatment", title: "Treatment room", src: `${SALON}treatment-room.jpg` },
  { id: "photo:mirrors", title: "The mirrors", src: `${SALON}salon-mirrors.png` },
  { id: "photo:reception", title: "Reception", src: `${SALON}reception-wide.png` },
  { id: "photo:lounge", title: "The lounge", src: `${SALON}lounge-wings.png` },
].map((p) => ({ ...p, kind: "image", made: "photo", preview: p.src }));

let assets = null; // Map id -> asset

async function loadAssets() {
  if (assets) return assets;
  let lib = [];
  try {
    const res = await fetch("library/library.json", { cache: "no-cache" });
    if (res.ok) lib = await res.json();
  } catch { /* no library here */ }
  const list = [
    ...lib.filter((i) => i.made === "room" || i.made === "ai").filter((i) => !i.id.startsWith("hero-")),
    ...OWN,
  ];
  assets = new Map(list.map((a) => [a.id, a]));
  return assets;
}

/* What each style likes to be made from, best first. The week rotates
   through them so no two weeks look the same. */
const PREFER = {
  room: ["f96b3d9b", "81c0cf78", "6364ca33", "218c6f7d"],
  explainer: ["45bc0d7c", "7ea35d69", "858b9c43", "1a7ffd9e"],
  week: ["photo:treatment", "photo:mirrors", "photo:reception", "photo:lounge"],
  first: ["1d1f04e4", "0fa6830c", "photo:lounge"],
  academy: ["1a7ffd9e", "7ea35d69", "858b9c43"],
  story: ["0fa6830c", "1d1f04e4", "photo:reception"],
};

/* ------------------------------------------------------------------- WEEK -- */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PLAN = ["room", "explainer", "week", "first", "academy", "story"];

/* Words for a week nobody has written yet: the samples the salon saw and
   liked. Written by Claude from the week's brief when asked. */
const DEFAULT_COPY = {
  room: { eyebrow: "The treatment room", headline: "the quiet\n*before* it starts.", caption: "The treatment room, before anyone's in it. This is the bit we get right before you arrive.\n\n#beautyheavenhub #hoddesdon" },
  explainer: {
    eyebrow: "Explained · Chemical peels", headline: "what a peel\n*actually* feels like.",
    steps: [
      { title: "we talk\n*first.*", text: "Before anything touches your skin, we go through what you want, what you use at home, and anything that would change the plan." },
      { title: "everything is *ready.*", text: "Gloves on, the tray laid out, the room warm. Nothing is rushed and you can stop and ask at any point." },
    ],
    aftercareTitle: "the next few days,\n*simply.*",
    aftercare: ["SPF every morning, even when it's grey.", "Leave the actives until we say.", "No picking. It's hard. We know.", "Anything you're unsure of, message us."],
    caption: "Thinking about a peel but not sure what it's like? Swipe through. Questions welcome, any time.\n\n#chemicalpeel #skincare #beautyheavenhub",
  },
  week: { eyebrow: "This week at the Hub", headline: "a few *favourites.*", caption: "A few favourites from this week at the Hub.\n\n#beautyheavenhub #hoddesdon" },
  first: { eyebrow: "First time?", headline: "that's *most people,*\nonce.", body: "We'll talk you through what happens before it happens.", caption: "First time? That's most people, once. We'll talk you through what happens before it happens, and you can stop and ask anything at any point.\n\n#beautyheavenhub" },
  academy: { eyebrow: "Foundation aesthetics", headline: "learn it\n*properly.*", body: "Online study first, then hands-on in a working salon. Next intake dates soon.", caption: "Foundation aesthetics at Beauty Heaven Academy: online study first, then hands-on in a working salon. Next intake dates soon. Message us to hear first.\n\n#beautyheavenacademy #aestheticstraining" },
  story: { eyebrow: "Consultations", headline: "start with a\n*conversation.*", cta: "Book · link in bio", caption: "" },
};

export function mondayOf(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}
function addWeeks(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return mondayOf(new Date(y, m - 1, d + 7 * n));
}
function weekLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}
function weekIndex(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Math.round(new Date(y, m - 1, d).getTime() / 6048e5);
}

function pick(style, n, offset) {
  const pool = PREFER[style].filter((id) => assets.has(id));
  const fallback = [...assets.keys()];
  const src = pool.length ? pool : fallback;
  return Array.from({ length: n }, (_, i) => src[(offset + i) % src.length]);
}

function makeWeek(key) {
  const off = weekIndex(key);
  return {
    brief: "",
    made: new Date().toISOString(),
    posts: PLAN.map((style, i) => {
      const n = STYLES[style].photos || (style === "explainer" ? 2 : 1);
      return {
        id: `${key}-${style}`,
        day: DAYS[i],
        style,
        status: "draft",
        photos: style === "week" ? pick(style, n, 0) : pick(style, n, off),
        ...structuredClone(DEFAULT_COPY[style]),
      };
    }),
  };
}

/* ------------------------------------------------------------------- STATE -- */
let current = mondayOf();
let editing = null; // post id
const thumbs = new Map(); // post id -> { sig, url }

function theWeek() {
  let w = store.getWeek(current);
  if (!w) { w = makeWeek(current); store.setWeek(current, w); }
  return w;
}
function savePost(post) {
  const w = theWeek();
  w.posts = w.posts.map((p) => (p.id === post.id ? post : p));
  store.setWeek(current, w);
}
const sig = (p) => JSON.stringify([p.style, p.photos, p.eyebrow, p.headline, p.body, p.steps, p.aftercareTitle, p.aftercare, p.cta]);

async function thumb(post) {
  const s = sig(post);
  const have = thumbs.get(post.id);
  if (have && have.sig === s) return have.url;
  const [c] = await render(post, assets);
  const t = document.createElement("canvas");
  t.width = 360; t.height = Math.round((360 * c.height) / c.width);
  t.getContext("2d").drawImage(c, 0, 0, t.width, t.height);
  let url = "";
  try { url = t.toDataURL("image/jpeg", 0.82); } catch { /* a picture from elsewhere taints the canvas */ }
  thumbs.set(post.id, { sig: s, url });
  return url;
}

/* -------------------------------------------------------------------- VIEW -- */
const STATUS = { draft: "To check", approved: "Approved", binned: "Binned" };

export async function renderWeek() {
  await loadAssets();
  const w = theWeek();
  $("#wkTitle").innerHTML = `week of <b>${esc(weekLabel(current))}.</b>`;
  $("#wkBrief").value = w.brief || "";
  const n = (s) => w.posts.filter((p) => p.status === s).length;
  $("#wkCount").innerHTML =
    `<span><b>${n("approved")}</b> approved</span><span><b>${n("draft")}</b> to check</span>` +
    (n("binned") ? `<span><b>${n("binned")}</b> binned</span>` : "");
  $("#wkThis").hidden = current === mondayOf();

  $("#wkGrid").innerHTML = w.posts.map((p) => `
    <article class="wkpost wkpost--${p.status}" data-id="${esc(p.id)}">
      <button class="wkpost__img" data-open="${esc(p.id)}" aria-label="Open ${esc(STYLES[p.style].name)}">
        <span class="wkpost__load" data-r="${STYLES[p.style].size[1] > 1500 ? "tall" : "feed"}"></span>
      </button>
      <div class="wkpost__meta">
        <span class="wkpost__day">${esc(p.day)}</span>
        <b>${esc(STYLES[p.style].name)}</b>
        <span class="tag tag--${p.status === "approved" ? "approved" : p.status === "binned" ? "draft" : "waiting"}">${STATUS[p.status]}</span>
      </div>
      <div class="wkpost__act">
        ${p.status === "approved"
          ? `<button class="btn btn--quiet" data-act="draft">Undo</button><button class="btn btn--gold" data-act="download">Download</button>`
          : p.status === "binned"
            ? `<button class="btn btn--quiet" data-act="draft">Bring back</button>`
            : `<button class="btn btn--quiet" data-act="bin">Bin</button><button class="btn btn--quiet" data-open="${esc(p.id)}">Edit</button><button class="btn btn--gold" data-act="approve">Approve</button>`}
      </div>
    </article>`).join("");

  // Thumbnails draw after the grid is on screen, each as soon as it's ready.
  await Promise.all(w.posts.map(async (p) => {
    const url = await thumb(p);
    const slot = $(`.wkpost[data-id="${CSS.escape(p.id)}"] .wkpost__img`);
    if (slot && url) slot.innerHTML = `<img src="${url}" alt="">`;
  }));
}

/* ------------------------------------------------------------------ EDITOR -- */
function field(label, name, value, { area = false, rows = 3, hint = "" } = {}) {
  const v = esc(value ?? "");
  return `<label class="field"><span>${label}${hint ? ` <em>${hint}</em>` : ""}</span>${
    area ? `<textarea name="${name}" rows="${rows}">${v}</textarea>` : `<input type="text" name="${name}" value="${v}">`
  }</label>`;
}

function editorForm(p) {
  const s = p.style;
  let f = field("Small line above", "eyebrow", p.eyebrow) +
    field("Headline", "headline", p.headline, { area: true, rows: 2, hint: "*word* for the bold one · Enter for a new line" });
  if (s === "first" || s === "academy") f += field("Line under it", "body", p.body, { area: true, rows: 2 });
  if (s === "story") f += field("The ask", "cta", p.cta);
  if (s === "explainer") {
    f += `<p class="micro wked__sub">Slide 2 · what happens</p>` +
      field("Step 1", "s0t", p.steps?.[0]?.title, { area: true, rows: 2 }) + field("", "s0x", p.steps?.[0]?.text, { area: true, rows: 3 }) +
      field("Step 2", "s1t", p.steps?.[1]?.title, { area: true, rows: 2 }) + field("", "s1x", p.steps?.[1]?.text, { area: true, rows: 3 }) +
      `<p class="micro wked__sub">Slide 3 · aftercare</p>` +
      field("Heading", "aftercareTitle", p.aftercareTitle, { area: true, rows: 2 }) +
      field("Four lines", "aftercare", (p.aftercare || []).join("\n"), { area: true, rows: 4, hint: "one per line · Hollie signs these off" });
  }
  f += field("Caption", "caption", p.caption, { area: true, rows: 5 });
  return f;
}

function readForm(p) {
  const f = $("#wkForm").elements;
  const v = (n) => (f[n] ? f[n].value : undefined);
  const next = { ...p, eyebrow: v("eyebrow"), headline: v("headline"), caption: v("caption") };
  if (f.body) next.body = v("body");
  if (f.cta) next.cta = v("cta");
  if (p.style === "explainer") {
    next.steps = [{ title: v("s0t"), text: v("s0x") }, { title: v("s1t"), text: v("s1x") }];
    next.aftercareTitle = v("aftercareTitle");
    next.aftercare = v("aftercare").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4);
  }
  return next;
}

let slot = 0;
function photoPicker(p) {
  const n = STYLES[p.style].photos || (p.style === "explainer" ? 2 : 1);
  const slots = n > 1
    ? `<div class="wked__slots">${Array.from({ length: n }, (_, i) =>
        `<button class="${i === slot ? "on" : ""}" data-slot="${i}">${p.style === "explainer" ? (i ? "Inside" : "Cover") : `Photo ${i + 1}`}</button>`).join("")}</div>`
    : "";
  const ok = STYLES[p.style].kinds;
  const list = [...assets.values()].filter((a) => ok.includes(a.made === "photo" ? "photo" : a.made === "ai" ? "ai" : "film"));
  return `${slots}<div class="wked__pics">${list.map((a) => `
    <button class="${p.photos?.[slot] === a.id ? "on" : ""}" data-pic="${esc(a.id)}" title="${esc(a.title)}">
      ${a.kind === "video" ? `<video src="${esc(a.src)}#t=2.5" muted playsinline preload="metadata"></video>` : `<img src="${esc(a.preview || a.src)}" alt="" loading="lazy">`}
      <i>${a.made === "ai" ? "AI" : a.made === "photo" ? "Yours" : "Film"}</i>
    </button>`).join("")}</div>`;
}

let slides = [], shown = 0;
async function drawPreview(p) {
  slides = await render(p, assets);
  shown = Math.min(shown, slides.length - 1);
  const c = slides[shown];
  const box = $("#wkPreview");
  box.innerHTML = "";
  c.className = "wked__canvas";
  box.append(c);
  $("#wkDots").innerHTML = slides.length > 1
    ? slides.map((_, i) => `<button class="${i === shown ? "on" : ""}" data-dot="${i}" aria-label="Slide ${i + 1}"></button>`).join("")
    : "";
}

async function openEditor(id) {
  const p = theWeek().posts.find((x) => x.id === id);
  if (!p) return;
  editing = id; slot = 0; shown = 0;
  $("#wkEdTitle").textContent = `${p.day} · ${STYLES[p.style].name}`;
  $("#wkEdNote").textContent = STYLES[p.style].note;
  $("#wkForm").innerHTML = editorForm(p);
  $("#wkPics").innerHTML = photoPicker(p);
  $("#wkEdit").showModal();
  await drawPreview(p);
}

let redraw;
function changed() {
  const p = readForm(theWeek().posts.find((x) => x.id === editing));
  savePost(p);
  clearTimeout(redraw);
  redraw = setTimeout(() => drawPreview(p), 200);
}

async function download(p) {
  const cs = await render(p, assets);
  for (let i = 0; i < cs.length; i++) {
    const blob = await toBlob(cs[i]);
    if (!blob) { toast("That picture can't be saved from here."); return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `beauty-heaven-${current}-${p.day.toLowerCase()}-${p.style}${cs.length > 1 ? `-${i + 1}` : ""}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
}

function setStatus(id, status) {
  const p = theWeek().posts.find((x) => x.id === id);
  if (!p) return;
  savePost({ ...p, status });
  renderWeek();
}

/* ----------------------------------------------------------------- WRITING -- */
async function write(only) {
  const w = theWeek();
  w.brief = $("#wkBrief").value.trim();
  store.setWeek(current, w);
  const targets = only ? w.posts.filter((p) => p.id === only) : w.posts.filter((p) => p.status !== "approved");
  if (!targets.length) return toast("Everything's approved already.");
  const btn = only ? $("#wkRewrite") : $("#wkWrite");
  btn.disabled = true; btn.textContent = "Writing…";
  try {
    const res = await fetch("/api/console-week/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        weekOf: weekLabel(current),
        brief: w.brief,
        brand: store.load().brand,
        posts: targets.map((p) => ({ id: p.id, style: p.style, day: p.day, photo: assets.get(p.photos?.[0])?.title || "" })),
      }),
    });
    const out = await res.json();
    if (!res.ok) throw new Error(out.message || out.error || res.status);
    const fresh = theWeek();
    fresh.posts = fresh.posts.map((p) => {
      const got = out.posts.find((x) => x.id === p.id);
      if (!got) return p;
      const { id, ...copy } = got;
      if (p.style !== "explainer") { delete copy.steps; delete copy.aftercareTitle; delete copy.aftercare; }
      return { ...p, ...copy, status: p.status === "binned" ? "binned" : "draft" };
    });
    store.setWeek(current, fresh);
    toast(only ? "Rewritten." : "The week is written. Have a look.");
    if (only) { const p = fresh.posts.find((x) => x.id === only); $("#wkForm").innerHTML = editorForm(p); drawPreview(p); }
    renderWeek();
  } catch (e) {
    toast(`Couldn't write it: ${e.message}`);
  } finally {
    btn.disabled = false; btn.textContent = only ? "Rewrite with Claude" : "Write the week";
  }
}

/* ------------------------------------------------------------------- WIRING -- */
export function mountWeek(h) {
  ({ $, $$, esc, toast } = h);

  $("#wkPrev").addEventListener("click", () => { current = addWeeks(current, -1); renderWeek(); });
  $("#wkNext").addEventListener("click", () => { current = addWeeks(current, 1); renderWeek(); });
  $("#wkThis").addEventListener("click", () => { current = mondayOf(); renderWeek(); });
  $("#wkWrite").addEventListener("click", () => write());
  $("#wkBrief").addEventListener("change", () => { const w = theWeek(); w.brief = $("#wkBrief").value.trim(); store.setWeek(current, w); });
  $("#wkApproveAll").addEventListener("click", () => {
    const w = theWeek();
    w.posts = w.posts.map((p) => (p.status === "draft" ? { ...p, status: "approved" } : p));
    store.setWeek(current, w); renderWeek(); toast("All approved.");
  });
  $("#wkDownloadAll").addEventListener("click", async () => {
    const ok = theWeek().posts.filter((p) => p.status === "approved");
    if (!ok.length) return toast("Approve something first.");
    for (const p of ok) await download(p);
  });

  $("#wkGrid").addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) return openEditor(open.dataset.open);
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const id = act.closest(".wkpost").dataset.id;
    if (act.dataset.act === "download") return download(theWeek().posts.find((p) => p.id === id));
    setStatus(id, { approve: "approved", bin: "binned", draft: "draft" }[act.dataset.act]);
  });

  $("#wkForm").addEventListener("input", changed);
  $("#wkPics").addEventListener("click", (e) => {
    const s = e.target.closest("[data-slot]");
    const pic = e.target.closest("[data-pic]");
    const p = theWeek().posts.find((x) => x.id === editing);
    if (s) { slot = Number(s.dataset.slot); $("#wkPics").innerHTML = photoPicker(p); return; }
    if (!pic) return;
    const photos = [...(p.photos || [])];
    photos[slot] = pic.dataset.pic;
    const next = { ...p, photos };
    savePost(next);
    $("#wkPics").innerHTML = photoPicker(next);
    if (p.style === "explainer") shown = slot;
    drawPreview(next);
  });
  $("#wkDots").addEventListener("click", (e) => {
    const d = e.target.closest("[data-dot]");
    if (!d) return;
    shown = Number(d.dataset.dot);
    drawPreview(theWeek().posts.find((x) => x.id === editing));
  });
  $("#wkEdApprove").addEventListener("click", () => { setStatus(editing, "approved"); $("#wkEdit").close(); toast("Approved."); });
  $("#wkEdBin").addEventListener("click", () => { setStatus(editing, "binned"); $("#wkEdit").close(); });
  $("#wkEdDownload").addEventListener("click", () => download(theWeek().posts.find((x) => x.id === editing)));
  $("#wkEdCaption").addEventListener("click", () => {
    const p = theWeek().posts.find((x) => x.id === editing);
    navigator.clipboard.writeText(p.caption || "").then(() => toast("Caption copied."), () => toast("Couldn't reach the clipboard."));
  });
  $("#wkRewrite").addEventListener("click", () => write(editing));
  $("#wkEdClose").addEventListener("click", () => $("#wkEdit").close());
  $("#wkEdit").addEventListener("close", () => { editing = null; renderWeek(); });
}
