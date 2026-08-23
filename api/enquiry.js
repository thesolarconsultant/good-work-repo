// =========================================================
// Scope builder enquiries — server-side delivery
//
// The site is a static build, so nothing here can live in the front end: an
// email API key in the bundle is a free mail relay for whoever opens devtools.
// This function is the only thing that sees credentials.
//
// Two delivery routes, both optional, at least one required:
//
//   ENQUIRY_WEBHOOK_URL   POST the enquiry as JSON. This is the one to use
//                         for a CRM — GoHighLevel, Zapier, Make, n8n, or your
//                         own endpoint. Whatever is on the other end decides
//                         what happens to the lead. The body is flat at the
//                         top level (name, firstName, lastName, email, phone,
//                         companyName, tags, services) so a CRM can map it
//                         without a transform step in between.
//   ENQUIRY_WEBHOOK_TOKEN Optional. Sent as `Authorization: Bearer <token>`
//                         and `X-Webhook-Token`, for endpoints that want one.
//   RESEND_API_KEY        Send it as an email via Resend. Also needs
//                         ENQUIRY_TO and ENQUIRY_FROM (a domain verified in
//                         Resend — an unverified from address is rejected).
//
// Set both and it does both, and only fails if *both* fail: a working inbox
// should not be undone by a CRM being down.
//
// If neither is configured this returns 503 and the browser shows the email
// fallback. That is deliberate. Returning 200 from an unconfigured endpoint
// would show the client "thanks, we'll be in touch" while the enquiry went
// nowhere, which is worse than any error message.
//
// Web-standard handler (Request -> Response): works as-is on Netlify
// Functions v2, Cloudflare Workers and Vercel Edge. For a Vercel Node
// function, wrap it — see README.
// =========================================================

const MAX_BODY = 32 * 1024; // A scope enquiry is a couple of kB. This is slack, not a target.
const MAX_FIELD = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-IP throttle. Best-effort only: serverless instances don't share memory,
// so this thins out a naive flood rather than stopping a determined one. The
// real protection is that the endpoint has no interesting side effects — it
// posts to a webhook you control and sends to one fixed address.
const RATE = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 8;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function clean(value, max = MAX_FIELD) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function rateLimited(ip) {
  const now = Date.now();
  const hits = (RATE.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  RATE.set(ip, hits);
  // Stop the map growing without bound on a long-lived instance.
  if (RATE.size > 5000) {
    for (const [key, times] of RATE) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) RATE.delete(key);
    }
  }
  return hits.length > RATE_MAX;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

async function sendWebhook(url, payload, token) {
  const headers = { "Content-Type": "application/json" };
  // Two header names because CRMs disagree about which one they read.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Webhook-Token"] = token;
  }
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`webhook responded ${response.status}`);
}

async function sendEmail({ key, to, from, payload }) {
  const { contact, text } = payload;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((a) => a.trim()).filter(Boolean),
      // So a reply in the inbox goes straight back to the client.
      reply_to: contact.email,
      subject: `Enquiry — ${contact.name}${contact.business ? ` (${contact.business})` : ""}`,
      text,
      html: `<pre style="font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`resend responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
}

// Vercel hands Node functions (req, res) but Edge functions a Request and
// expects a Response, which is what this is — so declare it. Ignored by
// Netlify Functions v2 and Cloudflare Workers, which are Web-standard
// already.
export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "POST, OPTIONS", "Cache-Control": "no-store" },
    });
  }
  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  const webhookUrl = process.env.ENQUIRY_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  const from = process.env.ENQUIRY_FROM;
  const canWebhook = Boolean(webhookUrl);
  const canEmail = Boolean(resendKey && to && from);

  if (!canWebhook && !canEmail) {
    return json(
      {
        error:
          "Enquiry delivery isn't configured on the server yet — set ENQUIRY_WEBHOOK_URL, or RESEND_API_KEY with ENQUIRY_TO and ENQUIRY_FROM.",
      },
      503,
    );
  }

  const ip =
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";
  if (rateLimited(ip)) {
    return json({ error: "That's a lot of enquiries. Try again shortly, or email us." }, 429);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "That's too big to send." }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const contact = {
    name: clean(body?.contact?.name, 200),
    email: clean(body?.contact?.email, 320),
    phone: clean(body?.contact?.phone, 60),
    business: clean(body?.contact?.business, 200),
    message: clean(body?.contact?.message, MAX_FIELD),
  };

  // The same three the form insists on. Validating again here because the
  // browser check is a courtesy, not a guarantee — anything can POST.
  if (!contact.name) return json({ error: "A name is required." }, 400);
  if (!EMAIL_RE.test(contact.email)) return json({ error: "A valid email is required." }, 400);
  if (!contact.phone) return json({ error: "A phone number is required." }, 400);

  const serviceIds = Array.isArray(body?.serviceIds)
    ? body.serviceIds.filter((id) => typeof id === "string").slice(0, 60).map((id) => clean(id, 60))
    : [];

  // The client sends a rendered summary so the inbox reads the way the client
  // saw it. It is untrusted text, so it is length-capped and only ever used as
  // a plain-text body or HTML-escaped — never interpolated as markup.
  const text = clean(body?.text, 16000) || "(no summary)";

  const answers = body?.answers && typeof body.answers === "object" ? body.answers : {};

  // Split the name so a CRM has first/last without anyone writing a transform
  // step. Everything after the first space is the surname — wrong for some
  // names, but the full name is always there under `name` as the source of
  // truth, so nothing is lost either way.
  const [firstName, ...restOfName] = contact.name.split(/\s+/);

  // Flat at the top level on purpose. Most CRM and automation tools map fields
  // by picking them off the root of the payload, and a nested object means
  // somebody has to write a transform before a lead can land. The nested
  // `contact` stays too, so either shape works.
  const payload = {
    receivedAt: new Date().toISOString(),
    source: "scope-builder",

    name: contact.name,
    firstName,
    lastName: restOfName.join(" "),
    email: contact.email,
    phone: contact.phone,
    companyName: contact.business,
    message: contact.message,

    // Ready to drop straight onto a contact record.
    tags: ["website-enquiry", "scope-builder", ...serviceIds.map((id) => `service:${id}`)],
    serviceCount: serviceIds.length,
    serviceIds,
    // The same list as one string, for the many fields that only take text.
    services: serviceIds.join(", "),

    contact,
    answers,
    text,
  };

  const results = await Promise.allSettled([
    canWebhook ? sendWebhook(webhookUrl, payload, process.env.ENQUIRY_WEBHOOK_TOKEN) : Promise.resolve("skipped"),
    canEmail ? sendEmail({ key: resendKey, to, from, payload }) : Promise.resolve("skipped"),
  ]);

  const attempted = [canWebhook, canEmail];
  const failures = results
    .filter((r, i) => attempted[i] && r.status === "rejected")
    .map((r) => r.reason?.message || "unknown error");
  const delivered = results.some((r, i) => attempted[i] && r.status === "fulfilled");

  if (!delivered) {
    // Log for the platform's function logs; the client gets a usable message.
    console.error("enquiry delivery failed:", failures.join(" | "));
    return json({ error: "We couldn't deliver that just now." }, 502);
  }

  // Partial success is still a delivered enquiry, but it should be visible.
  if (failures.length) console.warn("enquiry partially delivered:", failures.join(" | "));

  return json({ ok: true });
}
