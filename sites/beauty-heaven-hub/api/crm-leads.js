// The CRM Leads view in the console: recent leads from Twenty.
//
//   GET /api/crm-leads            -> { ok, leads: [...] }  (newest first)
//   GET /api/crm-leads?limit=100
//
// Read-only. Behind the console password (middleware.js). Searching/filtering
// happens in the console over this set, so no personal data is put in the URL.

import { listLeads, crmLive } from "./_crm.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export async function GET(request) {
  if (!crmLive()) return json({ error: "not_configured", message: "The CRM isn't connected (TWENTY_API_URL / TWENTY_API_KEY)." }, 503);
  const limit = new URL(request.url).searchParams.get("limit") || 60;
  const out = await listLeads(limit);
  if (out.status === "ok") return json({ ok: true, leads: out.leads });
  return json({ error: "crm_error", message: out.error || "Could not read leads." }, 502);
}
