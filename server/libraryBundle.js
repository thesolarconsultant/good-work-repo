// =========================================================
// The Library bundle — the thing a customer downloads.
//
// One set of pure functions, used twice:
//   scripts/build-library-bundle.mjs  writes it to dist-library/ and zips it
//                                     with DEFLATE (Node's zlib);
//   api/download.js                   zips it in memory on the edge runtime,
//                                     stored uncompressed, after the access
//                                     key has been checked.
// No filesystem, no Node-only APIs, and nothing from src/ that touches
// import.meta.env, so the same code runs in both places and the file the
// owner hands over by hand is byte-for-byte what the site serves.
//
// Contents of goodwork-library-<version>/
//   README.md                       what this is, how to use it, support
//   LICENCE.md                      the licence principles + link to the text
//   index.html                      offline gallery: search, filter, preview,
//                                   copy, view code, open standalone
//   components.json                 every component with its code, for tooling
//   snippets/<category>/<id>.html   one paste-ready file per component
// =========================================================

import { LICENCE_PRINCIPLES, UPDATE_PERIOD_MONTHS } from "../src/data/offers.js";
import { FIT_SCRIPT } from "../src/lib/previewDoc.js";

// Mirrors CONTACT_EMAIL in src/lib/site.js, which reads import.meta.env and
// so cannot be imported by server code.
export const CONTACT_EMAIL = "hello@goodwork.agency";

export const bundleName = (version) => `goodwork-library-${version}`;

const FONT = "'Poppins',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
// The same token contract the site's live previews use (src/lib/libraryCode.js).
const TOKENS =
  ":root{color-scheme:dark;background:transparent;--accent:#3366FF;--accent-2:#7A5CFF;--ink:#F4F0E8;--body:#B6BDC8;--card:#15181E;--card2:#1C2027;--line:#262C34;--bg:#0F1115}";


/** Every file in the bundle, paths relative to the bundle folder. */
export function bundleFiles({ items, version, updated, categoryNames, siteUrl, contactEmail = CONTACT_EMAIL }) {
  const site = String(siteUrl || "").replace(/\/$/, "");
  const files = [];

  files.push({ path: "README.md", content: readme({ items, version, updated, categoryNames, site, contactEmail }) });
  files.push({ path: "LICENCE.md", content: licence({ version, site, contactEmail }) });
  files.push({ path: "index.html", content: gallery({ items, version, updated, categoryNames, site, contactEmail }) });
  files.push({
    path: "components.json",
    content: `${JSON.stringify(
      {
        name: "Goodwork Library",
        version,
        updated,
        count: items.length,
        categories: categoryNames,
        licence: `${site}/legal/licence`,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          description: i.description,
          kind: i.kind,
          stack: i.stack,
          complexity: i.complexity,
          bytes: i.bytes,
          file: `snippets/${i.category}/${i.id}.html`,
          code: i.code,
        })),
      },
      null,
      2,
    )}\n`,
  });

  for (const i of items) {
    files.push({
      path: `snippets/${i.category}/${i.id}.html`,
      content:
        `<!-- Goodwork Library v${version} · ${i.name} (${categoryNames[i.category] || i.category}).\n` +
        `     Paste into your page. Reads --accent, --ink, --body, --card, --line and --bg from your brand tokens, with fallbacks.\n` +
        `     Licence: LICENCE.md in this bundle, or ${site}/legal/licence -->\n${i.code}\n`,
    });
  }
  return files;
}

// ----------------------------------------------------------------- README --

