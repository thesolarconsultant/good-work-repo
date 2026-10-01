// Exercises the edge functions in api/ without deploying them: each handler is
// a Web-standard Request -> Response function, so Node can call it directly.
//
//   npm run test:api
//
// Covers: enquiry validation and delivery to a local webhook, the honeypot,
// the unconfigured 503s, checkout (its product guard, and finding or creating
// the Stripe price against a stubbed Stripe), the Stripe webhook's signature
// verification with a payload signed here using the same scheme, the key
// email to the buyer, claiming a paid purchase for a signed key, access-key
// sign-in (cookies, coverage, revocation, sign-out) and the licensed download
// (refusals, and a zip that the system tools accept).

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

await test("forms: the browser's schemas and the server's rules agree, and every field has a step", async () => {
  const { FORM_SPECS } = await import("../api/enquiry.js");
  const { FORMS } = await import("../src/data/forms.js");
  for (const [id, spec] of Object.entries(FORM_SPECS)) {
    const form = FORMS[id];
    assert.ok(form, `${id}: no schema in src/data/forms.js`);
    const required = form.fields.filter((f) => f.required && f.type !== "checkbox").map((f) => f.name).sort();
    assert.deepEqual(required, [...spec.required].sort(), `${id}: required fields differ between browser and server`);
    assert.equal(form.fields.find((f) => f.type === "checkbox" && f.required)?.name, spec.confirm, `${id}: confirmation field differs`);
    if (form.steps) {
      const placed = form.steps.flatMap((s) => s.fields).sort();
      assert.deepEqual(placed, form.fields.map((f) => f.name).sort(), `${id}: the steps must hold every field exactly once`);
    }
  }
});

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

// Stripe is stubbed: requests to api.stripe.com are answered by `stripeRoutes`
// and recorded in `stripeCalls`. Resend is stubbed too: each email is recorded
// in `resendCalls` and accepted. Everything else (the local webhook sink) goes
// to the network as usual.
const realFetch = globalThis.fetch;
let stripeCalls = [];
let stripeRoutes = () => null;
let resendCalls = [];
globalThis.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input.url;
  if (url.startsWith("https://api.resend.com/")) {
    resendCalls.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "email_test" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (!url.startsWith("https://api.stripe.com/")) return realFetch(input, init);
  const call = { url, method: init.method || "GET", body: init.body ? new URLSearchParams(init.body) : null, headers: init.headers || {} };
  stripeCalls.push(call);
  const answer = stripeRoutes(call);
  if (!answer) return new Response(JSON.stringify({ error: { message: `unexpected Stripe call ${call.method} ${url}` } }), { status: 500 });
  return new Response(JSON.stringify(answer.body), { status: answer.status || 200, headers: { "Content-Type": "application/json" } });
};
const stripePath = (c) => c.url.replace("https://api.stripe.com/v1/", "").split("?")[0];

await test("checkout: 503 without STRIPE_SECRET_KEY", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  const r = await checkout(post({ product: "library" }));
  assert.equal(r.status, 503);
});

await test("checkout: an unknown product, or an inherited name like toString, is rejected before any Stripe call", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  stripeCalls = [];
  for (const product of ["yacht", "toString", "__proto__"]) assert.equal((await checkout(post({ product }))).status, 400, product);
  assert.equal(stripeCalls.length, 0);
});

