// Leads into Twenty (the salon's own open-source CRM).
//
// Phorest stays the system of record for clients and bookings. Twenty holds
// the things Phorest doesn't: website and bot LEADS that aren't a booking yet
// — academy enquiries, model-opportunity interest, general treatment enquiries
// and conversations the assistant hands over.
//
// This is Beauty Heaven's OWN Twenty instance, separate from Good Work's, so
// the salon's client data never mixes with ours. It's wired by two env vars
// (Vercel, Sensitive):
//   TWENTY_API_URL   e.g. https://crm.beautyheavenhub.co  (no trailing /rest)
//   TWENTY_API_KEY   an API key from that instance (Settings -> APIs)
//   TWENTY_LEADS_PATH optional, the object's REST path, defaults to "leads"
//
// With neither set it no-ops (crmLive() === false), so nothing breaks before
// the instance exists. It never throws into the caller: a lead that can't be
// saved returns a status, it doesn't fail the booking or the reply.
//
// The Lead object and its fields are documented in
// docs/beauty-heaven-hub/crm-twenty.md — create them in the instance first.

const SOURCES = new Set(["academy", "model", "treatment", "bot", "booking"]);

// Tolerates a pasted URL with a trailing slash or /rest on the end.
const baseUrl = () => (process.env.TWENTY_API_URL || "").trim().replace(/\/+$/, "").replace(/\/rest$/, "");
const leadsPath = () => (process.env.TWENTY_LEADS_PATH || "leads").trim().replace(/^\/+|\/+$/g, "");

export function crmLive() {
  return !!baseUrl() && !!(process.env.TWENTY_API_KEY || "").trim();
}

function api(path, init = {}) {
  const url = baseUrl(), key = (process.env.TWENTY_API_KEY || "").trim();
  return fetch(`${url}/rest/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(init.headers || {}) },
    signal: init.signal || AbortSignal.timeout(8000),
  });
}

const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// Save one lead. Returns { status: "off" | "ok" | "invalid" | "error", id?, error? }.
// Shape: { name, email, phone, source, subject, message, consent, channel }
//   source  : one of academy | model | treatment | bot
//   subject : the course or treatment it's about (optional)
//   channel : where it came in (e.g. "website", "telegram", "whatsapp")
export async function createLead(lead = {}) {
  if (!crmLive()) return { status: "off" };

  const source = SOURCES.has(lead.source) ? lead.source : null;
  if (!source) return { status: "invalid", error: "unknown lead source" };

  const name = clean(lead.name, 120);
  const email = clean(lead.email, 160).toLowerCase();
  const phone = clean(lead.phone, 40);
  if (!name && !email && !phone) return { status: "invalid", error: "a lead needs at least a name, email or phone" };
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { status: "invalid", error: "that email address doesn't look right" };

  const record = {
    name,
    email,
    phone,
    source,
    subject: clean(lead.subject, 160),
    message: clean(lead.message, 2000),
    consent: !!lead.consent,
    channel: clean(lead.channel || "website", 40),
  };

  try {
    const res = await api(leadsPath(), { method: "POST", body: JSON.stringify(record) });
    if (!res.ok) {
      const detail = (await res.text().catch(() => "")).slice(0, 200);
      console.error("crm: HTTP", res.status, detail);
      return { status: "error", error: `HTTP ${res.status}` };
    }
    const out = await res.json().catch(() => ({}));
    // Twenty returns the created record under data (shape varies by version).
    const id = out?.data?.id || out?.data?.createLead?.id || out?.id || "";
    return { status: "ok", id };
  } catch (e) {
    console.error("crm: unreachable", e?.message || e);
    return { status: "error", error: "crm unreachable" };
  }
}

// Recent leads for the console's CRM view. Returns { status, leads } where
// leads is newest-first; searching is done in the console over this set.
export async function listLeads(limit = 60) {
  if (!crmLive()) return { status: "off", leads: [] };
  try {
    const n = Math.min(Math.max(Number(limit) || 60, 1), 200);
    const res = await api(`${leadsPath()}?limit=${n}&order_by=createdAt[DescNullsLast]`);
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 160);
      return { status: "error", error: `HTTP ${res.status}: ${text}`, leads: [] };
    }
    const out = await res.json().catch(() => ({}));
    // Twenty returns the records under data (shape varies a little by version).
    const rows = out?.data?.[leadsPath()] || out?.data || out?.records || [];
    const leads = (Array.isArray(rows) ? rows : []).map((r) => ({
      id: r.id || "",
      name: r.name || "",
      email: r.email || "",
      phone: r.phone || "",
      source: r.source || "",
      subject: r.subject || "",
      message: r.message || "",
      consent: !!r.consent,
      channel: r.channel || "",
      createdAt: r.createdAt || "",
    }));
    return { status: "ok", leads };
  } catch (e) {
    return { status: "error", error: e?.message || "unreachable", leads: [] };
  }
}

// For a setup check: can we reach the Lead object? -> "off" | "ok" | a problem.
export async function crmStatus() {
  if (!crmLive()) return "off (TWENTY_API_URL / TWENTY_API_KEY not set)";
  try {
    const res = await api(`${leadsPath()}?limit=1`);
    if (res.ok) return "ok";
    const text = (await res.text().catch(() => "")).slice(0, 200);
    // Twenty answers 400/404 with "object '<path>' not found" when the object
    // isn't created yet — the key is fine, the schema just isn't there.
    if (res.status === 401 || res.status === 403) return "connected, but the API key was rejected";
    if (/not found/i.test(text) || res.status === 404) return `connected, but the "${leadsPath()}" object wasn't found — create the Lead object in Twenty (see crm-twenty.md)`;
    return `HTTP ${res.status}: ${text}`;
  } catch (e) {
    return `unreachable: ${e?.message || e}`;
  }
}
