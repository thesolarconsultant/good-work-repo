// =========================================================
// Access keys — entitlements without a database.
//
// Two kinds of key are honoured.
//
// Purchase keys are issued automatically once Stripe confirms a payment
// (api/claim.js, api/stripe-webhook.js). They look like
//
//   gw-<lib|stu>-<16 hex id>-<22-character signature>
//
// The id is derived from the Checkout Session, so claiming the same purchase
// twice gives the same key, never a second licence; the signature is
// HMAC-SHA256 under ACCESS_SIGNING_SECRET, so a key is checked without being
// stored anywhere. ACCESS_REVOKED lists ids no longer honoured (a refund, a
// leaked key). Changing ACCESS_SIGNING_SECRET withdraws every purchase key at
// once, so it is set once and left alone.
//
// Hand-issued keys are the ACCESS_KEYS environment variable: a comma-,
// semicolon- or newline-separated list of
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
//   - a key reaches the browser once, from api/claim.js, to the person whose
//     payment Stripe has just confirmed; otherwise the browser sends a key in
//     and the server answers yes or no;
//   - the session cookie is HttpOnly, Secure, SameSite=Strict and scoped to
//     /api, so page scripts never see it; a separate non-sensitive marker
//     cookie only tells the app whether it is worth asking the server;
//   - a key shorter than 16 characters is ignored, with a warning, rather
//     than accepted.
//
// Runs unchanged on Vercel's edge runtime and in Node (the test harness).
// =========================================================

export const PRODUCTS = new Set(["library", "studio"]);
const CODES = { library: "lib", studio: "stu" };
const FROM_CODE = { lib: "library", stu: "studio" };
const SIGNED = /^gw-(lib|stu)-([0-9a-f]{16})-([A-Za-z0-9_-]{22})$/;
const MIN_SECRET_LENGTH = 32;
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

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(text)));
}

const signature = async (secret, code, id) => b64url(await hmac(secret, `gw1:${code}:${id}`)).slice(0, 22);

/** Whether any kind of key can be honoured on this deployment. */
export const accessConfigured = () => Boolean(process.env.ACCESS_KEYS || process.env.ACCESS_SIGNING_SECRET);

/** Ids (purchase key ids or hand-issued key ids) that are no longer honoured. */
export function revokedIds(raw = process.env.ACCESS_REVOKED) {
  return new Set(
    String(raw || "")
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * The purchase key for a verified payment. Deterministic: the same purchase
 * always yields the same key.
 */
export async function issueKey(product, purchaseId, secret = process.env.ACCESS_SIGNING_SECRET) {
  if (!secret || secret.length < MIN_SECRET_LENGTH) throw new Error(`ACCESS_SIGNING_SECRET must be set to ${MIN_SECRET_LENGTH}+ random characters.`);
  const code = CODES[product];
  if (!code) throw new Error(`Unknown product "${product}".`);
  if (!purchaseId) throw new Error("A purchase id is required.");
  const id = hex(await sha256(`gw-purchase:${purchaseId}`)).slice(0, 16);
  return `gw-${code}-${id}-${await signature(secret, code, id)}`;
}

async function checkPurchaseKey(candidate, secret) {
  const m = SIGNED.exec(candidate);
  if (!m || !secret || secret.length < MIN_SECRET_LENGTH) return null;
  const [, code, id, sig] = m;
  if (!(await sameKey(await signature(secret, code, id), sig))) return null;
  return { product: FROM_CODE[code], id };
}

/**
 * authorise(candidate, raw, secret)
 *   -> { ok: false, reason: "unconfigured" | "missing" | "invalid" }
 *   -> { ok: true, keyId, label, product, products, source }
 *
 * A purchase key is checked by its signature. Otherwise every hand-issued key
 * is compared, whichever one matches, so the time taken does not say which
 * entry a candidate resembled.
 */
export async function authorise(candidate, raw = process.env.ACCESS_KEYS, secret = process.env.ACCESS_SIGNING_SECRET) {
  if (!raw && !secret) return { ok: false, reason: "unconfigured" };
  const key = typeof candidate === "string" ? candidate.trim() : "";
  if (!key) return { ok: false, reason: "missing" };
  const revoked = revokedIds();

  const purchase = await checkPurchaseKey(key, secret);
  if (purchase) {
    if (revoked.has(purchase.id)) return { ok: false, reason: "invalid" };
    return { ok: true, keyId: purchase.id, label: null, product: purchase.product, products: productsCovered(purchase.product), source: "purchase" };
  }

  let match = null;
  for (const entry of parseAccessKeys(raw)) {
    const same = await sameKey(entry.key, key);
    if (same && !match) match = entry;
  }
  if (!match) return { ok: false, reason: "invalid" };
  const keyId = hex(await sha256(match.key)).slice(0, 12);
  if (revoked.has(keyId)) return { ok: false, reason: "invalid" };
  return {
    ok: true,
    keyId,
    label: match.label,
    product: match.product,
    products: productsCovered(match.product),
    source: "access-key",
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
