// =========================================================
// Direct purchase — Stripe Checkout Session
//
// The browser posts { product: "library" | "studio", path } and, when Stripe
// is configured, receives { url } for a hosted Checkout Session. The browser
// never sees a secret and never decides a price: the product map below is the
// only place a Stripe Price is named, and the amounts are validated against
// src/data/offers.js by scripts/check-prices.mjs at build time.
//
//   STRIPE_SECRET_KEY     Required. sk_live_… or sk_test_….
//   STRIPE_PRICE_LIBRARY  Required. The Stripe Price id for the £280 product.
//   STRIPE_PRICE_STUDIO   Required. The Stripe Price id for the £888 product.
//   SITE_URL              Where Stripe sends the customer back. Falls back to
//                         the request origin.
//
// Without STRIPE_SECRET_KEY and the price ids this returns 503 and the
// button says checkout isn't switched on yet. Nothing is simulated.
//
// Raw fetch against Stripe's REST API rather than the SDK: the other
// functions in this folder are plain fetch on the edge runtime, and Checkout
// Session creation is one form-encoded POST.
//
// Fulfilment does NOT happen here. A successful redirect back to /thank-you
// proves nothing; the signed webhook in api/stripe-webhook.js is the only
// event that may create an entitlement. See docs/BACKEND.md.
// =========================================================

const PRODUCTS = {
  library: { name: "Goodwork Library", amount: 28000, envPrice: "STRIPE_PRICE_LIBRARY" },
  studio: { name: "Goodwork Studio", amount: 88800, envPrice: "STRIPE_PRICE_STUDIO" },
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

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

  const product = PRODUCTS[body?.product];
  if (!product) return json({ error: "Unknown product." }, 400);
  const price = process.env[product.envPrice];
  if (!price) return json({ error: `Checkout for ${product.name} isn't configured yet.` }, 503);

  const origin = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  const returnPath = typeof body.path === "string" && body.path.startsWith("/") ? body.path.split("?")[0] : "/pricing";

  const params = new URLSearchParams();
  params.set("mode", "payment");
  params.set("success_url", `${origin}/login?purchase=${body.product}&session_id={CHECKOUT_SESSION_ID}`);
  params.set("cancel_url", `${origin}${returnPath}#access`);
  params.set("line_items[0][price]", price);
  params.set("line_items[0][quantity]", "1");
  params.set("currency", "gbp");
  params.set("allow_promotion_codes", "false");
  params.set("billing_address_collection", "required");
  params.set("customer_creation", "always");
  params.set("metadata[product]", body.product);
  params.set("metadata[site]", origin);
  // The licence and the immediate-access acknowledgement are shown before this
  // point on the site; Stripe's consent collection records the terms tick too.
  params.set("consent_collection[terms_of_service]", "required");
  params.set("custom_text[terms_of_service_acceptance][message]", `I have read the Goodwork commercial licence and refund policy, and I understand access to ${product.name} starts immediately.`);

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2024-06-20",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: params.toString(),
  });

  const session = await response.json().catch(() => ({}));
  if (!response.ok || !session.url) {
    console.error("stripe checkout session failed:", session?.error?.message || response.status);
    return json({ error: "Checkout could not be started. Nothing has been charged." }, 502);
  }
  return json({ url: session.url, id: session.id });
}
