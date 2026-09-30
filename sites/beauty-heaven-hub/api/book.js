// Confirm a booking from the website, straight into Phorest.
//
//   POST /api/book/   { serviceId, staffId, start, firstName, lastName, mobile, email,
//                       marketing, terms, openedAt, website }
//
// Off unless BOTH switches are on: `confirmOnSite` in data/booking-rules.json
// (so the page shows the form) and the BOOKING_LIVE=on environment variable
// on Vercel (so it can be killed instantly without a redeploy). The booking
// itself is makeBooking() in _booking.js, shared with the assistants.

import { json, loadMenu, makeBooking, bookingLive } from "./_booking.js";

export const config = { runtime: "edge" };

const HTTP = { confirmed: 200, deposit: 200, taken: 409, team: 409, invalid: 400, off: 503, error: 502 };

export default async function handler(request) {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  let data;
  try {
    data = await loadMenu(new URL(request.url).origin);
  } catch {
    return json({ error: "menu unavailable" }, 503);
  }
  if (!bookingLive(data)) return json({ live: false }, 503);

  const inb = await request.json().catch(() => ({}));
  // Bots fill the hidden field or submit instantly. Answer as if it worked.
  if (inb.website || !(Date.now() - Number(inb.openedAt) > 4000)) return json({ status: "confirmed" });
  if (inb.terms !== true) return json({ error: "Please agree to the booking policies." }, 400);

  const r = await makeBooking(data, inb, "the website");
  if (r.status === "error") r.error = "We couldn't finish the booking. Nothing has been booked. Please message or call us.";
  return json(r, HTTP[r.status] || 500);
}
