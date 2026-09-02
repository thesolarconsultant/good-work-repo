import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// paths are relative to this script, so `node build-library.mjs` regenerates in place
const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "components.txt");
const OUT = path.join(HERE, "..", "library.html");

// ---- parse components.txt ----
const raw = fs.readFileSync(SRC, "utf8");
const parts = raw.split(/^@@@ /m).filter(Boolean);
const comps = parts.map(block => {
  const nl = block.indexOf("\n");
  const head = block.slice(0, nl).trim();
  const code = block.slice(nl + 1).replace(/\s+$/, "");
  const [id, name, cat, desc] = head.split(" :: ");
  // Section components are named "Hero — Centered", "Footer — Minimal" and so
  // on, so the sub-category is the part before the dash. Anything without one
  // simply has no sub.
  const dash = name.indexOf(" \u2014 ");
  const sub = dash > 0 ? name.slice(0, dash).trim() : null;
  return { id, name, cat, sub, desc, code };
});
const CAT_ORDER = ["Components", "Special Effects", "Animations", "Text Animations", "Device Mocks", "Buttons", "Backgrounds", "Community", "Carousels", "Sections"];
const present = Array.from(new Set(comps.map(c => c.cat)));
const cats = ["All", ...present.sort((a, b) => {
  const ia = CAT_ORDER.indexOf(a), ib = CAT_ORDER.indexOf(b);
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
})];

// Sub-categories, in the order you would actually assemble a page. Anything
// not listed sorts alphabetically after the known ones.
const SUB_ORDER = ["Hero", "Feature Section", "Social Proof", "Stats", "Testimonials", "Pricing", "FAQ", "CTA", "Footer"];
const subRank = (x) => { const i = SUB_ORDER.indexOf(x); return i < 0 ? 99 : i; };

// A category only gets a sub-filter row when EVERY component in it carries a
// sub. Partial coverage would mean a row of chips that hides most of the
// category behind an "Other" bucket, which is worse than no row at all.
const SUBS = {};
for (const cat of present) {
  const inCat = comps.filter(c => c.cat === cat);
  if (!inCat.length || inCat.some(c => !c.sub)) continue;
  const subs = Array.from(new Set(inCat.map(c => c.sub)));
  if (subs.length < 2) continue;
  SUBS[cat] = subs.sort((a, b) => subRank(a) - subRank(b) || a.localeCompare(b));
}

const data = JSON.stringify(comps).replace(/<\/script/gi, "<\\/script");

