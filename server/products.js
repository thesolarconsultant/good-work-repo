// =========================================================
// The products sold through online checkout, in one place on the server.
//
// api/checkout.js charges these amounts, api/claim.js checks a paid session
// against them before issuing access, and scripts/check-prices.mjs fails the
// build if they ever disagree with src/data/offers.js. Amounts are in pence.
//
// `envPrice` names an optional environment variable holding a Stripe Price id
// to use instead; without it, checkout finds or creates the price itself (by
// the lookup key below), so nothing has to be set up in the Stripe catalogue.
// =========================================================

export const PRODUCTS = {
  library: { name: "Goodwork Library", amount: 28000, envPrice: "STRIPE_PRICE_LIBRARY" },
  studio: { name: "Goodwork Studio", amount: 88800, envPrice: "STRIPE_PRICE_STUDIO" },
};

export const CURRENCY = "gbp";

/** The Stripe lookup key for a product at its current price. A new price gets a new key. */
export const lookupKey = (id) => `goodwork_${id}_${CURRENCY}_${PRODUCTS[id].amount}`;
