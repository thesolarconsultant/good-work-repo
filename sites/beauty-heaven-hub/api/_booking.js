// Shared by the booking functions (files starting "_" are not endpoints).
//
// The site's own menu (/book/services.json, written by build.mjs) says which
// treatments and people can be booked online, and carries the salon's booking
// rules from data/booking-rules.json. Every time shown and every booking made
// goes through allowed(), so a rule like "Jess finishes by 6pm" holds on the
// website, and later in the WhatsApp and phone assistants, the same way.

export const BASE = "https://platform.phorest.com/third-party-api-server/api/business";
const TZ = "Europe/London";

export const json = (body, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cache ? "public, max-age=0, s-maxage=60, stale-while-revalidate=60" : "no-store",
      "X-Robots-Tag": "noindex",
    },
  });

let menu = null;
export async function loadMenu(origin) {
  if (menu && Date.now() - menu.at < 5 * 60 * 1000) return menu.data;
  const res = await fetch(new URL("/book/services.json", origin));
  if (!res.ok) throw new Error(`services.json: HTTP ${res.status}`);
  menu = { at: Date.now(), data: await res.json() };
  return menu.data;
}

export function findService(data, id) {
  for (const g of data.groups || []) for (const c of g.cats) for (const s of c.items) if (s.id === id) return { item: s, cat: c };
  return null;
}

export function phorest(path, { method = "GET", body } = {}) {
  const { PHOREST_USERNAME: user, PHOREST_PASSWORD: pass, PHOREST_BUSINESS_ID: biz } = process.env;
  if (!user || !pass || !biz) throw new Error("Phorest is not configured");
  return fetch(`${BASE}/${biz}${path}`, {
    method,
    headers: { Authorization: "Basic " + btoa(`${user}:${pass}`), Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// London wall-clock parts of an instant: { day: "Tue", time: "18:30", date: "2026-10-06" }.
const partsFmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" });
export function london(ms) {
  const p = Object.fromEntries(partsFmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { day: p.weekday, time: `${p.hour}:${p.minute}`, date: `${p.year}-${p.month}-${p.day}` };
}

// The salon's rules for one slot. Returns "" if fine, or the rule it breaks.
export function breaksRule(rules, staffId, startIso, mins, now = Date.now()) {
  const r = rules || {};
  const start = new Date(startIso).getTime();
  if (Number.isNaN(start)) return "bad time";
  if (start < now + (r.minNoticeHours ?? 0) * 3600e3) return "too soon";
  if (r.maxDaysAhead && start > now + r.maxDaysAhead * 864e5) return "too far ahead";
  const s = london(start);
  const e = london(start + (mins || 0) * 60e3);
  // Most specific wins: that person on that weekday, then that person, then everyone.
  const everyone = r.everyone || {}, person = (r.people || {})[staffId] || {};
  const rule = { ...everyone, ...(everyone.byDay || {})[s.day], ...person, ...(person.byDay || {})[s.day] };
  if (rule.days && !rule.days.includes(s.day)) return "not a working day";
  if (rule.startFrom && s.time < rule.startFrom) return "too early";
  if (rule.finishBy && (e.date !== s.date || e.time > rule.finishBy)) return "finishes too late";
  return "";
}

// Free times from Phorest for one treatment, with the salon's rules applied.
export async function freeTimes(data, service, staffId, startIso, endIso) {
  const selection = { serviceId: service.id, ...(staffId ? { staffId } : {}) };
  const res = await phorest(`/branch/${data.branchId}/appointments/availability`, {
    method: "POST",
    body: { startTime: startIso, endTime: endIso, isOnlineAvailability: true, clientServiceSelections: [{ serviceSelections: [selection] }] },
  });
  if (!res.ok) {
    console.error("Phorest availability", res.status, (await res.text()).slice(0, 300));
    throw new Error(`availability: HTTP ${res.status}`);
  }
  const body = await res.json();
  const listed = new Set(service.staff.map(([id]) => id));
  const out = [];
  for (const slot of body.data || []) {
    const sched = slot.clientSchedules?.[0]?.serviceSchedules?.[0];
    if (!sched || !listed.has(sched.staffId)) continue;
    // A named practitioner means that person only, never a swap.
    if (staffId && (sched.alternativeStaffMember || sched.staffId !== staffId)) continue;
    const start = slot.startTime || sched.startTime;
    if (breaksRule(data.rules, sched.staffId, start, service.mins)) continue;
    out.push({ start, staff: sched.staffId });
  }
  return out;
}