const page = `<meta charset="utf-8">
<title>GOOD WORK. Library</title>
<meta name="description" content="Every motion, button and block from the GOOD WORK. engine — live previews and copy-ready code.">
<meta name="theme-color" content="#0B0E13">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap">
<style>
/* GOOD WORK. brand mark — gradient disc, not the engine's original sun. */
.sun .ray, .sun .face { display: none !important; }
.sun .disc { inset: 0 !important; background: linear-gradient(135deg,#3366FF 0%,#7A5CFF 38%,#FF2DB3 74%,#FF6B5E 100%) !important; }
  :root{
    --bg:#0B0E13; --panel:#0F131A; --card:#12161C; --line:#222834; --line-2:#2C3442;
    --ink:#F4F6F9; --muted:#8A93A2; --accent:#3366FF; --accent-2:#7A5CFF;
    --radius:16px; --ease:cubic-bezier(.22,1,.36,1);
    --mono:'JetBrains Mono',ui-monospace,monospace; --sans:'Poppins',system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased}
  a{color:inherit}
  .wrap{max-width:1240px;margin:0 auto;padding:0 22px}

  /* header */
  header.top{border-bottom:1px solid var(--line);background:linear-gradient(180deg,#0E1219,#0B0E13);position:relative;overflow:hidden}
  header.top .glow{position:absolute;top:-160px;left:50%;transform:translateX(-50%);width:760px;height:320px;
    background:radial-gradient(60% 100% at 50% 0,var(--accent),transparent 70%);opacity:.16;pointer-events:none}
  .top__in{position:relative;display:flex;align-items:flex-end;gap:20px;flex-wrap:wrap;padding:30px 0 26px}
  .brand{display:flex;align-items:center;gap:13px}
  .sun{position:relative;width:40px;height:40px;flex:none}
  .sun .disc{position:absolute;inset:9px;border-radius:50%;background:var(--accent)}
  .sun .ray{position:absolute;left:50%;top:50%;width:2.6px;height:6px;margin:-3px 0 0 -1.3px;border-radius:3px;background:var(--accent)}
  .sun .face{position:absolute;inset:13px;display:flex;justify-content:center;align-items:center;gap:5px}
  .sun .eye{width:4px;height:4px;border-radius:50%;background:#0B0E13}
  .sun .eye.r{animation:wink 3.6s ease-in-out infinite;transform-origin:center}
  @keyframes wink{0%,86%,100%{transform:scaleY(1)}92%{transform:scaleY(.1)}}
  .brand b{font-family:Poppins,var(--sans);font-weight:700;font-size:26px;letter-spacing:.02em}
  .brand small{display:block;font-size:11px;letter-spacing:.34em;color:var(--accent-2);font-weight:700;margin-top:2px}
  .top__spacer{flex:1}
  .top__count{font-family:var(--mono);font-size:12.5px;color:var(--muted);border:1px solid var(--line);
    padding:8px 14px;border-radius:999px;white-space:nowrap}
  .lede{max-width:60ch;color:var(--muted);font-size:15px;line-height:1.6;padding:0 0 26px}
  .lede b{color:var(--ink);font-weight:600}

  /* filter bar */
  .bar{position:sticky;top:0;z-index:20;background:rgba(11,14,19,.86);backdrop-filter:blur(12px);
    border-bottom:1px solid var(--line)}
  .bar__in{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:13px 0}
  .chip{appearance:none;cursor:pointer;border:1px solid var(--line);background:var(--card);color:var(--ink);
    font:600 13px var(--sans);padding:8px 15px;border-radius:10px;transition:.16s}
  .chip:hover{border-color:var(--line-2)}
  .chip.on{background:var(--accent);border-color:var(--accent);color:#fff}
  .chip:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  /* The sub row reads as a level down: it sits under the main bar, doesn't
     stick, and its chips are lighter until chosen. */
  .bar--sub{position:static;background:var(--panel);border-bottom:1px solid var(--line)}
  .bar--sub .bar__in{padding:10px 0}
  .chip--sub{font:600 12px var(--sans);padding:6px 12px;border-radius:8px;background:transparent;color:var(--body)}
  .chip--sub:hover{color:var(--ink)}
  .chip--sub.on{background:var(--accent-2);border-color:var(--accent-2);color:#fff}

  /* grid */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;padding:26px 0 70px}
  .card{border:1px solid var(--line);border-radius:var(--radius);background:var(--card);overflow:hidden;display:flex;flex-direction:column}
  .preview{height:200px;background:
    radial-gradient(120% 120% at 50% -10%, #10151d 0, #0B0E13 60%);
    border-bottom:1px solid var(--line);position:relative}
  .preview iframe{width:100%;height:100%;border:0;display:block}
  .cat-dot{position:absolute;top:10px;left:12px;font:700 10px var(--mono);letter-spacing:.12em;text-transform:uppercase;
    color:var(--accent-2);background:rgba(51,102,255,.10);border:1px solid rgba(51,102,255,.25);padding:4px 9px;border-radius:999px}
  .body{padding:16px 16px 15px;display:flex;flex-direction:column;gap:6px;flex:1}
  .body h3{margin:0;font-size:16.5px;font-weight:700;letter-spacing:-.01em}
  .body p{margin:0;font-size:13px;color:var(--muted);line-height:1.5;flex:1}
  .acts{display:flex;gap:8px;margin-top:12px}
  .btn{cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--ink);font:600 12.5px var(--sans);
    padding:9px 13px;border-radius:9px;display:inline-flex;align-items:center;gap:6px;transition:.15s}
  .btn:hover{border-color:var(--line-2)}
  .btn--go{background:var(--accent);border-color:var(--accent);color:#fff;flex:1;justify-content:center}
  .btn--go:hover{background:var(--accent-2);border-color:var(--accent-2)}
  .btn svg{width:14px;height:14px}
  .code{display:none;border-top:1px solid var(--line);background:#080A0F;max-height:340px;overflow:auto}
  .code.show{display:block}
  .code pre{margin:0;padding:15px 16px;font:500 12px/1.65 var(--mono);color:#c9d2e0;white-space:pre;tab-size:2}
  .code .c-tag{color:#7fb4ff}.code .c-str{color:#ffb27a}.code .c-com{color:#5a6472;font-style:italic}.code .c-key{color:#c99bff}

  footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px;line-height:1.6;padding:26px 0 60px}
  footer b{color:var(--ink)}
  footer code{font-family:var(--mono);color:var(--accent-2);background:rgba(51,102,255,.08);padding:2px 6px;border-radius:5px;font-size:12px}

  .install{margin:2px 0 26px;border:1px solid var(--accent);border-radius:14px;background:linear-gradient(180deg,rgba(51,102,255,.10),rgba(51,102,255,.03));padding:16px 18px}
  .install__row{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .install__row b{font-size:15px;font-weight:700}
  .install__row span{color:var(--muted);font-size:13px}
  .install__row .sp{flex:1}
  .install__btn{cursor:pointer;border:0;background:var(--accent);color:#fff;font:700 13.5px var(--sans);padding:11px 18px;border-radius:10px;display:inline-flex;align-items:center;gap:8px}
  .install__btn:hover{background:var(--accent-2)}
  .install__btn svg{width:15px;height:15px}
  .install pre{margin:12px 0 0;background:#080A0F;border:1px solid var(--line);border-radius:9px;padding:12px 14px;overflow:auto;
    font:500 12px/1.7 var(--mono);color:#c9d2e0}
  .install .k{color:#7fb4ff}.install .a{color:#ffb27a}
  .toast{position:fixed;left:50%;bottom:26px;transform:translate(-50%,20px);opacity:0;pointer-events:none;
    background:var(--ink);color:#0B0E13;font-weight:700;font-size:13px;padding:11px 18px;border-radius:11px;
    box-shadow:0 20px 50px -18px #000;transition:.25s;z-index:60}
  .toast.on{opacity:1;transform:translate(-50%,0)}

  /* selection */
  .btn--sel{flex:1;justify-content:center}
  .btn--sel.on{background:var(--accent);border-color:var(--accent);color:#fff}
  .card.sel{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}

  /* build tray */
  .tray{position:fixed;left:50%;bottom:20px;transform:translate(-50%,180%);transition:transform .3s var(--ease);
    z-index:50;width:min(940px,calc(100% - 28px));background:rgba(15,19,26,.97);backdrop-filter:blur(14px);
    border:1px solid var(--line-2);border-radius:16px;box-shadow:0 30px 70px -30px #000}
  .tray.on{transform:translate(-50%,0)}
  .tray__bar{display:flex;align-items:center;gap:10px;padding:12px 14px;flex-wrap:wrap}
  .tray__n{font:600 13.5px var(--sans);color:var(--muted)}
  .tray__n b{color:var(--ink);font-weight:700}
  .tray__sp{flex:1}
  .tray__btn{cursor:pointer;border:1px solid var(--line);background:var(--panel);color:var(--ink);
    font:600 13px var(--sans);padding:10px 15px;border-radius:10px;transition:.15s}
  .tray__btn:hover{border-color:var(--line-2)}
  .tray__btn--go{background:var(--accent);border-color:var(--accent);color:#fff}
  .tray__btn--go:hover{background:var(--accent-2);border-color:var(--accent-2)}
  .tray__toggle{cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--muted);
    font:600 12.5px var(--sans);padding:9px 13px;border-radius:9px}
  .tray__toggle:hover{color:var(--ink);border-color:var(--line-2)}
  .tray__form{display:none;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px 14px}
  .tray__form.on{display:grid}
  .tray__form label{display:flex;flex-direction:column;gap:5px;font:600 11px var(--sans);color:var(--muted)}
  .tray__form input{background:#080A0F;border:1px solid var(--line);border-radius:8px;color:var(--ink);
    font:500 13px var(--sans);padding:9px 11px}
  .tray__form input:focus{outline:none;border-color:var(--accent)}
  @media(max-width:560px){.tray__form{grid-template-columns:1fr}}
  @media(prefers-reduced-motion:reduce){.sun .eye.r{animation:none}.tray{transition:none}}
</style>

<header class="top">
  <span class="glow"></span>
  <div class="wrap top__in">
    <span class="brand">
      <span class="sun" id="headsun"><span class="disc"></span><span class="face"><span class="eye l"></span><span class="eye r"></span></span></span>
      <span><b>GOOD WORK.</b><small>MOTION LIBRARY</small></span>
    </span>
    <span class="top__spacer"></span>
    <span class="top__count" id="count"></span>
  </div>
  <div class="wrap"><p class="lede"><b>Pick the pieces you want</b>, then hit <b>Copy build prompt</b> — paste it into any chat (Claude, ChatGPT) and get the whole site, on-brand, in one go. Every snippet is <b>live</b> and drop-in vanilla HTML/CSS/JS; colours read from <code style="font-family:var(--mono);color:var(--accent-2)">var(--accent)</code>, so the site reskins to any identity.</p></div>
  <div class="wrap"><div class="install">
    <div class="install__row">
      <b>⚡ Install the whole engine</b>
      <span>two files → every motion auto-wires across your whole site</span>
      <span class="sp"></span>
      <button class="install__btn" id="installBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>Copy install</button>
    </div>
    <pre id="installCode"><span class="k">&lt;link</span> rel=<span class="a">"stylesheet"</span> href=<span class="a">"/goodwork/motion/goodwork-motion.css"</span><span class="k">&gt;</span>
<span class="k">&lt;script</span> src=<span class="a">"/goodwork/motion/goodwork-motion.js"</span> defer<span class="k">&gt;&lt;/script&gt;</span>
<span style="color:#5a6472">&lt;!-- then add a class (gw-shimmer, gw-aurora…) or a data-attr (data-gw-reveal,
     data-gw-count, data-gw-ticker, data-gw-typing, data-gw-magnetic…) anywhere --&gt;</span></pre>
  </div></div>
</header>

<div class="bar"><div class="wrap bar__in" id="chips"></div></div>
<div class="bar bar--sub" id="subbar" hidden><div class="wrap bar__in" id="subchips"></div></div>
<main class="wrap"><div class="grid" id="grid"></div></main>
<footer class="wrap">Part of the GOOD WORK. engine — the full block library, tokens and build docs live in <b>engine/</b> and <b>.claude/skills/brand-site/</b>. Swap <code>brand.css</code> and every motion here reskins to a new identity.</footer>
<div class="tray" id="tray">
  <div class="tray__bar">
    <span class="tray__n"><b id="trayCount">0 pieces</b> selected for your site</span>
    <span class="tray__sp"></span>
    <button class="tray__toggle" id="brandToggle">Brand details</button>
    <button class="tray__btn" id="clearSel">Clear</button>
    <button class="tray__btn tray__btn--go" id="copyPrompt">Copy build prompt →</button>
  </div>
  <div class="tray__form" id="brandForm">
    <label>Brand name<input id="bName" placeholder="e.g. Nocturne"></label>
    <label>What they do<input id="bWhat" placeholder="e.g. luxury cosmetics, for London studios"></label>
    <label>Accent colour<input id="bAccent" placeholder="#3366FF"></label>
    <label>Tone / vibe<input id="bVibe" placeholder="e.g. dramatic, premium, editorial"></label>
  </div>
</div>
<div class="toast" id="toast">Copied to clipboard</div>

<script id="data" type="application/json">${data}</script>
<script>
const COMPS = JSON.parse(document.getElementById('data').textContent);
const CATS = ${JSON.stringify(cats)};
const SUBS = ${JSON.stringify(SUBS)};
document.getElementById('count').textContent = COMPS.length + ' components';

// build the header sun's rays
(function(){var s=document.getElementById('headsun');for(var i=0;i<12;i++){var r=document.createElement('span');r.className='ray';r.style.transform='rotate('+(i*30)+'deg) translateY(-17px)';s.appendChild(r);}})();

const FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700;800&family=JetBrains+Mono:wght@700&display=swap">';
const WRAP = code => '<!doctype html><html><head><meta charset="utf-8">' + FONTS +
  '<style>:root{--accent:#3366FF;--accent-2:#7A5CFF;--ink:#F4F6F9;--card:#171B22;--line:#262C34}' +
  '*{box-sizing:border-box}html,body{height:100%;margin:0}' +
  'body{display:grid;place-items:center;background:transparent;color:var(--ink);' +
  'font-family:Poppins,system-ui,sans-serif;overflow:hidden;padding:18px;text-align:center}</style></head><body>' +
  code + '</body></html>';

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
function highlight(s){
  return esc(s)
    .replace(/(&lt;!--[\\s\\S]*?--&gt;|\\/\\/[^\\n]*)/g,'<span class="c-com">$1</span>')
    .replace(/(&lt;\\/?[a-zA-Z][\\w-]*)/g,'<span class="c-tag">$1</span>')
    .replace(/(@keyframes|@property|animation|transition|transform|var|function|const|var |setInterval|requestAnimationFrame)/g,'<span class="c-key">$1</span>');
}

const grid = document.getElementById('grid');
let active = 'All';
let activeSub = 'All';

function render(){
  grid.innerHTML = '';
  COMPS.filter(c =>
    (active === 'All' || c.cat === active) &&
    (activeSub === 'All' || c.sub === activeSub)
  ).forEach(c => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<div class="preview"><span class="cat-dot">'+(c.sub || c.cat)+'</span>'+
        '<iframe scrolling="no" title="'+c.name+'"></iframe></div>'+
      '<div class="body"><h3>'+c.name+'</h3><p>'+c.desc+'</p>'+
        '<div class="acts">'+
          '<button class="btn btn--sel" data-act="sel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg><span class="sel-t">Add</span></button>'+
          '<button class="btn" data-act="copy" title="Copy this component"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg></button>'+
          '<button class="btn" data-act="view" title="Show code"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6 2 12l6 6M16 6l6 6-6 6"/></svg></button>'+
          '<button class="btn" data-act="replay" title="Replay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg></button>'+
        '</div></div>'+
      '<div class="code"><pre><code>'+highlight(c.code)+'</code></pre></div>';
    const frame = card.querySelector('iframe');
    frame.srcdoc = WRAP(c.code);
    const selBtn = card.querySelector('[data-act="sel"]');
    if (SEL.has(c.id)) { card.classList.add('sel'); selBtn.classList.add('on'); selBtn.querySelector('.sel-t').textContent = 'Added'; }
    selBtn.addEventListener('click', () => {
      const on = !SEL.has(c.id);
      if (on) SEL.add(c.id); else SEL.delete(c.id);
      card.classList.toggle('sel', on);
      selBtn.classList.toggle('on', on);
      selBtn.querySelector('.sel-t').textContent = on ? 'Added' : 'Add';
      updateTray();
    });
    card.querySelector('[data-act="copy"]').addEventListener('click', () => copy(c.code));
    card.querySelector('[data-act="view"]').addEventListener('click', e => {
      card.querySelector('.code').classList.toggle('show');
    });
    card.querySelector('[data-act="replay"]').addEventListener('click', () => { frame.srcdoc = WRAP(c.code); });
    grid.appendChild(card);
  });
}

// chips
const chipWrap = document.getElementById('chips');
const subBar = document.getElementById('subbar');
const subWrap = document.getElementById('subchips');

function buildSubs(){
  const subs = SUBS[active];
  subWrap.innerHTML = '';
  subBar.hidden = !subs;
  if (!subs) return;
  ['All'].concat(subs).forEach(sub => {
    const b = document.createElement('button');
    b.className = 'chip chip--sub' + (sub === activeSub ? ' on' : '');
    b.textContent = sub;
    b.addEventListener('click', () => {
      activeSub = sub;
      subWrap.querySelectorAll('.chip--sub').forEach(x => x.classList.toggle('on', x === b));
      render();
    });
    subWrap.appendChild(b);
  });
}

CATS.forEach(cat => {
  const b = document.createElement('button');
  b.className = 'chip' + (cat === 'All' ? ' on' : '');
  b.textContent = cat === 'All' ? 'All' : cat;
  b.addEventListener('click', () => {
    active = cat;
    activeSub = 'All';
    chipWrap.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b));
    buildSubs();
    render();
  });
  chipWrap.appendChild(b);
});
buildSubs();

const toast = document.getElementById('toast');
function copy(text){
  const done = () => { toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 1400); };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(fallback);
  else fallback();
  function fallback(){
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select(); try{document.execCommand('copy');}catch(e){} ta.remove(); done();
  }
}

document.getElementById('installBtn').addEventListener('click', function(){
  copy('<link rel="stylesheet" href="/goodwork/motion/goodwork-motion.css">\\n<script src="/goodwork/motion/goodwork-motion.js" defer><\\/script>');
});

// ---- selection → build prompt ----
const SEL = new Set();
const tray = document.getElementById('tray');
const trayCount = document.getElementById('trayCount');
function updateTray(){
  const n = SEL.size;
  tray.classList.toggle('on', n > 0);
  trayCount.textContent = n + (n === 1 ? ' piece' : ' pieces');
}
// Every selected piece is placed by ROLE — what the block is for on the page —
// so the prompt reads as a page brief rather than a pile of snippets. The sub
// -category set at build time is the truth where there is one; the keyword map
// covers blocks from categories that carry no sub.
const ROLES = [
  { key: 'Navigation',   subs: [],                  words: ['nav','menu','header'] },
  { key: 'Hero',         subs: ['Hero'],            words: ['hero'] },
  { key: 'Social proof', subs: ['Social Proof'],    words: ['logo','press','compan','trust','marquee'] },
  { key: 'Features',     subs: ['Feature Section'], words: ['feature','bento','grid'] },
  { key: 'Stats',        subs: ['Stats'],           words: ['stat','count'] },
  { key: 'Testimonials', subs: ['Testimonials'],    words: ['testimonial','review','quote'] },
  { key: 'Pricing',      subs: ['Pricing'],         words: ['pricing','price','plan'] },
  { key: 'FAQ',          subs: ['FAQ'],             words: ['faq','accordion'] },
  { key: 'Call to action', subs: ['CTA'],           words: ['cta'] },
  { key: 'Footer',       subs: ['Footer'],          words: ['footer'] },
];
// Anything that isn't a page section — a button, a text effect, a background —
// is an ingredient rather than a section, and gets its own group at the end.
const INGREDIENTS = 'Interface pieces';

// What each kind of section actually needs written into it. This is the part
// that stops the result coming back full of "Lorem" and "Company Name".
const BRIEF = {
  'Navigation':   'The real nav: 4-6 links that match the sections actually on this page, plus one primary action.',
  'Hero':         'One promise in 12 words or fewer — what the customer gets, not what the company is. A sub-line of 25 words at most. A primary action and a quieter secondary one.',
  'Social proof': 'Five to eight names that fit this market. Say plainly in the caption whether they are clients, partners or press.',
  'Features':     'Three to six capabilities, each a benefit headline plus one plain sentence. No feature lists of nouns.',
  'Stats':        'Four figures a business like this would actually publish, each with a label that says what it measures.',
  'Testimonials': 'Three quotes in the voice of a real customer, each with a name, a role and a company. Specific about a result.',
  'Pricing':      'Real tier names, real prices in the right currency, and four to six lines per tier. Say what happens at the top tier.',
  'FAQ':          'Five or six questions customers genuinely ask before buying — including the awkward ones about price, lock-in and what happens if it goes wrong. Answer them straight.',
  'Call to action': 'One action, stated once. No second competing ask.',
  'Footer':       'Grouped links that match the real site, contact details, and the legal line.',
  [INGREDIENTS]:  'Use these where they belong inside the sections above, not as sections of their own.',
};

function roleOf(c){
  const hay = (c.id + ' ' + c.name + ' ' + c.cat).toLowerCase();
  for (const r of ROLES) {
    if (c.sub && r.subs.indexOf(c.sub) >= 0) return r.key;
  }
  // Only fall back to keywords for blocks with no sub-category of their own.
  if (!c.sub) {
    for (const r of ROLES) {
      for (const w of r.words) if (hay.indexOf(w) >= 0) return r.key;
    }
  }
  return c.cat === 'Sections' ? 'Features' : INGREDIENTS;
}
const ROLE_ORDER = ROLES.map(r => r.key).concat([INGREDIENTS]);
const rankOf = c => ROLE_ORDER.indexOf(roleOf(c));

// The tokens every block reads. This is the contract between a brand guide and
// the library: fill these in and all 166 components reskin at once.
const TOKENS = [
  '--accent      the one bold colour: buttons, active states, icon chips',
  '--accent-2    the lighter end of gradients',
  '--accent-ink  the accent as TEXT on a light ground (needs 4.5:1 contrast)',
  '--bg          page ground        --panel  alternate section band',
  '--card        raised surface     --card2  nested surface',
  '--line        hairline borders',
  '--ink         headings           --body   paragraphs   --muted  captions',
  '--radius      corner radius, drives every corner on the page',
  '--sans        body + heading face     --mono  code / eyebrow face',
];

function buildPrompt(){
  const chosen = COMPS.filter(c => SEL.has(c.id)).slice();
  chosen.sort((a,b) => (rankOf(a) - rankOf(b)) || (COMPS.indexOf(a) - COMPS.indexOf(b)));

  // group into the roles that are actually present, in page order
  const groups = [];
  ROLE_ORDER.forEach(function(role){
    const items = chosen.filter(c => roleOf(c) === role);
    if (items.length) groups.push({ role: role, items: items });
  });

  const val = id => (document.getElementById(id).value || '').trim();
  const name = val('bName'), what = val('bWhat'), accent = val('bAccent'), vibe = val('bVibe');
  const L = [];

  L.push('Build a complete, production-ready website as ONE self-contained index.html — inline CSS and JS, no build step, no dependencies beyond Google Fonts.');
  L.push('');
  L.push('─────────────────────────────────────────────');
  L.push('1. THE BRAND');
  L.push('─────────────────────────────────────────────');
  L.push('If a brand guide or style guide appears anywhere in this conversation, IT IS THE SOURCE OF TRUTH — colours, type, tone, voice, do-not-use rules. Follow it over anything below, and over your own taste.');
  L.push('');
  if (name || what || accent || vibe) {
    if (name)   L.push('- Name: ' + name);
    if (what)   L.push('- What they do: ' + what);
    if (accent) L.push('- Accent colour: ' + accent);
    if (vibe)   L.push('- Tone: ' + vibe);
  } else {
    L.push('- Name: [from the brand guide]');
    L.push('- What they do: [from the brand guide]');
    L.push('- Accent colour: [from the brand guide]');
    L.push('- Tone: [from the brand guide]');
  }
  L.push('');
  L.push('Map the guide onto these tokens, once, in a single :root. Every block below reads them, so the whole page reskins from this one place — do not hard-code a brand colour anywhere else:');
  TOKENS.forEach(t => L.push('  ' + t));
  L.push('');
  L.push('If the guide names typefaces, load them from Google Fonts and set --sans / --mono. If it gives a colour as a name rather than a hex, pick the hex that matches and say which you used.');
  L.push('');
  L.push('─────────────────────────────────────────────');
  L.push('2. THE PAGE, IN ORDER');
  L.push('─────────────────────────────────────────────');
  var n = 0;
  groups.forEach(function(g){
    // Section names already carry their type ("Hero — Centered"), so only
    // blocks without a sub need the role spelled out in front of them.
    g.items.forEach(function(c){ n++; L.push('  ' + n + '. ' + (c.sub ? c.name : g.role + ' — ' + c.name)); });
  });
  L.push('');
  L.push('─────────────────────────────────────────────');
  L.push('3. WHAT GOES IN EACH SECTION');
  L.push('─────────────────────────────────────────────');
  L.push('Replace every piece of demo copy. No lorem, no "Company Name", no invented awards, no fake logos of real companies.');
  L.push('');
  groups.forEach(function(g){
    L.push(g.role.toUpperCase() + ' — ' + (BRIEF[g.role] || ''));
  });
  L.push('');
  L.push('─────────────────────────────────────────────');
  L.push('4. HOW TO ASSEMBLE');
  L.push('─────────────────────────────────────────────');
  L.push('- Use the blocks in section 5 in the order given. They are tuned: keep the markup, the CSS and the animation. Change colour and copy, not the design.');
  L.push('- Merge the :root of every block into the ONE :root from section 1, and de-duplicate any CSS the blocks share.');
  L.push('- Rename clashing element IDs and @keyframes so two blocks cannot collide.');
  L.push('- Sticky top navigation, smooth in-page scrolling to each section, and a real responsive pass at 390px as well as desktop.');
  L.push('- Respect prefers-reduced-motion: keep the layout, drop the movement.');
  L.push('- Every image gets a real alt; every control is reachable by keyboard with a visible focus state.');
  L.push('- Return the whole page in ONE code block, ready to save as index.html.');
  L.push('');
  L.push('─────────────────────────────────────────────');
  L.push('5. THE BLOCKS (' + chosen.length + ')');
  L.push('─────────────────────────────────────────────');
  var i = 0;
  groups.forEach(function(g){
    L.push('');
    L.push('══════════════════════════════════════════════');
    L.push('  ' + g.role.toUpperCase() + '  (' + g.items.length + ')');
    L.push('══════════════════════════════════════════════');
    g.items.forEach(function(c){
      i++;
      L.push('');
      L.push('──── ' + i + '. ' + c.name + ' ────');
      if (c.desc) L.push('// ' + c.desc);
      L.push(c.code);
    });
  });
  return L.join('\\n');
}
document.getElementById('copyPrompt').addEventListener('click', function(){
  if (SEL.size === 0){
    toast.textContent = 'Pick a few pieces first';
    toast.classList.add('on');
    setTimeout(function(){ toast.classList.remove('on'); toast.textContent = 'Copied to clipboard'; }, 1500);
    return;
  }
  copy(buildPrompt());
  toast.textContent = 'Build prompt copied — paste it into any chat';
  setTimeout(function(){ toast.textContent = 'Copied to clipboard'; }, 1800);
});
document.getElementById('clearSel').addEventListener('click', function(){
  SEL.clear();
  document.querySelectorAll('.card.sel').forEach(function(el){ el.classList.remove('sel'); });
  document.querySelectorAll('.btn--sel.on').forEach(function(b){ b.classList.remove('on'); const t = b.querySelector('.sel-t'); if (t) t.textContent = 'Add'; });
  updateTray();
});
document.getElementById('brandToggle').addEventListener('click', function(){
  document.getElementById('brandForm').classList.toggle('on');
});

render();
</script>`;

fs.writeFileSync(OUT, page);
console.log("wrote", OUT, (fs.statSync(OUT).size/1024).toFixed(0), "KB •", comps.length, "components •", cats.join("/"));
