// =========================================================
// Licensed download — the Library bundle, after the access key is checked.
//
//   GET /api/download?product=library
//       with the session cookie set by /api/access, or
//       Authorization: Bearer <access key>   (command-line use)
//
// The bundle is built in memory from server/generated/libraryItems.js by the
// same code that builds the hand-over zip (server/libraryBundle.js), so the
// paid files never sit in public/ or at any guessable URL: without a valid
// key this endpoint answers 401 and there is nothing else to fetch. Each
// issued download is logged with the key's id, never the key.
//
// Stored (uncompressed) rather than deflated: the edge runtime has no zlib,
// the archive is well under a megabyte, and the shape stays identical to the
// deflated one the build script writes.
// =========================================================

import { authorise, accessConfigured, keyFromRequest } from "../server/accessKeys.js";
import ITEMS from "../server/generated/libraryItems.js";
import { LIBRARY_VERSION, LIBRARY_UPDATED, CATEGORY_NAMES } from "../server/generated/libraryMeta.js";
import { bundleFiles, bundleName, zip } from "../server/libraryBundle.js";

export const config = { runtime: "edge" };

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra } });

// One archive per site origin per isolate; the links inside it name the site.
const archives = new Map();
function archive(siteUrl) {
  let bytes = archives.get(siteUrl);
  if (!bytes) {
    const files = bundleFiles({ items: ITEMS, version: LIBRARY_VERSION, updated: LIBRARY_UPDATED, categoryNames: CATEGORY_NAMES, siteUrl });
    bytes = zip(files, { prefix: `${bundleName(LIBRARY_VERSION)}/`, date: new Date(`${LIBRARY_UPDATED}T09:00:00Z`) });
    archives.set(siteUrl, bytes);
  }
  return bytes;
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "GET, OPTIONS" } });
  if (request.method !== "GET") return json({ error: "Use GET." }, 405);

  if (!accessConfigured()) return json({ error: "Customer access isn't switched on for this deployment yet." }, 503);

  const auth = await authorise(keyFromRequest(request));
  if (!auth.ok) return json({ error: "Sign in with your access key to download." }, 401, { "WWW-Authenticate": 'Bearer realm="goodwork"' });

  const url = new URL(request.url);
  const product = url.searchParams.get("product") || "library";
  if (product === "studio") {
    return json({ error: "The Studio systems are released in stages and will appear in your dashboard as they ship. The Library bundle is available now." }, 404);
  }
  if (product !== "library") return json({ error: "Unknown product." }, 404);
  if (!auth.products.includes("library")) return json({ error: "Your access key doesn't cover this product." }, 403);

  const siteUrl = (process.env.SITE_URL || url.origin).replace(/\/$/, "");
  const bytes = archive(siteUrl);
  console.log(JSON.stringify({ event: "download.issued", product, keyId: auth.keyId, bytes: bytes.length, ua: request.headers.get("user-agent") || "", at: new Date().toISOString() }));

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${bundleName(LIBRARY_VERSION)}.zip"`,
      "Content-Length": String(bytes.length),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
