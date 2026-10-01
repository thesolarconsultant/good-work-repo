// Branded email, sent from here.
//
// The four templates (Signature/Ivory/Evening/Letter) are the single source of
// truth for the design — the same HTML the console previews. This renders one
// server-side (fills the slots, resolves every merge tag so nothing ships as
// "{{...}}") and sends it through Resend.
//
// Wired by env vars (Vercel, Sensitive):
//   RESEND_API_KEY   from resend.com
//   EMAIL_FROM       the sender, e.g. 'Beauty Heaven Hub <halo@beautyheavenhub.co>'
//                    (a test domain you control while testing deliverability)
//   EMAIL_REPLY_TO   optional reply-to address
//
// With neither key nor from set it no-ops (emailLive() === false). It never
// throws into a caller: a send that fails returns a status.

const RESEND = "https://api.resend.com/emails";

// id -> template file (same map the console uses)
export const TEMPLATES = {
  signature: { name: "Signature", file: "email/welcome.html", text: "email/welcome.txt" },
  ivory: { name: "Ivory", file: "email/welcome-maison.html", text: "email/welcome-maison.txt" },
  evening: { name: "Evening", file: "email/welcome-noir.html", text: "email/welcome-noir.txt" },
  letter: { name: "Letter", file: "email/welcome-lettre.html", text: "email/welcome-lettre.txt" },
};

export function emailLive() {
  return !!(process.env.RESEND_API_KEY || "").trim() && !!(process.env.EMAIL_FROM || "").trim();
}

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const SLOT = /<!-- bh:slot (\w+) -->([\s\S]*?)<!-- bh:endslot -->/g;

// Rich headline: *bold* and line breaks, wearing the template's own <b> tag.
function headline(slot, text) {
  const bold = (slot.match(/<b\b[^>]*>/) || ['<b style="font-weight:700;">'])[0];
  return esc(text).replace(/\*([^*]+)\*/g, (m, w) => `${bold}${w}</b>`).replace(/\n/g, "<br>");
}
// Body: one paragraph per blank line, in the template's own paragraph tag.
function paragraphs(slot, text) {
  const opens = slot.match(/<p\b[^>]*>/g) || [];
  const parts = String(text).split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  if (!parts.length || !opens.length) return slot;
  const first = opens[0], last = opens[opens.length - 1];
  return parts.map((t, i) => `${i === parts.length - 1 ? last : first}${esc(t).replace(/\n/g, "<br>")}</p>`).join("\n");
}
function fillSlots(html, slots) {
  return html.replace(SLOT, (whole, name, inner) => {
    if (slots[name] == null) return whole; // leave the template's default
    const out = name === "headline" ? headline(inner, slots[name]) : name === "body" ? paragraphs(inner, slots[name]) : esc(slots[name]);
    return `<!-- bh:slot ${name} -->${out}<!-- bh:endslot -->`;
  });
}
// Resolve every merge tag + [bracket] so nothing client-facing ships raw.
function mergeAll(html, m) {
  for (const [k, v] of Object.entries(m)) html = html.split(k).join(v);
  return html;
}

async function grab(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${res.status} on ${url}`);
  return res.text();
}

// Build the merge map from the salon's facts + this recipient.
function mergeMap({ firstName = "there", bookingUrl = "#", address = "", phone = "", email = "", unsubscribeUrl = "#", name = "", role = "" }) {
  return {
    "{{contact.first_name}}": esc(firstName),
    "{{custom_values.booking_url}}": bookingUrl,
    "{{location.full_address}}": esc(address),
    "{{location.phone}}": phone,
    "{{location.email}}": email,
    "{{unsubscribe_link}}": unsubscribeUrl,
    "[Name]": esc(name),
    "[Role]": esc(role),
  };
}

// Render a template to { html, text }. brandBase ends in a slash and is where
// the email/*.html files live (this deploy's copy).
export async function render(brandBase, templateId, slots, mergeFields) {
  const t = TEMPLATES[templateId];
  if (!t) throw new Error(`unknown template "${templateId}"`);
  const m = mergeMap(mergeFields || {});
  const html = mergeAll(fillSlots(await grab(brandBase + t.file), slots || {}), m);
  let text = "";
  try { text = mergeAll(await grab(brandBase + t.text), m); } catch { /* text part is optional */ }
  return { html, text };
}

// Send one email. Returns { status: "off" | "ok" | "invalid" | "error", id?, error? }.
export async function sendEmail({ to, subject, html, text }) {
  if (!emailLive()) return { status: "off" };
  const addr = String(to || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(addr)) return { status: "invalid", error: "a valid recipient email is required" };
  if (!subject || !html) return { status: "invalid", error: "subject and html are required" };
  const body = {
    from: process.env.EMAIL_FROM,
    to: [addr],
    subject: String(subject).slice(0, 200),
    html,
    ...(text ? { text } : {}),
    ...(process.env.EMAIL_REPLY_TO ? { reply_to: process.env.EMAIL_REPLY_TO } : {}),
  };
  try {
    const res = await fetch(RESEND, {
      method: "POST",
      headers: { Authorization: `Bearer ${(process.env.RESEND_API_KEY || "").trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) { console.error("email: HTTP", res.status, JSON.stringify(out).slice(0, 200)); return { status: "error", error: out?.message || `HTTP ${res.status}` }; }
    return { status: "ok", id: out?.id || "" };
  } catch (e) {
    console.error("email: unreachable", e?.message || e);
    return { status: "error", error: "email provider unreachable" };
  }
}

// For the build/setup check: is sending wired? -> "off" | "ready (<from>)".
export function emailStatus() {
  if (!emailLive()) return "off (RESEND_API_KEY / EMAIL_FROM not set)";
  return `ready (from ${process.env.EMAIL_FROM})`;
}
