// Builds the Library catalogue from the real component source.
//
//   node scripts/build-library-catalogue.mjs     (runs automatically before build)
//
// Source:  library-src/components.txt (kept out of public/ so the raw
//          source is never served at a guessable URL) — one snippet per
//          "@@@ id :: Name :: Category :: description" block.
// Output:  src/data/libraryCatalogue.json  — metadata only (no code), imported
//          by the app so the grid renders without a network round trip.
//          public/library/items/<id>.json   — the code for one item, fetched on
//          demand for the live preview and the detail page's code panel.
//
// Splitting metadata from code keeps ~190kB of snippet source out of the
// JavaScript bundle: a visitor downloads only the previews they scroll to.
//
// Nothing here is a download in the licensed sense — the item files carry the
// same preview code the public gallery already renders. Paid asset bundles
// (templates, systems) are delivered server-side once accounts exist; see
// docs/BACKEND.md.

import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "library-src", "components.txt");
const META_OUT = join(root, "src", "data", "libraryCatalogue.json");
const ITEMS_DIR = join(root, "public", "library", "items");

const raw = readFileSync(SRC, "utf8");
const parts = raw.split(/^@@@ /m).filter(Boolean);

// The brief's browsing categories. Each source entry is mapped onto exactly
// one, from its Sections sub-category first, then its engine category.
const SUB_TO_CATEGORY = {
  Hero: "heroes",
  Pricing: "pricing",
  "Feature Section": "features",
  FAQ: "faq",
  CTA: "conversion",
  Footer: "navigation",
  Stats: "features",
  "Social Proof": "social-proof",
  Testimonials: "social-proof",
};
const CAT_TO_CATEGORY = {
  Buttons: "buttons",
  "Text Animations": "text",
  Animations: "motion",
  "Special Effects": "motion",
  Backgrounds: "backgrounds",
  Components: "interface",
  Community: "interface",
  Carousels: "interface",
  "Device Mocks": "interface",
};
// A few interface pieces are really navigation or forms by role.
const ID_TO_CATEGORY = {
  navbar: "navigation",
  gooeynav: "navigation",
  flowingmenu: "navigation",
  dock: "navigation",
  heroemail: "forms",
  footernews: "forms",
  stepper: "forms",
  accordion: "faq",
  toggle: "forms",
  themetoggler: "forms",
  terminal: "dashboards",
  filetree: "dashboards",
  codecompare: "dashboards",
  bars: "dashboards",
  ring: "dashboards",
  circularprogress: "dashboards",
  ticker: "dashboards",
  countup: "dashboards",
  animlist: "dashboards",
  fcnotify: "dashboards",
  fclist: "dashboards",
  fcstream: "dashboards",
  fcgrowth: "dashboards",
  bento: "features",
  magicbento: "features",
  featureaccordion: "features",
  featureaccordionr: "features",
  featurescroll: "features",
  featuregrid: "features",
  fccopilot: "features",
  fcsocial: "features",
  fcshare: "features",
  fcintegrations: "features",
  fcreply: "features",
  fcshowcase: "features",
};

// Which snippets need a script to run, so the detail page can say so.
const usesScript = (code) => /<script[\s>]/i.test(code);
const usesCanvas = (code) => /<canvas|getContext\(/i.test(code);

const items = parts.map((block) => {
  const nl = block.indexOf("\n");
  const head = block.slice(0, nl).trim();
  const code = block.slice(nl + 1).replace(/\s+$/, "");
  const [id, name, engineCategory, description] = head.split(" :: ").map((s) => s.trim());
  const dash = name.indexOf(" — ");
  const sub = dash > 0 ? name.slice(0, dash).trim() : null;
  const category =
    ID_TO_CATEGORY[id] || (sub && SUB_TO_CATEGORY[sub]) || CAT_TO_CATEGORY[engineCategory] || "interface";
  const kind = engineCategory === "Sections" ? "section" : "component";
  return {
    id,
    slug: id,
    name,
    description,
    kind, // section | component  (templates and systems are added in data/library.js)
    category,
    sub,
    engineCategory,
    tier: "library",
    status: "available", // available | preview | coming-soon
    stack: ["HTML", "CSS", ...(usesScript(code) ? ["JavaScript"] : [])],
    complexity: usesCanvas(code) ? "moderate" : usesScript(code) ? "easy" : "drop-in",
    dependencies: [],
    bytes: Buffer.byteLength(code, "utf8"),
    version: "1.0.0",
    updated: "2026-09-26",
    code,
  };
});

// Sanity: ids must be unique, or two cards fetch the same preview.
const seen = new Set();
for (const it of items) {
  if (seen.has(it.id)) throw new Error(`duplicate component id: ${it.id}`);
  seen.add(it.id);
}

mkdirSync(ITEMS_DIR, { recursive: true });
// Remove stale item files so a renamed component doesn't leave an orphan.
for (const f of readdirSync(ITEMS_DIR)) if (f.endsWith(".json")) unlinkSync(join(ITEMS_DIR, f));

for (const it of items) {
  writeFileSync(join(ITEMS_DIR, `${it.id}.json`), JSON.stringify({ id: it.id, code: it.code }));
}

const meta = items.map(({ code: _code, ...rest }) => rest);
const next = `${JSON.stringify(meta, null, 2)}\n`;
const prev = existsSync(META_OUT) ? readFileSync(META_OUT, "utf8") : "";
if (prev !== next) writeFileSync(META_OUT, next);

const byCat = {};
for (const it of meta) byCat[it.category] = (byCat[it.category] || 0) + 1;
console.log(`library: ${meta.length} items → ${META_OUT}`);
console.log(`library: ${Object.entries(byCat).map(([k, v]) => `${k} ${v}`).join(", ")}`);
