// =========================================================
// Claim a purchase — the moment after Stripe Checkout.
//
//   POST /api/claim  { sessionId: "cs_…" }
//
// Stripe sends the customer to /welcome?session_id={CHECKOUT_SESSION_ID}, and
// that page posts the id here. The URL proves nothing on its own, so this
// asks Stripe for the session itself, and only a complete, paid session for
// Library or Studio, in pounds, at the listed price, earns a key.
//
// The key is a purchase key (server/accessKeys.js): signed rather than
// stored, and derived from the session, so claiming the same purchase again
// returns the same key instead of a second licence. A revoked purchase (a
// refund) is refused here as it is everywhere else.
//
// On success it sets the same HttpOnly session cookie as /api/access, so the
// customer is signed in, and returns the key in the body this once, because
// it is their licence and they need to keep it.
//
//   STRIPE_SECRET_KEY       to read the session from Stripe
//   ACCESS_SIGNING_SECRET   to sign the key (32+ random characters)
//
// Without both it answers 503, and the welcome page says the key will follow
// by email rather than pretending.
// =========================================================

import { issueKey, authorise, sessionCookies } from "../server/accessKeys.js";
import { PRODUCTS, CURRENCY } from "../server/products.js";

export const config = { runtime: "edge" };

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,240}$/;

function json(body, status = 200, cookies = []) {
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  for (const c of cookies) headers.append("Set-Cookie", c);
  return new Response(JSON.stringify(body), { status, headers });
}

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const signing = process.env.ACCESS_SIGNING_SECRET;
  if (!stripeKey || !signing) {
    return json({ ok: false, configured: false, error: "Automatic access isn't switched on yet. If you've paid, your access key follows by email within one working day." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Malformed request." }, 400);
  }
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.trim() : "";
  if (!SESSION_ID.test(sessionId)) return json({ ok: false, error: "That isn't a checkout reference we recognise." }, 400);

  let response;
  try {
    response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      headers: { Authorization: `Bearer ${stripeKey}`, "Stripe-Version": "2024-06-20" },
    });
  } catch (err) {
    console.error("claim: stripe unreachable:", err.message);
    return json({ ok: false, error: "We couldn't reach Stripe just now. Refresh in a moment: nothing is lost." }, 502);
  }
  if (response.status === 404) return json({ ok: false, error: "We couldn't find that purchase." }, 404);
  const session = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("claim: stripe answered", response.status, session?.error?.message || "");
    return json({ ok: false, error: "We couldn't confirm the purchase with Stripe just now. Refresh in a moment: nothing is lost." }, 502);
  }

  const productId = session.metadata?.product;
  const product = Object.hasOwn(PRODUCTS, productId) ? PRODUCTS[productId] : null;
  if (!product) return json({ ok: false, error: "That checkout isn't a Library or Studio purchase." }, 400);

  // Bank payments can complete later than the redirect. Say so, don't guess.
  if (session.status !== "complete" || session.payment_status !== "paid") {
    return json({ ok: false, pending: true, error: "Your payment hasn't been confirmed yet. Some payment methods take a little longer; refresh this page shortly." }, 409);
  }
  if (session.currency !== CURRENCY || session.amount_subtotal !== product.amount) {
    console.error("claim: paid session does not match the listed price", session.id, session.currency, session.amount_subtotal);
    return json({ ok: false, error: "That purchase doesn't match the listed price, so access wasn't issued automatically. We'll sort it by email." }, 400);
  }

  const key = await issueKey(productId, session.id, signing);
  const auth = await authorise(key);
  if (!auth.ok) return json({ ok: false, error: "Access for this purchase has been withdrawn, usually after a refund. Email us if that's unexpected." }, 403);

  console.log(JSON.stringify({ event: "access.claimed", keyId: auth.keyId, product: productId, at: new Date().toISOString() }));
  return json(
    {
      ok: true,
      key,
      product: productId,
      products: auth.products,
      email: session.customer_details?.email || "",
      name: session.customer_details?.name || "",
    },
    200,
    sessionCookies(key),
  );
}
