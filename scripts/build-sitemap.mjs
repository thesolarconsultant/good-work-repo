// Writes public/sitemap.xml and public/robots.txt from the routes the app
// actually serves. Runs automatically before every build.
//
// The static routes below mirror src/App.jsx; the item routes come from the
// generated catalogue and the hand-authored template and system slugs in
// src/data/library.js. Keep both lists honest when a route is added.
//
// robots.txt is generated rather than hand-kept so its Sitemap: line can never
// drift from the domain everything else is built with.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = (process.env.VITE_SITE_URL || "https://goodworkagency.uk").replace(/\/$/, "");

const STATIC = [
  ["/", "1.0", "weekly"],
  ["/library", "0.9", "weekly"],
  ["/studio", "0.9", "monthly"],
  ["/pricing", "0.9", "monthly"],
  ["/built-by-goodwork", "0.8", "monthly"],
  ["/crm", "0.8", "monthly"],
  ["/agency", "0.8", "monthly"],
  ["/managed", "0.7", "monthly"],
  ["/services", "0.8", "monthly"],
  ["/systems", "0.8", "monthly"],
  ["/systems/content-console", "0.7", "monthly"],
  ["/systems/whatsapp-bot", "0.7", "monthly"],
  ["/systems/voice-agent", "0.7", "monthly"],
  ["/systems/brand-guide", "0.6", "monthly"],
  ["/systems/automations", "0.6", "monthly"],
  ["/showcase", "0.8", "monthly"],
  ["/learn", "0.7", "weekly"],
  ["/learn/build-a-site-from-the-engine", "0.6", "monthly"],
  ["/learn/how-the-content-console-pipeline-works", "0.6", "monthly"],
  ["/learn/one-time-ownership-monthly-only-if-we-run-it", "0.6", "monthly"],
  ["/learn/what-the-agency-programme-actually-covers", "0.6", "monthly"],
  ["/docs/getting-started", "0.6", "monthly"],
  ["/docs/installing-components", "0.5", "monthly"],
  ["/docs/brand-tokens", "0.5", "monthly"],
  ["/docs/licence-summary", "0.5", "monthly"],
  ["/contact", "0.6", "yearly"],
  ["/legal/cookies", "0.2", "yearly"],
];

// Library item pages. Templates and systems are listed in src/data/library.js;
// the generated catalogue supplies the rest.
const EXTRA_SLUGS = [
  "paste-and-go-starter",
  "trade-and-field-service-site",
  "professional-services-site",
  "single-offer-landing-page",
  "content-console",
  "whatsapp-bot",
  "voice-agent",
  "brand-guide-system",
  "automation-blueprints",
  "crm-pipeline-interface",
];
const catalogue = JSON.parse(readFileSync(join(root, "src", "data", "libraryCatalogue.json"), "utf8"));
const ITEMS = [...EXTRA_SLUGS, ...catalogue.map((c) => c.slug)].map((slug) => [`/library/${slug}`, "0.5", "monthly"]);

const ROUTES = [...STATIC, ...ITEMS];
const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  ([path, priority, changefreq]) => `  <url>
    <loc>${site}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
).join("\n")}
</urlset>
`;
writeFileSync(join(root, "public", "sitemap.xml"), xml);

// Draft legal pages carry noindex in the app; keep crawlers off the customer
// area and the deck too.
const robots = `User-agent: *
Allow: /
Disallow: /dashboard
Disallow: /login
Disallow: /pitch
Disallow: /api/

Sitemap: ${site}/sitemap.xml
`;
writeFileSync(join(root, "public", "robots.txt"), robots);

console.log(`sitemap: ${ROUTES.length} routes at ${site}`);
console.log(`robots:  sitemap points at ${site}/sitemap.xml`);
