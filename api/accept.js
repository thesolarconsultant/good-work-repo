// =========================================================
// Proposal acceptance — server-side record
//
// A signature that nobody recorded is decoration. This is the bit that turns
// "she typed her name on a webpage" into something you could actually show
// someone: who signed, what they were looking at when they did, and when.
//
// The page sends a hash of the proposal text as rendered in her browser. That
// is the part that matters in a disagreement — not the signature, which only
// proves somebody typed a name, but the hash, which pins the signature to one
// exact version of one exact document. Change a price afterwards and the hash
// on file no longer matches the page, which is the point.
//
// Delivery mirrors api/enquiry.js, and falls back to that function's own
// settings so a site with enquiries already working needs no new config:
//
//   ACCEPT_WEBHOOK_URL    POST the acceptance as JSON. Falls back to
//   (or ENQUIRY_WEBHOOK_URL)  ENQUIRY_WEBHOOK_URL.
//   ACCEPT_WEBHOOK_TOKEN  Optional bearer token, as in enquiry.js.
//   RESEND_API_KEY        Email it. Also needs ACCEPT_TO / ACCEPT_FROM,
//                         which fall back to ENQUIRY_TO / ENQUIRY_FROM.
//
// Set both and it does both, and only fails if both fail.
//
// Unconfigured returns 503, deliberately. Showing a client "accepted, thank
// you" while the acceptance went nowhere is the worst outcome available here:
// she believes she has a contract and you do not know she signed.
// =========================================================

// Generous next to enquiry.js because a drawn signature is a PNG data URL.
const MAX_BODY = 384 * 1024;
const MAX_FIELD = 2000;
const MAX_SIGNATURE = 320 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Per-IP throttle. Best-effort: serverless instances do not share memory, so
// this thins a naive flood rather than stopping a determined one. Acceptances
// are rare by nature, so the ceiling is lower than the enquiry form's.
const RATE = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;

// This endpoint is posted to from the published proposal as well as from the
// site, and an artifact's origin is not knowable in advance. It accepts
// unauthenticated POSTs from anywhere by design — the same posture as
// enquiry.js — which is safe only because it has no interesting side effect:
// it writes to one webhook you control and mails one fixed address.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...CORS },
  });

function clean(value, max = MAX_FIELD) {
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

async function sendEmail({ key, to, from, payload, signature }) {
  const { signatory, text } = payload;

  // The drawn signature travels as an attachment rather than an inline data
  // URI: most mail clients strip data: images, and an acceptance email that
  // silently loses the signature is the one email you cannot afford to lose it
  // from.
  const attachments = [];
  const drawn = /^data:image\/png;base64,([A-Za-z0-9+/=]+)$/.exec(signature || "");
  if (drawn) attachments.push({ filename: "signature.png", content: drawn[1] });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((a) => a.trim()).filter(Boolean),
      reply_to: signatory.email,
      subject: `ACCEPTED — ${payload.document.title} — ${signatory.name}`,
      text,
      html: `<pre style="font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
      ...(attachments.length ? { attachments } : {}),
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
    return new Response(null, { status: 204, headers: { ...CORS, "Cache-Control": "no-store" } });
  }
  if (request.method !== "POST") return json({ error: "Use POST." }, 405);

  const webhookUrl = process.env.ACCEPT_WEBHOOK_URL || process.env.ENQUIRY_WEBHOOK_URL;
  const webhookToken = process.env.ACCEPT_WEBHOOK_TOKEN || process.env.ENQUIRY_WEBHOOK_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.ACCEPT_TO || process.env.ENQUIRY_TO;
  const from = process.env.ACCEPT_FROM || process.env.ENQUIRY_FROM;
  const canWebhook = Boolean(webhookUrl);
  const canEmail = Boolean(resendKey && to && from);

  if (!canWebhook && !canEmail) {
    return json(
      {
        error:
          "Acceptance delivery isn't configured on the server yet — set ACCEPT_WEBHOOK_URL, " +
          "or RESEND_API_KEY with ACCEPT_TO and ACCEPT_FROM.",
      },
      503,
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) return json({ error: "Too many attempts. Try again later." }, 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: "That's too large." }, 413);

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Malformed request." }, 400);
  }

  const signatory = {
    name: clean(body.name, 120),
    role: clean(body.role, 120),
    email: clean(body.email, 200),
    business: clean(body.business, 200),
  };
  if (!signatory.name) return json({ error: "A name is required." }, 400);
  if (!EMAIL_RE.test(signatory.email)) return json({ error: "A valid email is required." }, 400);
  if (body.agreed !== true) return json({ error: "The terms must be agreed." }, 400);

  const signature = clean(body.signature, MAX_SIGNATURE);
  const signatureKind = signature.startsWith("data:image/png") ? "drawn" : "typed";

  const document = {
    title: clean(body.documentTitle, 200) || "Proposal",
    version: clean(body.documentVersion, 60),
    // Computed in the browser over the rendered text. Recorded, never trusted:
    // it is evidence of what she saw, not an assertion this server can check.
    hash: clean(body.documentHash, 128),
    url: clean(body.documentUrl, 500),
  };

  // Held as a preference, not a commitment. The monthly is agreed in
  // conversation before anything starts running, and the wording on the page
  // says so — so recording it as "chosen" would misrepresent what she did.
  const monthlyPreference = clean(body.monthlyPreference, 120);

  const acceptedAt = new Date().toISOString();

  const text = [
    `PROPOSAL ACCEPTED`,
    ``,
    `Document   ${document.title}${document.version ? ` (${document.version})` : ""}`,
    document.url ? `URL        ${document.url}` : null,
    document.hash ? `Hash       ${document.hash}` : null,
    ``,
    `Signed by  ${signatory.name}${signatory.role ? `, ${signatory.role}` : ""}`,
    signatory.business ? `Business   ${signatory.business}` : null,
    `Email      ${signatory.email}`,
    `Signature  ${signatureKind}${signatureKind === "typed" && signature ? ` — "${signature}"` : ""}`,
    ``,
    `Accepted   ${acceptedAt}`,
    `IP         ${ip}`,
    `Browser    ${clean(request.headers.get("user-agent") || "", 300)}`,
    ``,
    monthlyPreference
      ? `Monthly leaning towards: ${monthlyPreference} — NOT agreed, still to discuss.`
      : `Monthly: not indicated — still to discuss.`,
    ``,
    body.note ? `Their note:\n${clean(body.note, 1500)}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const payload = {
    type: "proposal.accepted",
    acceptedAt,
    // Flat at the top level so a CRM can map it without a transform step.
    name: signatory.name,
    email: signatory.email,
    role: signatory.role,
    business: signatory.business,
    signatory,
    document,
    signatureKind,
    // Only the typed signature goes to the webhook. A 300kB data URI in a CRM
    // field is how you break a CRM field.
    signature: signatureKind === "typed" ? signature : "(drawn — see email)",
    monthlyPreference,
    monthlyAgreed: false,
    note: clean(body.note, 1500),
    ip,
    userAgent: clean(request.headers.get("user-agent") || "", 300),
    text,
  };

  const results = await Promise.allSettled([
    canWebhook ? sendWebhook(webhookUrl, payload, webhookToken) : Promise.resolve("skipped"),
    canEmail ? sendEmail({ key: resendKey, to, from, payload, signature }) : Promise.resolve("skipped"),
  ]);

  // One route working is enough: a signed acceptance should not be thrown away
  // because a CRM was down.
  if (results.every((r) => r.status === "rejected")) {
    return json({ error: "We couldn't record that. Please email us and we'll sort it." }, 502);
  }

  return json({ ok: true, acceptedAt });
}
