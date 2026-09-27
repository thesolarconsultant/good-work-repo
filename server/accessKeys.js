// =========================================================
// Access keys — the interim entitlement store.
//
// Until there is a database, entitlements are the ACCESS_KEYS environment
// variable: a comma-, semicolon- or newline-separated list of
//
//   <product>:<key>[:<label>]
//
// where product is "library" or "studio", key is a long random string the
// owner generates (see .env.example) and label is an optional note such as
// the customer's email, shown back to that key holder only. A Studio key
// covers the Library too, because Studio includes it.
//
// Rules this module keeps:
//   - keys are compared in constant time, through SHA-256 digests;
//   - keys never reach the browser as page data: the browser sends a key in,
//     the server answers yes or no;
//   - the session cookie is HttpOnly, Secure, SameSite=Strict and scoped to
//     /api, so page scripts never see it; a separate non-sensitive marker
//     cookie only tells the app whether it is worth asking the server;
//   - a key shorter than 16 characters is ignored, with a warning, rather
//     than accepted.
//
// Runs unchanged on Vercel's edge runtime and in Node (the test harness).
// =========================================================

export const PRODUCTS = new Set(["library", "studio"]);
export const COOKIE = "gw_access";
export const MARKER = "gw_signed_in";
export const SESSION_DAYS = 30;
const MIN_KEY_LENGTH = 16;

let parsed = { raw: null, entries: [] };

export function parseAccessKeys(raw) {
  const text = String(raw || "");
  if (parsed.raw === text) return parsed.entries;
  const entries = [];
  for (const line of text.split(/[\n,;]+/)) {
    const entry = line.trim();
    if (!entry) continue;
    const [product, key, ...rest] = entry.split(":");
    const p = (product || "").trim().toLowerCase();
    const k = (key || "").trim();
    if (!PRODUCTS.has(p) || k.length < MIN_KEY_LENGTH) {
      console.warn(`ACCESS_KEYS: ignoring a malformed entry; the form is "<library|studio>:<key of ${MIN_KEY_LENGTH}+ characters>[:label]".`);
      continue;
    }
    entries.push({ product: p, key: k, label: rest.join(":").trim() || null });
  }
  parsed = { raw: text, entries };
  return entries;
}

const encoder = new TextEncoder();
const sha256 = async (text) => new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(text)));
const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

async function sameKey(a, b) {
  const [x, y] = await Promise.all([sha256(a), sha256(b)]);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

export function productsCovered(product) {
  return product === "studio" ? ["studio", "library"] : ["library"];
}

/**
 * authorise(candidate, raw)
 *   -> { ok: false, reason: "unconfigured" | "missing" | "invalid" }
 *   -> { ok: true, keyId, label, product, products }
 *
 * Every configured key is compared, whichever one matches, so the time taken
 * does not say which entry a candidate resembled.
 */
export async function authorise(candidate, raw = process.env.ACCESS_KEYS) {
  if (!raw) return { ok: false, reason: "unconfigured" };
  const key = typeof candidate === "string" ? candidate.trim() : "";
  if (!key) return { ok: false, reason: "missing" };
  let match = null;
  for (const entry of parseAccessKeys(raw)) {
    const same = await sameKey(entry.key, key);
    if (same && !match) match = entry;
  }
  if (!match) return { ok: false, reason: "invalid" };
  return {
    ok: true,
    keyId: hex(await sha256(match.key)).slice(0, 12),
    label: match.label,
    product: match.product,
    products: productsCovered(match.product),
  };
}

/** The key a request carries: a Bearer token (command-line use) or the session cookie. */
export function keyFromRequest(request) {
  const auth = request.headers.get("authorization") || "";
  const bearer = auth.match(/^Bearer\s+(.+)$/i);
  if (bearer) return bearer[1].trim();
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name !== COOKIE) continue;
    const value = rest.join("=");
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return "";
}

export function sessionCookies(key) {
  const maxAge = SESSION_DAYS * 86400;
  return [
    `${COOKIE}=${encodeURIComponent(key)}; Path=/api; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`,
    `${MARKER}=1; Path=/; Max-Age=${maxAge}; Secure; SameSite=Strict`,
  ];
}

export function clearCookies() {
  return [
    `${COOKIE}=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Strict`,
    `${MARKER}=; Path=/; Max-Age=0; Secure; SameSite=Strict`,
  ];
}
