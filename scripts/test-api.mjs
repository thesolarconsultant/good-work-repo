// Exercises the edge functions in api/ without deploying them: each handler is
// a Web-standard Request -> Response function, so Node can call it directly.
//
//   npm run test:api
//
// Covers: enquiry validation and delivery to a local webhook, the honeypot,
// the unconfigured 503s, checkout's product guard, the Stripe webhook's
// signature verification with a payload signed here using the same scheme,
// access-key sign-in (cookies, coverage, sign-out) and the licensed download
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

// ----------------------------------------------------------------- access --
const access = (await import("../api/access.js")).default;
const download = (await import("../api/download.js")).default;
const { default: ITEMS } = await import("../server/generated/libraryItems.js");
const get = (url, headers = {}) => new Request(`http://localhost${url}`, { headers });
const del = (url) => new Request(`http://localhost${url}`, { method: "DELETE" });
const cookiesOf = (r) => (r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie")].filter(Boolean));
const LIB_KEY = "test_library_key_0123456789";
const STUDIO_KEY = "test_studio_key_0123456789";

await test("access: 503 until ACCESS_KEYS is set, for sign-in and download alike", async () => {
  delete process.env.ACCESS_KEYS;
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
delete process.env.ACCESS_KEYS;

sink.close();
console.log(`\n${passed} passed${process.exitCode ? ", with failures" : ""}`);
