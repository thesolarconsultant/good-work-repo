// The document every Library preview renders, and helpers around it.
//
// Pure (no React, no import.meta), so the same code builds the site's live
// previews (src/lib/libraryCode.js), the offline gallery in the customer
// bundle and the download endpoint (server/libraryBundle.js).


// Every catalogue snippet is a fixed-width piece (sections included: they are
// built at 290-340px), so previews render them at their real size and the fit
// script only ever shrinks. Real pages (templates) lay out at one of these
// widths and are scaled down to the frame like a screenshot.
export const DESKTOP_STAGE = 1280;
export const MOBILE_STAGE = 390;

// The token contract every snippet reads, with Goodwork's defaults. The same
// values sit at the top of the paste-and-go starter.
export const BRAND_TOKENS = [
  { name: "--accent", value: "#3366FF", use: "Brand colour: buttons, highlights, beams and focus" },
  { name: "--accent-2", value: "#7A5CFF", use: "Second brand colour, for gradients" },
  { name: "--ink", value: "#F4F0E8", use: "Headings and strong text" },
  { name: "--body", value: "#B6BDC8", use: "Body copy" },
  { name: "--card", value: "#15181E", use: "Raised surfaces: cards, pills, panels" },
  { name: "--card2", value: "#1C2027", use: "Secondary surfaces" },
  { name: "--line", value: "#262C34", use: "1px borders and dividers" },
  { name: "--bg", value: "#0F1115", use: "Page background" },
];
const TOKEN_CSS = BRAND_TOKENS.map((t) => `${t.name}:${t.value}`).join(";");

const FONT_STACK = "Poppins, 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif";

// Centres the snippet and, when it is bigger than the frame, scales it down to
// fit, so nothing in a card is ever cut off. It measures the snippet's
// top-level elements (a marquee's clipped track doesn't count; its container
// does), runs again once layout and fonts settle, and leaves animation alone
// after that. ES5 in a plain string: it runs inside the sandboxed document.
export const FIT_SCRIPT =
  "(function(){var s=document.getElementById('gw-stage');" +
  "function fit(){s.style.transform='none';var vw=innerWidth,vh=innerHeight,l=1e9,t=1e9,r=-1e9,b=-1e9,n=0,k=s.children;" +
  "for(var i=0;i<k.length;i++){var e=k[i];if(/^(SCRIPT|STYLE|LINK|META|TEMPLATE|NOSCRIPT)$/.test(e.tagName))continue;" +
  "var c=getComputedStyle(e);if(c.display==='none'||c.position==='fixed')continue;var q=e.getBoundingClientRect();" +
  "if(q.width<1||q.height<1)continue;if(q.left<l)l=q.left;if(q.top<t)t=q.top;if(q.right>r)r=q.right;if(q.bottom>b)b=q.bottom;n++}" +
  "if(!n)return;var w=r-l,h=b-t,z=Math.min(1,vw/w,vh/h);if(z<1)z=Math.max(0.2,z*0.94);" +
  "var cx=l+w/2,cy=t+h/2,dx=vw/2-cx,dy=vh/2-cy;if(z===1&&Math.abs(dx)<2&&Math.abs(dy)<2)return;" +
  "var o=s.getBoundingClientRect();s.style.transformOrigin=(cx-o.left)+'px '+(cy-o.top)+'px';" +
  "s.style.transform='translate('+dx+'px,'+dy+'px) scale('+z+')'}" +
  "fit();requestAnimationFrame(fit);setTimeout(fit,250);setTimeout(fit,1100);" +
  "if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);" +
  "var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(fit,80)})})();";

/**
 * The document a preview iframe renders: the brand tokens, the snippet inside
 * a centring stage, and the fit script. The colour scheme must match the
 * embedding page's, or Chromium paints an opaque white canvas behind the frame.
 */
export function wrapPreview(code, { pad = 18 } = {}) {
  return (
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">` +
    `<style>:root{color-scheme:dark;background:transparent;${TOKEN_CSS}}` +
    `*{box-sizing:border-box}html,body{height:100%;margin:0}` +
    `body{background:transparent;color:var(--ink);font-family:${FONT_STACK};overflow:hidden;text-align:center}` +
    `#gw-stage{min-height:100%;display:grid;place-items:center;align-content:center;padding:${pad}px}` +
    `a{cursor:default}</style></head><body><div id="gw-stage">${code}</div>` +
    `<script>${FIT_SCRIPT}</script></body></html>`
  );
}

/** A standalone page for "open in a new tab": the snippet on the brand background. */
export function standalonePreview(code, name) {
  const safe = String(name).replace(/[<>&"]/g, "");
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><title>${safe}</title>` +
    `<style>:root{color-scheme:dark;${TOKEN_CSS}}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--ink);font-family:${FONT_STACK}}</style>` +
    `</head><body>${code}</body></html>`
  );
}

/**
 * The brand tokens a snippet reads, with the fallback it carries for each:
 * [{ name, value, use, fallback }]. Tokens the snippet declares for itself are
 * local variables, not brand tokens, and are left out.
 */
export function tokensIn(code) {
  if (!code) return [];
  const found = new Map();
  const re = /var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g;
  for (const m of code.matchAll(re)) {
    if (!found.has(m[1]) || (!found.get(m[1]) && m[2])) found.set(m[1], (m[2] || "").trim());
  }
  return BRAND_TOKENS.filter((t) => found.has(t.name)).map((t) => ({ ...t, fallback: found.get(t.name) || "" }));
}
