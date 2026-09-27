// =========================================================
// Customer access — sign in with an access key.
//
//   GET    /api/access            the session behind the cookie: 200 or 401
//   POST   /api/access  { key }   checks the key; on success sets the session
//                                 cookie and returns what the key covers
//   DELETE /api/access            clears the cookie
//
// All three answer 503 until ACCESS_KEYS is set (server/accessKeys.js,
// .env.example), and the sign-in page says so instead of showing a form that
// cannot work. The response never contains a key: it carries the products the
// key covers and the downloads the server will honour for it, which is what
// the dashboard renders. Entitlements come from the server's list, never from
// anything the browser claims.
//
// This is the interim store described in docs/BACKEND.md: keys are issued by
// hand from verified payment events until a database exists. When one does,
// authorise() in server/accessKeys.js is the only function that changes.
// =========================================================

import { authorise, keyFromRequest, sessionCookies, clearCookies } from "../server/accessKeys.js";
import { LIBRARY_VERSION, LIBRARY_UPDATED, LIBRARY_COUNT } from "../server/generated/libraryMeta.js";

export const config = { runtime: "edge" };

// What can be downloaded today, per product. Studio holders get the Library
// bundle now; the Studio systems are released in stages and appear here as
// they ship, so nothing is listed that does not exist.
const DOWNLOADS = [
  {
    product: "library",
    name: "Goodwork Library",
    version: LIBRARY_VERSION,
    updated: LIBRARY_UPDATED,
    items: LIBRARY_COUNT,
    filename: `goodwork-library-${LIBRARY_VERSION}.zip`,
    href: "/api/download?product=library",
    note: `${LIBRARY_COUNT} components as paste-ready files, an offline gallery with previews and copy, components.json, and the licence.`,
  },
];

function json(body, status = 200, cookies = []) {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
}

function sessionBody(auth) {
  return {
    ok: true,
    configured: true,
    user: { id: auth.keyId, name: auth.label },
    entitlements: auth.products.map((productId) => ({ productId, source: "access-key" })),
    downloads: DOWNLOADS.filter((d) => auth.products.includes(d.product)),
    pending: auth.products.includes("studio") ? ["The Studio systems are released in stages and will appear here as they ship."] : [],
  };
}

export default async function handler(request) {
  const method = request.method.toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "GET, POST, DELETE, OPTIONS" } });

  if (!process.env.ACCESS_KEYS) {
    return json({ ok: false, configured: false, error: "Customer access isn't switched on for this deployment yet." }, 503);
  }

  if (method === "DELETE") return json({ ok: true, signedOut: true }, 200, clearCookies());

  if (method === "GET") {
    const auth = await authorise(keyFromRequest(request));
    // A cookie that no longer matches (a revoked key) is cleared so the app
    // stops asking.
    if (!auth.ok) return json({ ok: false, configured: true }, 401, auth.reason === "invalid" ? clearCookies() : []);
    return json(sessionBody(auth));
  }

  if (method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Malformed request." }, 400);
    }
    const key = typeof body?.key === "string" ? body.key.trim() : "";
    if (!key) return json({ ok: false, error: "Enter your access key." }, 400);
    if (key.length > 200) return json({ ok: false, error: "That doesn't look like an access key." }, 400);

    const auth = await authorise(key);
    if (!auth.ok) {
      return json({ ok: false, configured: true, error: "That access key isn't recognised. Check for missing characters, or reply to your purchase email and we'll sort it." }, 401);
    }
    console.log(JSON.stringify({ event: "access.sign_in", keyId: auth.keyId, product: auth.product, at: new Date().toISOString() }));
    return json(sessionBody(auth), 200, sessionCookies(key));
  }

  return json({ error: "Use GET, POST or DELETE." }, 405);
}
