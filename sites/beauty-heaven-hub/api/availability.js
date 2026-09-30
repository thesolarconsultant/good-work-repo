// Live free times for the booking page.
//
//   GET /api/availability/?service=<serviceId>&staff=<staffId, optional>&from=YYYY-MM-DD
//
// Asks Phorest for the online-bookable times for one treatment over seven
// days from `from`, and returns only start times and who is free: the same
// thing Phorest's public booking page shows. No client is looked up or
// created. The treatment and person must be ones the site lists, which it
// reads from its own /book/services.json, so this can't be used to probe the
// rest of the diary. Answers are cached for a minute at the edge.

export const config = { runtime: "edge" };

const BASE = "https://platform.phorest.com/third-party-api-server/api/business";
const DAYS = 7;

const json = (body, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cache ? "public, max-age=0, s-maxage=60, stale-while-revalidate=60" : "no-store",
      "X-Robots-Tag": "noindex",
    },
  });

let menu = null;
async function loadMenu(origin) {
  if (menu && Date.now() - menu.at < 5 * 60 * 1000) return menu.data;
  const res = await fetch(new URL("/book/services.json", origin));
  if (!res.ok) throw new Error(`services.json: HTTP ${res.status}`);
  menu = { at: Date.now(), data: await res.json() };
  return menu.data;
}

function findService(data, id) {
  for (const g of data.groups || []) for (const c of g.cats) for (const s of c.items) if (s.id === id) return s;
  return null;
}

export default async function handler(request) {
  const url = new URL(request.url);
  const serviceId = url.searchParams.get("service") || "";
  const staffId = url.searchParams.get("staff") || "";
  const from = url.searchParams.get("from") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) return json({ error: "from must be YYYY-MM-DD" }, 400);

  // Today onwards, no more than six months ahead.
  const start = new Date(`${from}T00:00:00Z`);
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  if (Number.isNaN(start.getTime()) || start < today || start - today > 183 * 864e5) return json({ error: "date out of range" }, 400);

  let data;
  try {
    data = await loadMenu(url.origin);
  } catch (e) {
    return json({ error: "menu unavailable" }, 503);
  }
  if (!data.live) return json({ error: "live booking is not available on this build" }, 503);
  const service = findService(data, serviceId);
  if (!service) return json({ error: "unknown treatment" }, 404);
  if (staffId && !service.staff.some(([id]) => id === staffId)) return json({ error: "unknown practitioner" }, 404);

  const { PHOREST_USERNAME: user, PHOREST_PASSWORD: pass, PHOREST_BUSINESS_ID: biz } = process.env;
  if (!user || !pass || !biz) return json({ error: "not configured" }, 503);
  const end = new Date(start.getTime() + DAYS * 864e5);
  const selection = { serviceId, ...(staffId ? { staffId } : {}) };

  const res = await fetch(`${BASE}/${biz}/branch/${data.branchId}/appointments/availability`, {
    method: "POST",
    headers: { Authorization: "Basic " + btoa(`${user}:${pass}`), Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isOnlineAvailability: true,
      clientServiceSelections: [{ serviceSelections: [selection] }],
    }),
  });
  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    console.error("Phorest availability", res.status, detail);
    return json({ error: "diary unavailable", status: res.status }, 502);
  }
  const body = await res.json();
  const listed = new Set(service.staff.map(([id]) => id));
  const slots = [];
  for (const slot of body.data || []) {
    const sched = slot.clientSchedules?.[0]?.serviceSchedules?.[0];
    if (!sched) continue;
    // A named practitioner means that person only, never a swap.
    if (staffId && (sched.alternativeStaffMember || sched.staffId !== staffId)) continue;
    if (!listed.has(sched.staffId)) continue;
    slots.push({ start: slot.startTime || sched.startTime, staff: sched.staffId });
  }
  return json({ from, days: DAYS, slots }, 200, true);
}
