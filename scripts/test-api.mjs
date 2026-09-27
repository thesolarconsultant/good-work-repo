// Exercises the edge functions in api/ without deploying them: each handler is
// a Web-standard Request -> Response function, so Node can call it directly.
//
//   npm run test:api
//
// Covers: enquiry validation and delivery to a local webhook, the honeypot,
// the unconfigured 503s, checkout's product guard, and the Stripe webhook's
// signature verification with a payload signed here using the same scheme.

import { createServer } from "node:http";
import assert from "node:assert/strict";

let received = [];
const sink = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    received.push({ headers: req.headers, body: JSON.parse(body || "{}") });
    res.writeHead(200);
    res.end("ok");
  });
});
await new Promise((r) => sink.listen(0, r));
const sinkUrl = `http://127.0.0.1:${sink.address().port}/hook`;

const post = (body, headers = {}) =>
  new Request("http://localhost/api/x", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    console.log(`✗ ${name}\n    ${e.message}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------- enquiry --
const enquiry = (await import("../api/enquiry.js")).default;

await test("enquiry: 503 when no delivery route is configured", async () => {
  delete process.env.ENQUIRY_WEBHOOK_URL;
  delete process.env.RESEND_API_KEY;
  const r = await enquiry(post({ form: "contact", fields: { name: "A", email: "a@b.co", topic: "other", message: "hi" } }));
  assert.equal(r.status, 503);
});

process.env.ENQUIRY_WEBHOOK_URL = sinkUrl;
process.env.ENQUIRY_WEBHOOK_TOKEN = "t0k";

await test("enquiry: rejects an unknown form", async () => {
  const r = await enquiry(post({ form: "nope", fields: {} }));
  assert.equal(r.status, 400);
});

await test("enquiry: enforces required fields server-side", async () => {
  const r = await enquiry(post({ form: "built", fields: { name: "A", email: "a@b.co" } }));
  assert.equal(r.status, 400);
  const j = await r.json();
  assert.match(j.error, /required/);
});

await test("enquiry: enforces the confirmation checkbox", async () => {
  const fields = { name: "A", business: "B", email: "a@b.co", phone: "07000 000000", sells: "x", brandStatus: "settled", launch: "asap", contactMethod: "email", budgetConfirmed: false };
  const r = await enquiry(post({ form: "built", fields }));
  assert.equal(r.status, 400);
});

await test("enquiry: delivers a valid Built enquiry to the webhook, flat payload with tags", async () => {
  received = [];
  const fields = { name: "Ada Lovelace", business: "Analytical Ltd", email: "ada@example.com", phone: "+44 7000 000000", sells: "Engines", brandStatus: "settled", launch: "asap", contactMethod: "email", budgetConfirmed: true, pages: ["home", "pricing"] };
  const r = await enquiry(post({ form: "built", fields, text: "NEW BUILT BY GOODWORK ENQUIRY", page: "/built-by-goodwork" }));
  assert.equal(r.status, 200);
  assert.equal(received.length, 1);
  const p = received[0].body;
  assert.equal(p.form, "built");
  assert.equal(p.firstName, "Ada");
  assert.equal(p.lastName, "Lovelace");
  assert.equal(p.companyName, "Analytical Ltd");
  assert.deepEqual(p.fields.pages, ["home", "pricing"]);
  assert.ok(p.tags.includes("form:built"));
  assert.equal(received[0].headers.authorization, "Bearer t0k");
});

await test("enquiry: a filled honeypot is swallowed silently", async () => {
  received = [];
  const r = await enquiry(post({ form: "access", fields: { email: "bot@example.com", product: "library", website_url: "http://spam" } }));
  assert.equal(r.status, 200);
  assert.equal(received.length, 0);
});

await test("enquiry: rejects a malformed email", async () => {
  const r = await enquiry(post({ form: "access", fields: { email: "not-an-email", product: "library" } }));
  assert.equal(r.status, 400);
});

// --------------------------------------------------------------- checkout --
const checkout = (await import("../api/checkout.js")).default;

await test("checkout: 503 without STRIPE_SECRET_KEY", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const r = await checkout(post({ product: "library" }));
  assert.equal(r.status, 503);
});

await test("checkout: unknown product is rejected before any Stripe call", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  const r = await checkout(post({ product: "yacht" }));
  assert.equal(r.status, 400);
});

await test("checkout: 503 when the product's price id is missing", async () => {
  delete process.env.STRIPE_PRICE_STUDIO;
  const r = await checkout(post({ product: "studio" }));
  assert.equal(r.status, 503);
});
delete process.env.STRIPE_SECRET_KEY;

// --------------------------------------------------------- stripe webhook --
const { default: webhook, verifyStripeSignature } = await import("../api/stripe-webhook.js");

async function sign(body, secret, t = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = [...new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${body}`)))].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `t=${t},v1=${sig}`;
}

const SECRET = "whsec_test_secret";
const event = JSON.stringify({
  id: "evt_1",
  type: "checkout.session.completed",
  created: Math.floor(Date.now() / 1000),
  data: { object: { id: "cs_1", payment_status: "paid", metadata: { product: "studio" }, customer: "cus_1", payment_intent: "pi_1", amount_total: 88800, currency: "gbp", customer_details: { email: "buyer@example.com", name: "Buyer" }, consent: { terms_of_service: "accepted" } } },
});

await test("webhook: a correctly signed payload verifies", async () => {
  assert.equal(await verifyStripeSignature(event, await sign(event, SECRET), SECRET), true);
});
await test("webhook: a tampered body fails verification", async () => {
  assert.equal(await verifyStripeSignature(event.replace("88800", "1"), await sign(event, SECRET), SECRET), false);
});
await test("webhook: a stale timestamp fails verification", async () => {
  assert.equal(await verifyStripeSignature(event, await sign(event, SECRET, Math.floor(Date.now() / 1000) - 3600), SECRET), false);
});
await test("webhook: 503 without STRIPE_WEBHOOK_SECRET", async () => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
  const r = await webhook(post(event, { "stripe-signature": await sign(event, SECRET) }));
  assert.equal(r.status, 503);
});
await test("webhook: bad signature is rejected with 400", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
  const r = await webhook(post(event, { "stripe-signature": await sign(event, "wrong") }));
  assert.equal(r.status, 400);
});
await test("webhook: a paid session emits entitlement.granted to the entitlement webhook", async () => {
  received = [];
  process.env.ENTITLEMENT_WEBHOOK_URL = sinkUrl;
  const r = await webhook(post(event, { "stripe-signature": await sign(event, SECRET) }));
  assert.equal(r.status, 200);
  assert.equal(received.length, 1);
  const p = received[0].body;
  assert.equal(p.type, "entitlement.granted");
  assert.equal(p.productId, "studio");
  assert.equal(p.email, "buyer@example.com");
  assert.equal(p.amountTotal, 88800);
  assert.equal(p.termsAccepted, true);
  assert.equal(p.eventId, "evt_1");
});
await test("webhook: an unpaid session is acknowledged and ignored", async () => {
  received = [];
  const unpaid = event.replace('"payment_status":"paid"', '"payment_status":"unpaid"');
  const r = await webhook(post(unpaid, { "stripe-signature": await sign(unpaid, SECRET) }));
  assert.equal(r.status, 200);
  assert.equal(received.length, 0);
});

sink.close();
console.log(`\n${passed} passed${process.exitCode ? ", with failures" : ""}`);
