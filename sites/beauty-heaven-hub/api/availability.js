// Live free times for the booking page.
//
//   GET /api/availability/?service=<serviceId>&staff=<staffId, optional>&from=YYYY-MM-DD
//
// Asks Phorest for the online-bookable times for one treatment over seven
// days from `from`, removes any that break the salon's booking rules
// (data/booking-rules.json), and returns only start times and who is free:
// what Phorest's public booking page shows. No client is looked up or
// created. The treatment and person must be ones the site lists, so this
// can't be used to probe the rest of the diary. Cached for a minute at the
// edge; the booking itself always re-checks live.

import { json, loadMenu, findService, freeTimes } from "./_booking.js";

export const config = { runtime: "edge" };

const DAYS = 7;

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
  const found = findService(data, serviceId);
  if (!found) return json({ error: "unknown treatment" }, 404);
  if (staffId && !found.item.staff.some(([id]) => id === staffId)) return json({ error: "unknown practitioner" }, 404);

  try {
    const end = new Date(start.getTime() + DAYS * 864e5);
    const slots = await freeTimes(data, found.item, staffId, start.toISOString(), end.toISOString());
    return json({ from, days: DAYS, slots }, 200, true);
  } catch (e) {
    return json({ error: "diary unavailable" }, 502);
  }
}