function readme({ items, version, updated, categoryNames, site, contactEmail }) {
  const byCat = {};
  for (const i of items) byCat[i.category] = (byCat[i.category] || 0) + 1;
  const rows = Object.keys(categoryNames)
    .filter((c) => byCat[c])
    .map((c) => `| ${categoryNames[c]} | ${byCat[c]} | \`snippets/${c}/\` |`)
    .join("\n");

  return `# Goodwork Library ${version}

${items.length} production-ready website components: heroes, navigation, feature
sections, pricing, FAQs, forms, footers, conversion sections, buttons, text
effects, motion, backgrounds and interface pieces. Released ${updated}.

Every component is self-contained HTML, CSS and (where needed) a few lines of
vanilla JavaScript. No build step, no framework: it works the same pasted into
a plain page, a React component, a Vue template or a CMS block.

## Start here

1. Open \`index.html\` in a browser. It is the whole Library, offline: search,
   filter by category, watch each component run, copy its code, or open it on
   its own page.
2. Paste a snippet into your page. The
   [paste-and-go starter](${site}/goodwork/index.html) has the brand tokens
   at the top and a slot to paste into.
3. Set your brand once. Components read these custom properties and fall back
   to Goodwork's defaults when they are missing:

   \`\`\`css
   :root {
     --accent: #3366FF;  /* your brand colour */
     --ink:    #F4F0E8;  /* headings and strong text */
     --body:   #B6BDC8;  /* body text */
     --card:   #15181E;  /* raised surfaces */
     --line:   #262C34;  /* 1px borders */
     --bg:     #0F1115;  /* page background */
   }
   \`\`\`

   The guide at ${site}/docs/brand-tokens covers light themes and type.

## What is in the folder

| File | What it is |
| --- | --- |
| \`index.html\` | The offline gallery. |
| \`snippets/<category>/<id>.html\` | One paste-ready file per component. |
| \`components.json\` | Every component with its code, for scripts and tooling. |
| \`LICENCE.md\` | The commercial licence principles and where the full text lives. |

## Components by category

| Category | Count | Folder |
| --- | --- | --- |
${rows}

## Updates

Your purchase includes ${UPDATE_PERIOD_MONTHS} months of Library updates. Sign
in with your access key at ${site}/login and download the current bundle from
your dashboard whenever a release ships. Keep the key private: it is your
licence.

## Support

Installation and customisation guidance: ${site}/docs
Questions: ${contactEmail}
`;
}

// ---------------------------------------------------------------- LICENCE --

function licence({ version, site, contactEmail }) {
  return `# Goodwork commercial licence — summary

This bundle (Goodwork Library ${version}) is licensed, not sold. The principles
below are a plain-English summary; the full licence text at
${site}/legal/licence is the agreement, and where the two differ the full text
applies.

${LICENCE_PRINCIPLES.map((p) => `- ${p}`).join("\n")}

Questions about what the licence allows: ${contactEmail}
`;
}

// ---------------------------------------------------------------- gallery --

