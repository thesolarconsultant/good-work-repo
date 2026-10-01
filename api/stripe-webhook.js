// =========================================================
// Stripe webhook — the only event that may grant access
//
// Verifies the Stripe-Signature header (HMAC-SHA256 over
// "<timestamp>.<raw body>" with STRIPE_WEBHOOK_SECRET, tolerance 5 minutes)
// using Web Crypto, so it runs on the edge runtime without the SDK.
//
// On checkout.session.completed (or, for a bank payment that clears later,
// checkout.session.async_payment_succeeded) with payment_status=paid it emits
// a normalised entitlement event:
//
//   {
//     type: "entitlement.granted",
//     productId: "library" | "studio",
//     email, name, customerId, sessionId, paymentIntentId,
//     amountTotal, currency, paidAt, termsAccepted
//   }
//
// and delivers it to ENTITLEMENT_WEBHOOK_URL (or ENQUIRY_WEBHOOK_URL as a
// fallback) and/or emails it to the owner via Resend.
//
// Access itself doesn't wait for this: the customer claims their key on
// /welcome straight after paying (api/claim.js). When ACCESS_SIGNING_SECRET is
// set the event carries that same key (it is derived from the session), so the
// owner can resend it, and with Resend configured the customer is emailed it
// too, which is their copy if they close the tab. See docs/BACKEND.md.
//
// Sessions for anything else on the same Stripe account (say a payment link
// for a service) are acknowledged and ignored.
//
//   STRIPE_WEBHOOK_SECRET   Required. whsec_… from the Stripe dashboard.
//   ENTITLEMENT_WEBHOOK_URL Optional. Falls back to ENQUIRY_WEBHOOK_URL.
//   RESEND_API_KEY + ENQUIRY_TO + ENQUIRY_FROM  Optional email route.
//   ACCESS_EMAIL_FROM       Optional sender for the customer's key email;
//                           falls back to ENQUIRY_FROM.
// =========================================================

import { issueKey } from "../server/accessKeys.js";
import { PRODUCTS } from "../server/products.js";

const TOLERANCE_S = 5 * 60;

// Cards are paid by checkout.session.completed. Slower methods (bank debits)
// complete unpaid and are paid later, on checkout.session.async_payment_succeeded.
const PAID_EVENTS = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/** Exported so it can be unit-tested against a locally signed payload. */
export async function verifyStripeSignature(rawBody, header, secret, now = Math.floor(Date.now() / 1000)) {
  if (!header || !secret) return false;
  const parts = Object.fromEntries(
    header.split(",").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  if (!Number.isFinite(t) || Math.abs(now - t) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${rawBody}`)));
  // Stripe may send several v1 signatures during a secret rotation.
  const candidates = header
    .split(",")
    .map((kv) => kv.trim())
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  return candidates.some((c) => timingSafeEqual(c, sig));
}

async function deliver(payload) {
  const webhookUrl = process.env.ENTITLEMENT_WEBHOOK_URL || process.env.ENQUIRY_WEBHOOK_URL;
  const token = process.env.ENTITLEMENT_WEBHOOK_TOKEN || process.env.ENQUIRY_WEBHOOK_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  const from = process.env.ENQUIRY_FROM;

  const jobs = [];
  if (webhookUrl) {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["X-Webhook-Token"] = token;
    }
    jobs.push(fetch(webhookUrl, { method: "POST", headers, body: JSON.stringify(payload) }).then((r) => {
      if (!r.ok) throw new Error(`webhook ${r.status}`);
    }));
  }
  if (resendKey && to && from) {
    const text = Object.entries(payload).map(([k, v]) => `${k.padEnd(16)} ${v}`).join("\n");
    jobs.push(
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: to.split(",").map((a) => a.trim()).filter(Boolean),
          subject: `PAID — ${payload.productId} — ${payload.email}`,
          text,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error(`resend ${r.status}`);
      }),
    );
  }
  if (!jobs.length) return "unrouted";
  const results = await Promise.allSettled(jobs);
  if (results.every((r) => r.status === "rejected")) throw new Error(results.map((r) => r.reason?.message).join(" | "));
  return "delivered";
}

/** The customer's own copy of their key. Best-effort: the welcome page has already shown it. */
async function emailCustomer(payload, origin) {
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.ACCESS_EMAIL_FROM || process.env.ENQUIRY_FROM;
  if (!resendKey || !from || !payload.email || !payload.accessKey) return "skipped";
  const site = (process.env.SITE_URL || origin || "").replace(/\/$/, "");
  const product = PRODUCTS[payload.productId]?.name || "Goodwork";
  const text = [
    `Thanks for buying ${product}.`,
    "",
    "Your access key:",
    "",
    `    ${payload.accessKey}`,
    "",
    "It's your licence: one key per purchase. Keep it private, and use it to sign in on any device.",
    site ? `Sign in: ${site}/login` : "",
    site ? `Licence: ${site}/legal/licence` : "",
    "",
    "Reply to this email if anything isn't right.",
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [payload.email], reply_to: process.env.ENQUIRY_TO?.split(",")[0]?.trim() || undefined, subject: `Your ${product} access key`, text }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}`);
    return "sent";
  } catch (err) {
    console.error("customer key email failed:", err.message);
    return "failed";
  }
}

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return json({ error: "STRIPE_WEBHOOK_SECRET is not set." }, 503);

  const raw = await request.text();
  const ok = await verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret);
  if (!ok) return json({ error: "Invalid signature." }, 400);

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Malformed event." }, 400);
  }

  if (!PAID_EVENTS.has(event.type)) return json({ received: true, ignored: event.type });

  const session = event.data?.object || {};
  if (session.payment_status !== "paid") return json({ received: true, ignored: "unpaid" });

  const productId = session.metadata?.product;
  if (!Object.hasOwn(PRODUCTS, productId)) {
    console.log("paid session for something other than Library or Studio:", session.id);
    return json({ received: true, ignored: "not-a-library-or-studio-purchase" });
  }

  const payload = {
    type: "entitlement.granted",
    productId,
    email: session.customer_details?.email || session.customer_email || "",
    name: session.customer_details?.name || "",
    customerId: session.customer || "",
    sessionId: session.id,
    paymentIntentId: session.payment_intent || "",
    amountTotal: session.amount_total,
    currency: session.currency,
    paidAt: new Date((event.created || Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    termsAccepted: session.consent?.terms_of_service === "accepted",
    eventId: event.id,
  };
  if (process.env.ACCESS_SIGNING_SECRET) {
    payload.accessKey = await issueKey(productId, session.id);
    payload.accessKeyId = payload.accessKey.split("-")[2];
  }

  try {
    const status = await deliver(payload);
    if (status === "unrouted") console.warn("entitlement.granted received but no ENTITLEMENT_WEBHOOK_URL or email route is set:", payload.sessionId);
    const customer = await emailCustomer(payload, new URL(request.url).origin);
    return json({ received: true, status, customer });
  } catch (err) {
    // Stripe retries on non-2xx, which is what we want when delivery fails.
    console.error("entitlement delivery failed:", err.message);
    return json({ error: "Delivery failed; Stripe will retry." }, 502);
  }
}
