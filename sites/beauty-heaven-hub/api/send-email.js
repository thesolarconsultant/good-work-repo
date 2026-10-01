// Send one branded email from the console.
//
//   POST /api/send-email   { templateId, to, subject, fields?, slots? }
//     templateId : signature | ivory | evening | letter
//     to         : recipient email
//     subject    : the subject line
//     fields     : { firstName?, bookingUrl?, unsubscribeUrl?, name?, role? }
//     slots      : { preheader?, headline?, body? }  (omit to keep the template's own words)
//
// Behind the console password (middleware.js). The salon's real address, phone
// and email come from this deploy's own data, so they can't be spoofed by the
// caller. This is the single-send path used to test deliverability and to send
// a one-off from the console; campaigns build on it.

import { render, sendEmail, emailLive, TEMPLATES } from "./_email.js";

export const config = { maxDuration: 30 };

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function POST(request) {
  if (!emailLive()) return json({ error: "not_configured", message: "No email provider is set (RESEND_API_KEY / EMAIL_FROM)." }, 503);

  let b;
  try { b = await request.json(); } catch { return json({ error: "bad_json" }, 400); }
  if (!TEMPLATES[b.templateId]) return json({ error: "bad_template", message: "Pick signature, ivory, evening or letter." }, 400);
  if (!b.to) return json({ error: "no_recipient", message: "Who's it going to?" }, 400);
  if (!b.subject) return json({ error: "no_subject", message: "A subject line is needed." }, 400);

  const origin = new URL(request.url).origin;
  const brandBase = `${origin}/goodwork/brands/beauty-heaven-hub/`;

  // The salon's own facts for the merge tags (never from the caller).
  let site = {};
  try { const r = await fetch(`${origin}/book/services.json`, { signal: AbortSignal.timeout(8000) }); if (r.ok) site = (await r.json()).site || {}; } catch { /* fall back to blanks */ }
  const address = Array.isArray(site.address) ? site.address.join(", ") : (site.address || "");
  const email = /tbc/i.test(site.email || "") ? "" : (site.email || "");

  const f = b.fields || {};
  const mergeFields = {
    firstName: f.firstName || "there",
    bookingUrl: f.bookingUrl || `${origin}/book/`,
    address,
    phone: site.phone || "",
    email,
    unsubscribeUrl: f.unsubscribeUrl || (email ? `mailto:${email}?subject=Unsubscribe` : "#"),
    name: f.name || "",
    role: f.role || "",
  };

  let rendered;
  try { rendered = await render(brandBase, b.templateId, b.slots || {}, mergeFields); }
  catch (e) { return json({ error: "render_failed", message: String(e?.message || e) }, 502); }

  const result = await sendEmail({ to: b.to, subject: b.subject, html: rendered.html, text: rendered.text });
  if (result.status === "ok") return json({ ok: true, id: result.id });
  if (result.status === "invalid") return json({ error: "invalid", message: result.error }, 400);
  return json({ error: "send_failed", message: result.error || "Could not send." }, 502);
}