function gallery({ items, version, updated, categoryNames, site, contactEmail }) {
  const data = JSON.stringify({
    version,
    updated,
    categories: categoryNames,
    items: items.map((i) => ({ id: i.id, name: i.name, description: i.description, category: i.category, stack: i.stack, bytes: i.bytes, code: i.code })),
  }).replace(/</g, "\\u003c");

  // String.raw keeps the regex backslashes in the page script intact. The page
  // script uses no backticks and no "${", so nothing else needs escaping.
  return String.raw`<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>Goodwork Library ${version}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap">
<style>
:root{color-scheme:dark;--bg:#14161c;--bg-1:#1a1d24;--bg-2:#20242c;--line:rgba(255,255,255,.13);--line-strong:rgba(255,255,255,.26);--paper:#f4f0e8;--text-2:rgba(244,240,232,.8);--text-3:rgba(244,240,232,.62);--accent:#3366ff;--accent-text:#8fadff;--accent-soft:rgba(51,102,255,.18);--mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;--sans:${FONT};--r:12px}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--paper);font-family:var(--sans);line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1280px;margin:0 auto;padding:0 20px}
.top{border-bottom:1px solid var(--line);padding:36px 0 22px}
.brand{display:flex;flex-wrap:wrap;align-items:baseline;gap:14px}
.wordmark{font-weight:800;font-size:1.5rem;letter-spacing:.02em;background:linear-gradient(135deg,#3366FF 0%,#7A5CFF 38%,#FF2DB3 74%,#FF6B5E 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.tag{font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3)}
.lede{max-width:64ch;color:var(--text-2);margin:12px 0 18px;font-size:.95rem}
.tools{display:grid;gap:12px}
.search{width:100%;max-width:420px;min-height:44px;padding:.6rem .9rem;background:var(--bg-1);border:1px solid var(--line-strong);border-radius:var(--r);color:var(--paper);font:inherit;font-size:.95rem}
.search:focus{outline:none;border-color:var(--accent-text);box-shadow:0 0 0 3px var(--accent-soft)}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chip{appearance:none;cursor:pointer;border:1px solid var(--line);background:var(--bg-1);color:var(--text-2);font:600 .8rem var(--sans);padding:.45rem .8rem;border-radius:999px}
.chip:hover{border-color:var(--line-strong);color:var(--paper)}
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:#fff}
.chip:focus-visible,.btn:focus-visible,.search:focus-visible{outline:2px solid var(--accent-text);outline-offset:2px}
.count{font-family:var(--mono);font-size:.72rem;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin:22px 0 14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;padding-bottom:60px}
.card{border:1px solid var(--line);border-radius:var(--r);background:var(--bg-1);overflow:hidden;display:flex;flex-direction:column}
.preview{height:210px;border-bottom:1px solid var(--line);background:radial-gradient(120% 120% at 50% -10%,#1c2029 0,#14161c 60%);position:relative}
.preview iframe{width:100%;height:100%;border:0;display:block}
.cat{position:absolute;top:10px;left:12px;font:600 .62rem var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--accent-text);background:rgba(20,22,28,.85);border:1px solid var(--line);padding:3px 8px;border-radius:999px}
.body{padding:14px 16px 16px;display:grid;gap:8px;flex:1}
.name{margin:0;font-size:1rem;font-weight:600}
.desc{margin:0;color:var(--text-2);font-size:.86rem}
.meta{margin:0;font-family:var(--mono);font-size:.68rem;letter-spacing:.06em;color:var(--text-3)}
.actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:6px}
.btn{appearance:none;cursor:pointer;border:1px solid var(--line-strong);background:transparent;color:var(--paper);font:600 .8rem var(--sans);padding:.5rem .85rem;border-radius:8px}
.btn:hover{border-color:var(--accent-text)}
.btn--primary{background:var(--accent);border-color:var(--accent);color:#fff}
.btn--primary:hover{filter:brightness(1.08)}
.code{display:none;margin:0;border-top:1px solid var(--line);background:#0c0d11;color:#d7d2c8;font:.74rem/1.6 var(--mono);padding:14px 16px;max-height:360px;overflow:auto;white-space:pre;tab-size:2}
.card.open .code{display:block}
.empty{padding:40px 0;color:var(--text-3)}
.foot{border-top:1px solid var(--line);padding:22px 20px 40px;color:var(--text-3);font-size:.82rem}
.foot a{color:var(--accent-text)}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;background:var(--paper);color:#14161c;font:600 .85rem var(--sans);padding:.6rem 1rem;border-radius:999px;transition:.2s;pointer-events:none}
.toast.on{opacity:1;transform:translateX(-50%)}
@media (prefers-reduced-motion:reduce){.toast{transition:none}}
</style>
</head>
<body>
<header class="top">
  <div class="wrap">
    <div class="brand"><span class="wordmark">GOOD WORK.</span><span class="tag">Library · v${version} · ${items.length} components · ${updated}</span></div>
    <p class="lede">Your whole Library, offline. Search, filter by category, watch each component run, copy its code, or open it on a page of its own. Every snippet reads your brand tokens (<code>--accent</code>, <code>--ink</code>, <code>--body</code>, <code>--card</code>, <code>--line</code>, <code>--bg</code>) and falls back to Goodwork's defaults.</p>
    <div class="tools">
      <input class="search" id="q" type="search" placeholder="Search components" aria-label="Search components" autocomplete="off">
      <div class="chips" id="chips" role="group" aria-label="Category"></div>
    </div>
  </div>
</header>
<main class="wrap">
  <p class="count" id="count" aria-live="polite"></p>
  <div class="grid" id="grid"></div>
</main>
<footer class="foot"><div class="wrap">Licensed under the Goodwork commercial licence — see LICENCE.md, or <a href="${site}/legal/licence">the full text</a>. Updates for ${UPDATE_PERIOD_MONTHS} months: sign in at <a href="${site}/login">${site.replace(/^https?:\/\//, "")}/login</a>. Support: <a href="mailto:${contactEmail}">${contactEmail}</a>.</div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script id="gw-data" type="application/json">${data}</script>
<script>
(function () {
  var DATA = JSON.parse(document.getElementById("gw-data").textContent);
  var items = DATA.items, names = DATA.categories;
  var FONT = "${FONT}";
  var TOKENS = "${TOKENS}";
  // Centres each snippet and scales it down if it is bigger than its frame,
  // the same fit the website's previews use.
  var FIT = ${JSON.stringify(FIT_SCRIPT)};
  function wrap(code) {
    return '<!doctype html><html><head><meta charset="utf-8"><meta name="color-scheme" content="dark"><style>' + TOKENS + '*{box-sizing:border-box}html,body{height:100%;margin:0}body{background:transparent;color:var(--ink);font-family:' + FONT + ';overflow:hidden;text-align:center}#gw-stage{min-height:100%;display:grid;place-items:center;align-content:center;padding:18px}a{cursor:default}</style></head><body><div id="gw-stage">' + code + '</div><script>' + FIT + '<\/script></body></html>';
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function standalone(item) {
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(item.name) + '</title><style>' + TOKENS + 'body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font-family:' + FONT + ';padding:40px}</style></head><body>' + item.code + '</body></html>';
  }
  var q = "", cat = "all";
  var grid = document.getElementById("grid"), count = document.getElementById("count"), chips = document.getElementById("chips"), search = document.getElementById("q"), toast = document.getElementById("toast");
  var cats = Object.keys(names).filter(function (c) { return items.some(function (i) { return i.category === c; }); });
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var f = e.target;
      if (!f.getAttribute("srcdoc")) f.setAttribute("srcdoc", wrap(items[Number(f.dataset.i)].code));
      io.unobserve(f);
    });
  }, { rootMargin: "300px" }) : null;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function btn(label, cls, fn) { var b = el("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }
  function chip(id, label, n) {
    var b = btn(label + " · " + n, "chip", function () { cat = id; render(); });
    b.setAttribute("aria-pressed", String(cat === id));
    return b;
  }
  function renderChips() {
    chips.textContent = "";
    chips.appendChild(chip("all", "All", items.length));
    cats.forEach(function (c) { chips.appendChild(chip(c, names[c], items.filter(function (i) { return i.category === c; }).length)); });
  }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) res(); else rej(new Error("copy failed"));
    });
  }
  var toastTimer;
  function say(t) { toast.textContent = t; toast.classList.add("on"); clearTimeout(toastTimer); toastTimer = setTimeout(function () { toast.classList.remove("on"); }, 1800); }

  function card(item, idx) {
    var c = el("article", "card");
    var pv = el("div", "preview");
    var f = document.createElement("iframe");
    f.title = item.name + " preview"; f.setAttribute("sandbox", "allow-scripts"); f.setAttribute("loading", "lazy"); f.dataset.i = idx;
    if (io) io.observe(f); else f.setAttribute("srcdoc", wrap(item.code));
    pv.appendChild(f); pv.appendChild(el("span", "cat", names[item.category] || item.category));
    var body = el("div", "body");
    body.appendChild(el("h2", "name", item.name));
    body.appendChild(el("p", "desc", item.description));
    body.appendChild(el("p", "meta", item.id + " · " + item.stack.join(" + ") + " · " + item.bytes.toLocaleString() + " bytes"));
    var acts = el("div", "actions");
    acts.appendChild(btn("Copy code", "btn btn--primary", function () {
      copyText(item.code).then(function () { say("Copied " + item.name); }, function () { say("Copy failed. Use View code and select it."); });
    }));
    var view = btn("View code", "btn", function () {
      var open = c.classList.toggle("open");
      view.textContent = open ? "Hide code" : "View code";
      view.setAttribute("aria-expanded", String(open));
    });
    view.setAttribute("aria-expanded", "false");
    acts.appendChild(view);
    acts.appendChild(btn("Open", "btn", function () {
      var url = URL.createObjectURL(new Blob([standalone(item)], { type: "text/html" }));
      window.open(url, "_blank");
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }));
    body.appendChild(acts);
    var pre = el("pre", "code", item.code); pre.tabIndex = 0;
    c.appendChild(pv); c.appendChild(body); c.appendChild(pre);
    return c;
  }
  function match(i) {
    if (cat !== "all" && i.category !== cat) return false;
    if (!q) return true;
    var hay = (i.name + " " + i.description + " " + i.id + " " + (names[i.category] || "")).toLowerCase();
    return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
  }
  function render() {
    renderChips();
    grid.textContent = "";
    var n = 0;
    items.forEach(function (i, idx) { if (!match(i)) return; n++; grid.appendChild(card(i, idx)); });
    count.textContent = n + " of " + items.length + " components" + (cat !== "all" ? " · " + names[cat] : "") + (q ? " · “" + q + "”" : "");
    if (!n) grid.appendChild(el("p", "empty", "Nothing matches. Try another word or clear the category."));
  }
  var timer;
  search.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { q = search.value.trim().toLowerCase(); render(); }, 150); });
  render();
})();
</script>
</body>
</html>
`;
}

