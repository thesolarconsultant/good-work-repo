// The day's schedule, Phorest-style, for the console.
//
//   GET /api/diary?date=YYYY-MM-DD   -> { date, open, close, staff:[{id,name}],
//                                         appts:[{id, staffId, startMin, endMin, start, service}] }
//
// Reads live appointments from Phorest for one day and returns them laid out by
// practitioner and time. Behind the console password (middleware.js). No client
// names are returned in this first pass — just the treatment and the time — so
// no personal data leaves Phorest. Phorest stays the system of record.

import { loadMenu, phorest } from "./_booking.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

// Minutes-since-midnight from an appointment time, in the branch's wall clock.
function mins(iso) {
  if (!iso) return null;
  const m = String(iso).match(/T(\d{2}):(\d{2})/);
  if (m) return (+m[1]) * 60 + (+m[2]);
  const d = new Date(iso);
  return isNaN(d) ? null : d.getHours() * 60 + d.getMinutes();
}
const hhmm = (n) => `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;

export async function GET(request) {
  const url = new URL(request.url);
  const date = (url.searchParams.get("date") || "").match(/^\d{4}-\d{2}-\d{2}$/)
    ? url.searchParams.get("date")
    : new Date().toISOString().slice(0, 10);

  let data;
  try { data = await loadMenu(url.origin); } catch (e) { return json({ error: "menu", message: String(e.message || e) }, 502); }
  if (!data || !data.branchId) return json({ error: "not_live", message: "Phorest isn't connected to this deployment." }, 503);

  // serviceId -> { name, mins } and staffId -> name, from the built menu.
  const svc = {};
  for (const g of data.groups || []) for (const c of g.cats || []) for (const s of c.items || []) svc[s.id] = { name: s.name, mins: s.mins || 30 };
  const staffNames = data.staff || {};

  let appts;
  try {
    const res = await phorest(`/branch/${data.branchId}/appointment?from_date=${date}&to_date=${date}&size=200`);
    if (!res.ok) return json({ error: "phorest", message: `appointments: HTTP ${res.status}` }, 502);
    const b = await res.json();
    appts = (b?._embedded?.appointments || []).filter((a) => !a.deleted && a.activationState !== "CANCELED");
  } catch (e) {
    return json({ error: "phorest", message: String(e.message || e) }, 502);
  }

  const rows = [];
  let open = 9 * 60, close = 18 * 60;
  for (const a of appts) {
    const startMin = mins(a.startTime);
    if (startMin == null) continue;
    const s = svc[a.serviceId];
    let endMin = mins(a.endTime);
    if (endMin == null || endMin <= startMin) endMin = startMin + (s?.mins || 30);
    open = Math.min(open, startMin);
    close = Math.max(close, endMin);
    rows.push({
      id: a.appointmentId || a.id || `${a.staffMemberId || a.staffId}-${startMin}`,
      staffId: a.staffMemberId || a.staffId || "",
      startMin, endMin, start: hhmm(startMin),
      service: s?.name || "Appointment",
    });
  }

  // Columns: the practitioners with something on that day, by name.
  const ids = [...new Set(rows.map((r) => r.staffId))].filter(Boolean);
  const staff = ids
    .map((id) => ({ id, name: staffNames[id] || "Practitioner" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Round the window out to whole hours, with a little air.
  open = Math.max(0, Math.floor(open / 60) * 60);
  close = Math.min(24 * 60, Math.ceil(close / 60) * 60);
  if (close <= open) { open = 9 * 60; close = 18 * 60; }

  // Diagnostic: field names and counts only, no client data. Remove once mapped.
  console.log("diary debug:", JSON.stringify({
    date, branchId: data.branchId, raw: appts.length, mapped: rows.length, staff: staff.length,
    keys: appts[0] ? Object.keys(appts[0]) : [],
    sampleTimes: appts[0] ? { startTime: appts[0].startTime, endTime: appts[0].endTime, staff: appts[0].staffMemberId || appts[0].staffId } : null,
  }));

  return json({ date, open, close, staff, appts: rows });
}
