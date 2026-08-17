// Writes public/sitemap.xml from the routes the app actually serves.
// Run it whenever a route is added: node scripts/build-sitemap.mjs

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = (process.env.VITE_SITE_URL || "https://goodwork.agency").replace(/\/$/, "");

const ROUTES = [
  { path: "/", priority: "1.0", changefreq: "monthly" },
  { path: "/work", priority: "0.9", changefreq: "monthly" },
  { path: "/case-studies", priority: "0.9", changefreq: "monthly" },
  { path: "/content-console", priority: "0.8", changefreq: "monthly" },
  { path: "/services", priority: "0.8", changefreq: "monthly" },
  { path: "/contact", priority: "0.7", changefreq: "yearly" },
];

const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${ROUTES.map(
  (r) => `  <url>
    <loc>${site}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`,
).join("\n")}
</urlset>
`;

writeFileSync(join(root, "public", "sitemap.xml"), xml);
console.log(`sitemap: ${ROUTES.length} routes at ${site}`);
