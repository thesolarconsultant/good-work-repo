// =========================================================
// Direct purchase — Stripe Checkout Session
//
// The browser posts { product: "library" | "studio", path } and, when Stripe
// is configured, receives { url } for a hosted Checkout Session. The browser
// never sees a secret and never decides a price: server/products.js is the
// only place an amount is named for checkout, and scripts/check-prices.mjs
// fails the build if it disagrees with src/data/offers.js.
//
//   STRIPE_SECRET_KEY     Required. sk_live_… or sk_test_….
//   STRIPE_PRICE_LIBRARY  Optional. A Stripe Price id to use for the £280
//   STRIPE_PRICE_STUDIO   and £888 products. Without them, checkout finds
//                         the price by its lookup key (goodwork_library_gbp_
//                         28000 and so on) and creates it the first time, so
//                         nothing has to be set up in the Stripe catalogue.
//                         Change a price in the data and a new lookup key,
//                         and so a new Stripe price, follows on its own.
//   SITE_URL              Where Stripe sends the customer back. Falls back to
//                         the request origin.
//
// Without STRIPE_SECRET_KEY this returns 503 and the button says checkout
// isn't switched on yet. Nothing is simulated.
//
// Raw fetch against Stripe's REST API rather than the SDK: the other
// functions in this folder are plain fetch on the edge runtime.
//
// No tax is added: Goodwork doesn't charge VAT, so automatic_tax stays off and
// the price is the whole amount.
//
// Access is NOT granted here. Stripe returns the customer to
// /welcome?session_id=…, and api/claim.js asks Stripe whether that session is
// actually paid before issuing a key. See docs/BACKEND.md.
// =========================================================

import { PRODUCTS, CURRENCY, lookupKey } from "../server/products.js";

const STRIPE_VERSION = "2024-06-20";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function stripe(path, secret, { method = "GET", params, idempotencyKey } = {}) {
  const headers = { Authorization: `Bearer ${secret}`, "Stripe-Version": STRIPE_VERSION };
  if (params) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const response = await fetch(`https://api.stripe.com/v1/${path}`, { method, headers, body: params ? params.toString() : undefined });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error?.message || `Stripe ${method} ${path.split("?")[0]} answered ${response.status}`);
  return body;
}

// Price ids found or created, per isolate, so a warm function asks once.
const prices = new Map();

/** The Stripe Price to charge: the configured id, else found by lookup key, else created once. */
async function priceFor(id, secret) {
  const override = process.env[PRODUCTS[id].envPrice];
  if (override) return override;
  const lookup = lookupKey(id);
  if (prices.has(lookup)) return prices.get(lookup);

  const query = new URLSearchParams({ active: "true", limit: "1", "lookup_keys[]": lookup });
  const found = await stripe(`prices?${query}`, secret);
  let price = found?.data?.[0]?.id;
  if (!price) {
    const product = PRODUCTS[id];
    const params = new URLSearchParams({
      currency: CURRENCY,
      unit_amount: String(product.amount),
      lookup_key: lookup,
      "product_data[name]": product.name,
      "product_data[metadata][goodwork_product]": id,
      "metadata[goodwork_product]": id,
    });
    // Two first purchases at once must not make two prices: the same
    // idempotency key returns the first one's result to the second.
    const made = await stripe("prices", secret, { method: "POST", params, idempotencyKey: `goodwork-price-${lookup}` });
    price = made.id;
  }
  prices.set(lookup, price);
  return price;
}

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS" } });
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return json({ error: "Online checkout isn't switched on for this deployment yet." }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const id = body?.product;
  const product = Object.hasOwn(PRODUCTS, id) ? PRODUCTS[id] : null;
  if (!product) return json({ error: "Unknown product." }, 400);

  const origin = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const returnPath = typeof body.path === "string" && body.path.startsWith("/") ? body.path.split("?")[0] : "/pricing";

  try {
    const price = await priceFor(id, secret);
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", `${origin}/welcome?session_id={CHECKOUT_SESSION_ID}`);
    params.set("cancel_url", `${origin}${returnPath}#access`);
    params.set("line_items[0][price]", price);
    params.set("line_items[0][quantity]", "1");
    params.set("allow_promotion_codes", "false");
    params.set("billing_address_collection", "required");
    params.set("customer_creation", "always");
    params.set("metadata[product]", id);
    params.set("metadata[site]", origin);
    params.set("payment_intent_data[metadata][product]", id);
    // The licence and the immediate-access acknowledgement are shown before this
    // point on the site; Stripe's consent collection records the tick on the
    // session. The wording is the one the refund policy promises. Stripe only
    // allows this once a terms URL is set in its public business details.
    params.set("consent_collection[terms_of_service]", "required");
    params.set(
      "custom_text[terms_of_service_acceptance][message]",
      `I agree to the Goodwork [commercial licence](${origin}/legal/licence) and [refund policy](${origin}/legal/refunds). I want access to ${product.name} to start immediately, and I understand that I lose my right to cancel once it does.`,
    );

    const session = await stripe("checkout/sessions", secret, { method: "POST", params, idempotencyKey: crypto.randomUUID() });
    if (!session.url) throw new Error("Stripe returned no checkout URL.");
    return json({ url: session.url, id: session.id });
  } catch (err) {
    console.error("stripe checkout failed:", err.message);
    return json({ error: "Checkout could not be started. Nothing has been charged." }, 502);
  }
}