await test("checkout: with no price configured it finds the price by lookup key, creates it once, then reuses it", async () => {
  delete process.env.STRIPE_PRICE_STUDIO;
  stripeCalls = [];
  stripeRoutes = ({ url, method }) => {
    if (method === "GET" && url.includes("/v1/prices")) return { body: { data: [] } };
    if (method === "POST" && url.endsWith("/v1/prices")) return { body: { id: "price_studio_new" } };
    if (method === "POST" && url.endsWith("/v1/checkout/sessions")) return { body: { id: "cs_test_abc", url: "https://checkout.stripe.com/c/pay/cs_test_abc" } };
    return null;
  };
  const r = await checkout(post({ product: "studio", path: "/studio" }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).url, "https://checkout.stripe.com/c/pay/cs_test_abc");
  assert.deepEqual(stripeCalls.map(stripePath), ["prices", "prices", "checkout/sessions"]);
  assert.match(decodeURIComponent(stripeCalls[0].url), /lookup_keys\[\]=goodwork_studio_gbp_88800/);
  const created = stripeCalls[1];
  assert.equal(created.body.get("unit_amount"), "88800");
  assert.equal(created.body.get("currency"), "gbp");
  assert.equal(created.body.get("lookup_key"), "goodwork_studio_gbp_88800");
  assert.equal(created.body.get("product_data[name]"), "Goodwork Studio");
  assert.equal(created.headers["Idempotency-Key"], "goodwork-price-goodwork_studio_gbp_88800");
  const session = stripeCalls[2].body;
  assert.equal(session.get("line_items[0][price]"), "price_studio_new");
  assert.equal(session.get("metadata[product]"), "studio");
  assert.match(session.get("success_url"), /\/welcome\?session_id=\{CHECKOUT_SESSION_ID\}$/);
  assert.match(session.get("cancel_url"), /\/studio#access$/);
  assert.equal(session.get("consent_collection[terms_of_service]"), "required");
  assert.match(session.get("custom_text[terms_of_service_acceptance][message]"), /\[refund policy\]\(\S+\/legal\/refunds\).*lose my right to cancel/);
  stripeCalls = [];
  assert.equal((await checkout(post({ product: "studio" }))).status, 200);
  assert.deepEqual(stripeCalls.map(stripePath), ["checkout/sessions"], "a warm function doesn't look the price up again");
});

await test("checkout: an existing price is found and used; a configured price id skips the lookup", async () => {
  stripeCalls = [];
  stripeRoutes = ({ url, method }) => {
    if (method === "GET" && url.includes("/v1/prices")) return { body: { data: [{ id: "price_library_existing" }] } };
    if (method === "POST" && url.endsWith("/v1/checkout/sessions")) return { body: { id: "cs_test_lib", url: "https://checkout.stripe.com/c/pay/cs_test_lib" } };
    return null;
  };
  process.env.STRIPE_PRICE_LIBRARY = "price_from_env";
  assert.equal((await checkout(post({ product: "library" }))).status, 200);
  assert.deepEqual(stripeCalls.map(stripePath), ["checkout/sessions"]);
  assert.equal(stripeCalls[0].body.get("line_items[0][price]"), "price_from_env");
  delete process.env.STRIPE_PRICE_LIBRARY;
  stripeCalls = [];
  assert.equal((await checkout(post({ product: "library" }))).status, 200);
  assert.deepEqual(stripeCalls.map(stripePath), ["prices", "checkout/sessions"]);
  assert.equal(stripeCalls[1].body.get("line_items[0][price]"), "price_library_existing");
});

await test("checkout: a Stripe error is a 502 that says nothing was charged", async () => {
  stripeRoutes = () => ({ status: 400, body: { error: { message: "You must set a terms of service URL" } } });
  const r = await checkout(post({ product: "library" }));
  assert.equal(r.status, 502);
  assert.match((await r.json()).error, /Nothing has been charged/);
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
await test("webhook: a paid session for something else on the account (a service payment link) is acknowledged and ignored", async () => {
  received = [];
  const service = event.replace('"metadata":{"product":"studio"}', '"metadata":{}');
  const r = await webhook(post(service, { "stripe-signature": await sign(service, SECRET) }));
  assert.equal(r.status, 200);
  assert.equal(received.length, 0);
});
await test("webhook: with ACCESS_SIGNING_SECRET set, the event carries the same key the customer claims", async () => {
  received = [];
  process.env.ACCESS_SIGNING_SECRET = "test-signing-secret-0123456789-abcdefghij";
  const r = await webhook(post(event, { "stripe-signature": await sign(event, SECRET) }));
  assert.equal(r.status, 200);
  const { issueKey } = await import("../server/accessKeys.js");
  const expected = await issueKey("studio", "cs_1");
  assert.equal(received[0].body.accessKey, expected);
  assert.equal(received[0].body.accessKeyId, expected.split("-")[2]);
  delete process.env.ACCESS_SIGNING_SECRET;
});
await test("webhook: a bank payment that clears later is granted on async_payment_succeeded; a failed one is ignored", async () => {
  received = [];
  const later = event.replace('"type":"checkout.session.completed"', '"type":"checkout.session.async_payment_succeeded"');
  const r = await webhook(post(later, { "stripe-signature": await sign(later, SECRET) }));
  assert.equal(r.status, 200);
  assert.equal(received.length, 1);
  assert.equal(received[0].body.productId, "studio");
  received = [];
  const failed = event.replace('"type":"checkout.session.completed"', '"type":"checkout.session.async_payment_failed"').replace('"payment_status":"paid"', '"payment_status":"unpaid"');
  const f = await webhook(post(failed, { "stripe-signature": await sign(failed, SECRET) }));
  assert.equal(f.status, 200);
  assert.equal(received.length, 0);
});
await test("webhook: with Resend set up, the customer is emailed their key and the owner is told", async () => {
  received = [];
  resendCalls = [];
  process.env.ACCESS_SIGNING_SECRET = "test-signing-secret-0123456789-abcdefghij";
  process.env.RESEND_API_KEY = "re_test_placeholder";
  process.env.ACCESS_EMAIL_FROM = "Goodwork <access@example.com>";
  process.env.ENQUIRY_TO = "owner@example.com";
  process.env.ENQUIRY_FROM = "enquiries@example.com";
  const r = await webhook(post(event, { "stripe-signature": await sign(event, SECRET) }));
  assert.equal(r.status, 200);
  assert.equal((await r.json()).customer, "sent");
  const { issueKey } = await import("../server/accessKeys.js");
  const key = await issueKey("studio", "cs_1");
  const toCustomer = resendCalls.find((m) => m.to.includes("buyer@example.com"));
  assert.ok(toCustomer, "no email to the customer");
  assert.equal(toCustomer.from, "Goodwork <access@example.com>");
  assert.equal(toCustomer.reply_to, "owner@example.com");
  assert.ok(toCustomer.text.includes(key), "the customer's email doesn't carry their key");
  assert.match(toCustomer.text, /Sign in: http:\/\/localhost\/login/, "without SITE_URL the links use the address Stripe called");
  assert.ok(resendCalls.some((m) => m.to.includes("owner@example.com")), "no paid notification to the owner");
  for (const name of ["ACCESS_SIGNING_SECRET", "RESEND_API_KEY", "ACCESS_EMAIL_FROM", "ENQUIRY_TO", "ENQUIRY_FROM"]) delete process.env[name];
});

// ----------------------------------------------------------------- access --
const access = (await import("../api/access.js")).default;
const download = (await import("../api/download.js")).default;
const { default: ITEMS } = await import("../server/generated/libraryItems.js");
const get = (url, headers = {}) => new Request(`http://localhost${url}`, { headers });
const del = (url) => new Request(`http://localhost${url}`, { method: "DELETE" });
const cookiesOf = (r) => (r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")].filter(Boolean));
const LIB_KEY = "test_library_key_0123456789";
const STUDIO_KEY = "test_studio_key_0123456789";

await test("access: 503 until ACCESS_KEYS or ACCESS_SIGNING_SECRET is set, for sign-in and download alike", async () => {
  delete process.env.ACCESS_KEYS;
  delete process.env.ACCESS_SIGNING_SECRET;
  assert.equal((await access(get("/api/access"))).status, 503);
  assert.equal((await access(post({ key: LIB_KEY }))).status, 503);
  assert.equal((await download(get("/api/download?product=library", { authorization: `Bearer ${LIB_KEY}` }))).status, 503);
});

// The third entry is deliberately malformed: it must be ignored, not accepted.
process.env.ACCESS_KEYS = `library:${LIB_KEY}, studio:${STUDIO_KEY}:ada@example.com, library:tooshort`;

await test("access: a wrong key is refused with 401 and no cookie", async () => {
  const r = await access(post({ key: "not-a-real-key-at-all" }));
  assert.equal(r.status, 401);
  assert.equal(cookiesOf(r).length, 0);
  const j = await r.json();
  assert.equal(j.ok, false);
  assert.equal(j.configured, true);
});

await test("access: an empty or malformed body is 400; the short configured key is not accepted", async () => {
  assert.equal((await access(post({}))).status, 400);
  assert.equal((await access(post("{nope"))).status, 400);
  assert.equal((await access(post({ key: "tooshort" }))).status, 401);
});

await test("access: a Library key signs in with an HttpOnly cookie scoped to /api, and covers the Library only", async () => {
  const r = await access(post({ key: LIB_KEY }));
  assert.equal(r.status, 200);
  const cookies = cookiesOf(r);
  const session = cookies.find((c) => c.startsWith("gw_access="));
  assert.ok(session, "session cookie set");
  assert.match(session, /HttpOnly/);
  assert.match(session, /Secure/);
  assert.match(session, /SameSite=Strict/);
  assert.match(session, /Path=\/api/);
  assert.ok(cookies.some((c) => c.startsWith("gw_signed_in=1")), "marker cookie set");
  const j = await r.json();
  assert.deepEqual(j.entitlements.map((e) => e.productId), ["library"]);
  assert.equal(j.downloads.length, 1);
  assert.equal(j.downloads[0].href, "/api/download?product=library");
  assert.equal(j.downloads[0].items, ITEMS.length);
  assert.ok(!JSON.stringify(j).includes(LIB_KEY), "the key never comes back");
});

await test("access: a Studio key (whitespace tolerated) covers the Library too and carries its label", async () => {
  const r = await access(post({ key: `  ${STUDIO_KEY}  ` }));
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.deepEqual(j.entitlements.map((e) => e.productId), ["studio", "library"]);
  assert.equal(j.user.name, "ada@example.com");
  assert.equal(j.pending.length, 1);
});

await test("access: GET reads the cookie, a revoked cookie is cleared, DELETE signs out", async () => {
  const ok = await access(get("/api/access", { cookie: `gw_signed_in=1; gw_access=${LIB_KEY}` }));
  assert.equal(ok.status, 200);
  assert.equal((await access(get("/api/access"))).status, 401);
  const stale = await access(get("/api/access", { cookie: "gw_access=revoked_key_0123456789" }));
  assert.equal(stale.status, 401);
  assert.ok(cookiesOf(stale).some((c) => /^gw_access=;.*Max-Age=0/.test(c)), "stale cookie cleared");
  const out = await access(del("/api/access"));
  assert.equal(out.status, 200);
  assert.equal(cookiesOf(out).length, 2);
  assert.ok(cookiesOf(out).every((c) => /Max-Age=0/.test(c)));
});

await test("download: refused without a key, with a wrong key, for a product with no bundle, and for anything but GET", async () => {
  assert.equal((await download(get("/api/download?product=library"))).status, 401);
  assert.equal((await download(get("/api/download?product=library", { cookie: "gw_access=wrong_key_0123456789" }))).status, 401);
  assert.equal((await download(get("/api/download?product=studio", { authorization: `Bearer ${STUDIO_KEY}` }))).status, 404);
  assert.equal((await download(get("/api/download?product=yacht", { authorization: `Bearer ${LIB_KEY}` }))).status, 404);
  assert.equal((await download(post({}))).status, 405);
});

await test("download: a signed-in request receives a valid zip with every component, README, licence, gallery and index", async () => {
  const r = await download(get("/api/download?product=library", { cookie: `gw_access=${LIB_KEY}` }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/zip");
  assert.match(r.headers.get("content-disposition"), /^attachment; filename="goodwork-library-[\d.]+\.zip"$/);
  const buf = Buffer.from(await r.arrayBuffer());
  assert.equal(Number(r.headers.get("content-length")), buf.length);
  assert.equal(buf.readUInt32LE(0), 0x04034b50, "local file header signature");
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(eocd > 0, "end of central directory present");
  assert.equal(buf.readUInt16LE(eocd + 10), ITEMS.length + 4, "one file per component plus README, LICENCE, index.html and components.json");
  const names = buf.toString("latin1");
  for (const it of ITEMS) assert.ok(names.includes(`/snippets/${it.category}/${it.id}.html`), `${it.id} in archive`);
  for (const f of ["/README.md", "/LICENCE.md", "/index.html", "/components.json"]) assert.ok(names.includes(f), `${f} in archive`);
  // The system tools, where present, validate the archive end to end.
  const { spawnSync } = await import("node:child_process");
  const { writeFileSync, mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const file = join(mkdtempSync(join(tmpdir(), "gw-zip-")), "bundle.zip");
  writeFileSync(file, buf);
  const py = spawnSync("python3", ["-c", "import sys,zipfile; z=zipfile.ZipFile(sys.argv[1]); bad=z.testzip(); sys.exit(1 if bad else 0)", file], { encoding: "utf8" });
  if (!py.error && py.status !== 0) assert.fail(`python's zipfile rejected the archive: ${py.stderr}`);
  const uz = spawnSync("unzip", ["-tq", file], { encoding: "utf8" });
  if (!uz.error && uz.status !== 0) assert.fail(`unzip rejected the archive: ${uz.stdout} ${uz.stderr}`);
});

await test("download: a Bearer token works for command-line use", async () => {
  const r = await download(get("/api/download", { authorization: `Bearer ${STUDIO_KEY}` }));
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
});

// ------------------------------------------------------------------ claim --
const claim = (await import("../api/claim.js")).default;
const SIGNING = "test-signing-secret-0123456789-abcdefghij";
const paidSession = (over = {}) => ({
  id: "cs_test_paid0000000001",
  status: "complete",
  payment_status: "paid",
  currency: "gbp",
  amount_subtotal: 28000,
  amount_total: 28000,
  metadata: { product: "library" },
  customer_details: { email: "buyer@example.com", name: "Jo Buyer" },
  ...over,
});
const serve = (session) => {
  stripeRoutes = ({ url, method }) => (method === "GET" && url.endsWith(`/checkout/sessions/${session.id}`) ? { body: session } : null);
};

await test("claim: 503 until both STRIPE_SECRET_KEY and ACCESS_SIGNING_SECRET are set", async () => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.ACCESS_SIGNING_SECRET;
  assert.equal((await claim(post({ sessionId: "cs_test_paid0000000001" }))).status, 503);
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  assert.equal((await claim(post({ sessionId: "cs_test_paid0000000001" }))).status, 503);
});
process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
process.env.ACCESS_SIGNING_SECRET = SIGNING;

await test("claim: a malformed reference is refused before asking Stripe", async () => {
  stripeCalls = [];
  for (const sessionId of ["", "pi_3Abc", "cs_live_../../v1/customers", "cs_test_short", 42]) assert.equal((await claim(post({ sessionId }))).status, 400, String(sessionId));
  assert.equal((await claim(post("{nope"))).status, 400);
  assert.equal(stripeCalls.length, 0);
});

await test("claim: a paid Library session issues a purchase key and signs in; the same purchase gives the same key", async () => {
  const session = paidSession();
  serve(session);
  const r = await claim(post({ sessionId: session.id }));
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.match(j.key, /^gw-lib-[0-9a-f]{16}-[A-Za-z0-9_-]{22}$/);
  assert.deepEqual(j.products, ["library"]);
  assert.equal(j.email, "buyer@example.com");
  assert.ok(cookiesOf(r).some((c) => c.startsWith("gw_access=") && /HttpOnly/.test(c) && /Path=\/api/.test(c)), "session cookie set");
  assert.equal((await (await claim(post({ sessionId: session.id }))).json()).key, j.key);
  // A purchase key needs no ACCESS_KEYS list at all.
  delete process.env.ACCESS_KEYS;
  const signin = await access(post({ key: j.key }));
  assert.equal(signin.status, 200);
  const body = await signin.json();
  assert.deepEqual(body.entitlements.map((e) => e.productId), ["library"]);
  assert.equal(body.entitlements[0].source, "purchase");
  assert.equal((await download(get("/api/download?product=library", { authorization: `Bearer ${j.key}` }))).status, 200);
});

await test("claim: a Studio purchase covers the Library; a tampered key is refused", async () => {
  const session = paidSession({ id: "cs_test_paid0000000002", amount_subtotal: 88800, amount_total: 88800, metadata: { product: "studio" } });
  serve(session);
  const j = await (await claim(post({ sessionId: session.id }))).json();
  assert.match(j.key, /^gw-stu-/);
  assert.deepEqual(j.products, ["studio", "library"]);
  const tampered = j.key.slice(0, -2) + (j.key.endsWith("AA") ? "BB" : "AA");
  assert.equal((await access(post({ key: tampered }))).status, 401);
  process.env.ACCESS_SIGNING_SECRET = "a-completely-different-secret-0123456789";
  assert.equal((await access(post({ key: j.key }))).status, 401, "a key signed under another secret is refused");
  process.env.ACCESS_SIGNING_SECRET = SIGNING;
});

await test("claim: unpaid or open is 409; wrong price, currency or product is refused; an unknown session is 404; none sets a cookie", async () => {
  const cases = [
    [paidSession({ id: "cs_test_unpaid00000001", payment_status: "unpaid" }), 409],
    [paidSession({ id: "cs_test_open0000000001", status: "open", payment_status: "unpaid" }), 409],
    [paidSession({ id: "cs_test_cheap000000001", amount_subtotal: 100 }), 400],
    [paidSession({ id: "cs_test_euro0000000001", currency: "eur" }), 400],
    [paidSession({ id: "cs_test_service0000001", metadata: {} }), 400],
    [paidSession({ id: "cs_test_proto000000001", metadata: { product: "toString" } }), 400],
  ];
  for (const [session, status] of cases) {
    serve(session);
    const r = await claim(post({ sessionId: session.id }));
    assert.equal(r.status, status, session.id);
    assert.equal(cookiesOf(r).length, 0, `${session.id} sets no cookie`);
  }
  stripeRoutes = () => ({ status: 404, body: { error: { message: "No such checkout.session" } } });
  assert.equal((await claim(post({ sessionId: "cs_test_missing0000001" }))).status, 404);
  stripeRoutes = () => ({ status: 500, body: { error: { message: "stripe is down" } } });
  assert.equal((await claim(post({ sessionId: "cs_test_down0000000001" }))).status, 502);
});

await test("claim: a revoked purchase (a refund, say) is refused at claim, sign-in and download", async () => {
  const session = paidSession({ id: "cs_test_refund00000001" });
  serve(session);
  const { key } = await (await claim(post({ sessionId: session.id }))).json();
  process.env.ACCESS_REVOKED = `0000000000000000, ${key.split("-")[2]}`;
  assert.equal((await claim(post({ sessionId: session.id }))).status, 403);
  assert.equal((await access(post({ key }))).status, 401);
  assert.equal((await download(get("/api/download?product=library", { authorization: `Bearer ${key}` }))).status, 401);
  delete process.env.ACCESS_REVOKED;
});
delete process.env.STRIPE_SECRET_KEY;
delete process.env.ACCESS_SIGNING_SECRET;
delete process.env.ACCESS_KEYS;

sink.close();
console.log(`\n${passed} passed${process.exitCode ? ", with failures" : ""}`);
