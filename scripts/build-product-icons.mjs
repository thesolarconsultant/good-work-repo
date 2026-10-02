// Renders the product icons (src/data/icons.js) as PNGs for Stripe: one
// 1024px image per product, the round icon on a white square, plus a contact
// sheet to check them at a glance. Upload each as its product's image.
//
//   npm run icons            -> dist-icons/
//   npm run icons -- <dir>   -> somewhere else
//
// The site draws the same icons inline (components/OfferIcon.jsx), so a change
// to a glyph shows in both places.

import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { ICONS, iconSvg } from "../src/data/icons.js";
import { OFFER, MANAGED_PLANS, COACHING, CRM_RUNNING } from "../src/data/offers.js";

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require("playwright"));
} catch {
  ({ chromium } = require("/opt/node22/lib/node_modules/playwright"));
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = resolve(process.argv[2] || join(root, "dist-icons"));
mkdirSync(out, { recursive: true });

// Every product's icon, named as the product is named on the site. The Studio
// system glyphs in the same file are drawn for the site only, not for Stripe.
const names = {
  ...Object.fromEntries(Object.values(OFFER).map((o) => [o.id, o.name])),
  ...Object.fromEntries(MANAGED_PLANS.map((p) => [p.id, p.name])),
  coaching: COACHING.name,
  "crm-running": CRM_RUNNING.name,
};
const slug = (s) => s.toLowerCase().replace(/\+/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const items = Object.keys(ICONS)
  .filter((id) => names[id])
  .map((id, i) => ({ id, name: names[id] || id, file: `${String(i + 1).padStart(2, "0")}-${slug(names[id] || id)}` }));

const html = `<!doctype html><html><head><style>
  body { margin: 0; background: #fff; font: 600 15px/1.3 system-ui, sans-serif; color: #111; }
  .icon { width: 1024px; height: 1024px; }
  .sheet { display: grid; grid-template-columns: repeat(4, 200px); gap: 28px 24px; padding: 32px; width: max-content; }
  .sheet figure { margin: 0; } .sheet svg { width: 200px; height: 200px; display: block; }
  .sheet figcaption { margin-top: 8px; font-size: 14px; }
</style></head><body>
${items.map((it) => `<div class="icon" id="i-${it.id}">${iconSvg(it.id, { gradientId: `g-${it.id}`, ground: "#ffffff" })}</div>`).join("")}
<div class="sheet" id="sheet">${items.map((it) => `<figure>${iconSvg(it.id, { gradientId: `s-${it.id}`, ground: "#ffffff", size: 200 })}<figcaption>${it.name}</figcaption></figure>`).join("")}</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1100 } });
await page.setContent(html);
for (const it of items) {
  await page.locator(`#i-${it.id}`).screenshot({ path: join(out, `${it.file}.png`) });
  writeFileSync(join(out, `${it.file}.svg`), iconSvg(it.id));
}
const sheet = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
await sheet.setContent(html);
await sheet.locator("#sheet").screenshot({ path: join(out, "contact-sheet.png") });
await browser.close();

console.log(`icons: ${items.length} written to ${out}`);
