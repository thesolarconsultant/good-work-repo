// =========================================================
// Enquiries and applications — server-side delivery
//
// Every form on the site (Built by Goodwork enquiry, Embedded CRM enquiry,
// Agency application, general contact, access interest) posts here as
//   { form: "<id>", fields: {...}, text: "<rendered summary>", page: "/..." }
//
// The site is a static build, so nothing here can live in the front end: an
// email API key in the bundle is a free mail relay for whoever opens devtools.
// This function is the only thing that sees credentials.
//
// Two delivery routes, both optional, at least one required:
//
//   ENQUIRY_WEBHOOK_URL   POST the enquiry as JSON to a CRM or automation
//                         tool (GoHighLevel, Zapier, Make, n8n, your own
//                         endpoint). The body is flat at the top level —
//                         name, firstName, lastName, email, phone, companyName,
//                         form, tags — so a CRM maps it without a transform.
//   ENQUIRY_WEBHOOK_TOKEN Optional. Sent as `Authorization: Bearer <token>`
//                         and `X-Webhook-Token`.
//   RESEND_API_KEY        Email it via Resend. Also needs ENQUIRY_TO and
//                         ENQUIRY_FROM (a domain verified in Resend).
//
// Set both and it does both, and only fails if *both* fail.
//
// If neither is configured this returns 503 and the browser shows the email
// fallback. That is deliberate: returning 200 from an unconfigured endpoint
// would show someone "thanks, we'll be in touch" while the enquiry went
// nowhere, which is worse than any error message.
//
// Web-standard handler (Request -> Response): Vercel Edge as-is; Netlify
// Functions v2 and Cloudflare Workers take it unchanged.
// =========================================================

const MAX_BODY = 48 * 1024;
const MAX_FIELD = 4000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server-side truth about each form: which id is real, which fields must be
// present, and which field is the honeypot. Mirrors src/data/forms.js.
const FORMS = {
  built: { title: "Built by Goodwork enquiry", required: ["name", "business", "email", "phone", "sells", "brandStatus", "launch", "contactMethod"], confirm: "budgetConfirmed" },
  crm: { title: "Embedded CRM enquiry", required: ["name", "business", "email", "phone", "users", "pipeline", "hosting", "contactMethod"] },
  agency: { title: "Agency programme application", required: ["name", "email", "phone", "stage", "services", "revenue", "idealClients", "constraint", "launch", "paymentRoute"], confirm: "investmentConfirmed" },
  contact: { title: "General enquiry", required: ["name", "email", "topic", "message"] },
  access: { title: "Library access interest", required: ["email", "product"] },
};
const HONEYPOT = "website_url";

// Per-IP throttle. Best-effort only: serverless instances don't share memory,
// so this thins out a naive flood rather than stopping a determined one. The
// real protection is that the endpoint has no interesting side effects.
const RATE = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function clean(value, max = MAX_FIELD) {
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string").map((v) => v.trim().slice(0, 120)).slice(0, 40);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function rateLimited(ip) {
  const now = Date.now();
  const hits = (RATE.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  RATE.set(ip, hits);
  if (RATE.size > 5000) {
    for (const [key, times] of RATE) {
      if (!times.some((t) => now - t < RATE_WINDOW_MS)) RATE.delete(key);
    }
  }
  return hits.length > RATE_MAX;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

async function sendWebhook(url, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Webhook-Token"] = token;
  }
  const response = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(`webhook responded ${response.status}`);
}

async function sendEmail({ key, to, from, payload }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((a) => a.trim()).filter(Boolean),
      reply_to: payload.email,
      subject: `${payload.formTitle} — ${payload.name || payload.email}${payload.companyName ? ` (${payload.companyName})` : ""}`,
      text: payload.text,
      html: `<pre style="font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${escapeHtml(payload.text)}</pre>`,
    }),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`resend responded ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
}

export const config = { runtime: "edge" };

export default async function handler(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { Allow: "POST, OPTIONS", "Cache-Control": "no-store" } });
  }
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const webhookUrl = process.env.ENQUIRY_WEBHOOK_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.ENQUIRY_TO;
  const from = process.env.ENQUIRY_FROM;
  const canWebhook = Boolean(webhookUrl);
  const canEmail = Boolean(resendKey && to && from);

  if (!canWebhook && !canEmail) {
    return json(
      { error: "Enquiry delivery isn't configured on the server yet — set ENQUIRY_WEBHOOK_URL, or RESEND_API_KEY with ENQUIRY_TO and ENQUIRY_FROM." },
      503,
    );
  }

  const ip =
    request.headers.get("x-nf-client-connection-ip") ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";
  if (rateLimited(ip)) return json({ error: "That's a lot of enquiries. Try again shortly, or email us." }, 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "That's too big to send." }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const formId = clean(body?.form, 40);
  const spec = FORMS[formId];
  if (!spec) return json({ error: "Unknown form." }, 400);

  const incoming = body?.fields && typeof body.fields === "object" ? body.fields : {};
  // A filled honeypot is a bot. Say OK and do nothing, so it learns nothing.
  if (clean(incoming[HONEYPOT])) return json({ ok: true });

  const fields = {};
  for (const [k, v] of Object.entries(incoming)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k)) continue;
    fields[k] = clean(v);
  }

  // The browser validates as a courtesy; anything can POST, so check again.
  for (const key of spec.required) {
    const v = fields[key];
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return json({ error: `${key} is required.` }, 400);
  }
  if (fields.email && !EMAIL_RE.test(fields.email)) return json({ error: "A valid email is required." }, 400);
  if (spec.confirm && fields[spec.confirm] !== true) return json({ error: "The confirmation box must be ticked." }, 400);

  // The rendered summary is untrusted text: length-capped, only ever used as a
  // plain-text body or HTML-escaped, never interpolated as markup.
  const text = clean(body?.text, 24000) || "(no summary)";
  const page = clean(body?.page, 300);

  const name = fields.name || fields.applicantName || "";
  const [firstName, ...rest] = String(name).split(/\s+/);

  // Flat at the top level on purpose: CRM and automation tools map fields by
  // picking them off the root. The nested `fields` stays too.
  const payload = {
    receivedAt: new Date().toISOString(),
    source: "goodwork-website",
    form: formId,
    formTitle: spec.title,
    page,
    name,
    firstName,
    lastName: rest.join(" "),
    email: fields.email || "",
    phone: fields.phone || "",
    companyName: fields.business || fields.agencyName || "",
    tags: ["website-enquiry", `form:${formId}`, ...(fields.topic ? [`topic:${fields.topic}`] : []), ...(fields.product ? [`product:${fields.product}`] : [])],
    fields,
    text,
  };

  const results = await Promise.allSettled([
    canWebhook ? sendWebhook(webhookUrl, payload, process.env.ENQUIRY_WEBHOOK_TOKEN) : Promise.resolve("skipped"),
    canEmail ? sendEmail({ key: resendKey, to, from, payload }) : Promise.resolve("skipped"),
  ]);
  const attempted = [canWebhook, canEmail];
  const failures = results.filter((r, i) => attempted[i] && r.status === "rejected").map((r) => r.reason?.message || "unknown error");
  const delivered = results.some((r, i) => attempted[i] && r.status === "fulfilled");

  if (!delivered) {
    console.error("enquiry delivery failed:", failures.join(" | "));
    return json({ error: "We couldn't deliver that just now." }, 502);
  }
  if (failures.length) console.warn("enquiry partially delivered:", failures.join(" | "));
  return json({ ok: true });
}