// -------------------------------------------------------------------- zip --

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * zip(files, { prefix, deflate, date }) -> Uint8Array
 *
 * A plain ZIP writer: local headers, central directory, end record. Entries
 * are stored, or deflated when a `deflate(bytes) -> bytes` function is given
 * (Node passes zlib; the edge runtime passes nothing). `prefix` puts every
 * entry under a folder so an archive extracts to one directory. `date` fixes
 * the timestamps so the same input always produces the same archive.
 */
export function zip(files, { prefix = "", deflate = null, date = new Date("2026-01-01T09:00:00Z") } = {}) {
  const enc = new TextEncoder();
  const dosTime = (date.getUTCHours() << 11) | (date.getUTCMinutes() << 5) | (date.getUTCSeconds() >> 1);
  const dosDate = ((date.getUTCFullYear() - 1980) << 9) | ((date.getUTCMonth() + 1) << 5) | date.getUTCDate();
  const parts = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(prefix + f.path);
    const data = typeof f.content === "string" ? enc.encode(f.content) : f.content;
    const crc = crc32(data);
    let method = 0;
    let out = data;
    if (deflate) {
      const d = deflate(data);
      if (d.length < data.length) {
        method = 8;
        out = d;
      }
    }

    const local = new Uint8Array(30 + name.length);
    const l = new DataView(local.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true); // version needed
    l.setUint16(6, 0x0800, true); // UTF-8 names
    l.setUint16(8, method, true);
    l.setUint16(10, dosTime, true);
    l.setUint16(12, dosDate, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, out.length, true);
    l.setUint32(22, data.length, true);
    l.setUint16(26, name.length, true);
    l.setUint16(28, 0, true);
    local.set(name, 30);

    const cd = new Uint8Array(46 + name.length);
    const c = new DataView(cd.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 0x0314, true); // made by: Unix, 2.0
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, method, true);
    c.setUint16(12, dosTime, true);
    c.setUint16(14, dosDate, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, out.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true);
    c.setUint16(30, 0, true); // extra
    c.setUint16(32, 0, true); // comment
    c.setUint16(34, 0, true); // disk
    c.setUint16(36, 0, true); // internal attributes
    c.setUint32(38, (0o100644 << 16) >>> 0, true); // -rw-r--r--
    c.setUint32(42, offset, true);
    cd.set(name, 46);

    parts.push(local, out);
    central.push(cd);
    offset += local.length + out.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const eocd = new Uint8Array(22);
  const e = new DataView(eocd.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(4, 0, true);
  e.setUint16(6, 0, true);
  e.setUint16(8, files.length, true);
  e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true);
  e.setUint32(16, offset, true);
  e.setUint16(20, 0, true);

  const all = [...parts, ...central, eocd];
  const bytes = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let pos = 0;
  for (const p of all) {
    bytes.set(p, pos);
    pos += p.length;
  }
  return bytes;
}
