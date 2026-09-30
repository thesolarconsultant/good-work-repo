// Confirm a booking from the website, straight into Phorest.
//
//   POST /api/book/   { serviceId, staffId, start, firstName, lastName, mobile, email,
//                       marketing, terms, openedAt, website }
//
// Off unless BOTH switches are on: `confirmOnSite` in data/booking-rules.json
// (so the page shows the form) and the BOOKING_LIVE=on environment variable
// on Vercel (so it can be killed instantly without a redeploy).
//
// What it does, in order, and why:
//  1. Checks the request is a person (a hidden field and a minimum time on
//     the page) and that the treatment, person and time are ones the site
//     offers and the salon's rules allow.
//  2. Re-checks that exact time with Phorest, uncached. Gone: says so.
//  3. Finds the client by mobile and surname, or creates them. A mobile that
//     matches someone else is never booked into their record.
//  4. Holds the time (RESERVED), then re-reads that practitioner's day. If
//     anything else now overlaps, it cancels its own hold and says the time
//     has gone, so a clash is never left in the diary.
//  5. Where the rules ask for a deposit, returns Phorest's payment link and
//     leaves the hold to Phorest's expiry; otherwise activates the booking.
// Personal details are sent only to Phorest. Nothing is stored or logged here.

import { json, loadMenu, findService, phorest, breaksRule, freeTimes, london } from "./_booking.js";

export const config = { runtime: "edge" };

const clean = (s, n = 60) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
function ukMobile(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("0044")) d = d.slice(2);
  if (d.startsWith("07")) d = "44" + d.slice(1);
  return /^447\d{9}$/.test(d) ? d : "";
}
const minutes = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};

async function body(res) {
  try { return await res.json(); } catch { return null; }
}

async function findOrCreateClient(p, branchId) {
  // Phorest's stored format for UK mobiles is still to be confirmed on the
  // dummy-client test, so look under each common form.
  const local = "0" + p.mobile.slice(2);
  for (const phone of [p.mobile, local, p.mobile.slice(2)]) {
    const res = await phorest(`/client?phone=${encodeURIComponent(phone)}&size=20`);
    if (!res.ok) continue;
    const list = (await body(res))?._embedded?.clients || [];
    const same = list.find((c) => !c.archived && !c.deleted && (c.lastName || "").trim().toLowerCase() === p.lastName.toLowerCase() && (c.firstName || "").trim().charAt(0).toLowerCase() === p.firstName.charAt(0).toLowerCase());
    if (same) return { clientId: same.clientId, isNew: false };
  }
  const res = await phorest("/client", {
    method: "POST",
    body: {
      firstName: p.firstName, lastName: p.lastName, mobile: p.mobile, email: p.email || undefined,
      creatingBranchId: branchId,
      smsReminderConsent: true, emailReminderConsent: true,
      smsMarketingConsent: !!p.marketing, emailMarketingConsent: !!p.marketing,
      notes: "Created by the website booking page.",
    },
  });
  const made = await body(res);
  if (!res.ok || !made?.clientId) throw new Error(`create client: HTTP ${res.status}`);
  return { clientId: made.clientId, isNew: true };
}

async function dayAppointments(branchId, date, q) {
  const res = await phorest(`/branch/${branchId}/appointment?from_date=${date}&to_date=${date}&size=100&${q}`);
  if (!res.ok) throw new Error(`appointments: HTTP ${res.status}`);
  return ((await body(res))?._embedded?.appointments || []).filter((a) => !a.deleted && a.activationState !== "CANCELED");
}

export default async function handler(request) {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);
  const url = new URL(request.url);
  let data;
  try {
    data = await loadMenu(url.origin);
  } catch {
    return json({ error: "menu unavailable" }, 503);
  }
  if (!data.confirmOnSite || process.env.BOOKING_LIVE !== "on") return json({ live: false }, 503);

  const inb = await request.json().catch(() => ({}));
  // Bots fill the hidden field or submit instantly. Answer as if it worked.
  if (inb.website || !(Date.now() - Number(inb.openedAt) > 4000)) return json({ status: "confirmed" });

  const p = {
    firstName: clean(inb.firstName, 40), lastName: clean(inb.lastName, 40),
    mobile: ukMobile(inb.mobile), email: clean(inb.email, 120).toLowerCase(), marketing: !!inb.marketing,
  };
  if (!p.firstName || !p.lastName) return json({ error: "Please give your first and last name." }, 400);
  if (!p.mobile) return json({ error: "Please give a UK mobile number, starting 07." }, 400);
  if (p.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) return json({ error: "That email address doesn't look right." }, 400);
  if (inb.terms !== true) return json({ error: "Please agree to the booking policies." }, 400);

  const found = findService(data, String(inb.serviceId || ""));
  if (!found) return json({ error: "unknown treatment" }, 404);
  const { item, cat } = found;
  const staffId = String(inb.staffId || "");
  if (!item.staff.some(([id]) => id === staffId)) return json({ error: "unknown practitioner" }, 404);
  if (!item.confirm) return json({ error: "This treatment is booked with the team directly." }, 409);
  const start = String(inb.start || "");
  if (breaksRule(data.rules, staffId, start, item.mins)) return json({ status: "taken" }, 409);

  // 2. Is that exact time still free?
  const t = new Date(start).getTime();
  try {
    const live = await freeTimes(data, item, staffId, new Date(t - 3600e3).toISOString(), new Date(t + 3600e3).toISOString());
    if (!live.some((s) => new Date(s.start).getTime() === t && s.staff === staffId)) return json({ status: "taken" }, 409);
  } catch {
    return json({ error: "diary unavailable" }, 502);
  }

  const branchId = data.branchId;
  const when = london(t);
  let bookingId = "";
  try {
    // 3. Who is it for?
    const { clientId } = await findOrCreateClient(p, branchId);

    // Pressed twice? Don't book twice.
    const mine = await dayAppointments(branchId, when.date, `client_id=${encodeURIComponent(clientId)}`);
    if (mine.some((a) => a.serviceId === item.id && a.startTime?.slice(0, 5) === when.time)) return json({ status: "confirmed", duplicate: true });

    // 4. Hold it, then make sure nothing else landed on top.
    const res = await phorest(`/branch/${branchId}/booking`, {
      method: "POST",
      body: {
        clientId,
        bookingStatus: "RESERVED",
        clientAppointmentSchedules: [{ clientId, serviceSchedules: [{ serviceId: item.id, staffId, startTime: start }] }],
        note: "Booked on the website.",
      },
    });
    const made = await body(res);
    bookingId = made?.bookingId || "";
    if (!res.ok || !bookingId) {
      console.error("Phorest booking", res.status, JSON.stringify(made)?.slice(0, 300));
      return json({ status: "taken" }, 409);
    }
    const appointmentIds = (made.clientAppointmentSchedules?.[0]?.serviceSchedules || []).map((s) => s.appointmentId).filter(Boolean);

    const theirDay = await dayAppointments(branchId, when.date, `staff_id=${encodeURIComponent(staffId)}`);
    const ours = theirDay.filter((a) => a.bookingId === bookingId || appointmentIds.includes(a.appointmentId));
    if (!ours.length) throw new Error("booking not found after creating it");
    const clash = theirDay.some((a) => !ours.includes(a) && ours.some((o) => minutes(a.startTime) < minutes(o.endTime) && minutes(o.startTime) < minutes(a.endTime)));
    if (clash) {
      await phorest(`/branch/${branchId}/booking/${bookingId}/cancel`, { method: "POST" });
      return json({ status: "taken" }, 409);
    }

    // 5. Deposit, or confirm.
    const deposit = (data.rules?.deposits || {})[cat.id];
    if (deposit) {
      const link = await phorest(`/branch/${branchId}/deposit/payment-link`, {
        method: "POST",
        body: { appointmentIds: ours.map((a) => a.appointmentId), notifyViaSms: false, notifyViaEmail: true, autoCancelAppointmentOnExpiry: true },
      });
      const paid = await body(link);
      if (!link.ok || !paid?.url) throw new Error(`deposit link: HTTP ${link.status}`);
      return json({ status: "deposit", url: paid.url });
    }
    const act = await phorest(`/branch/${branchId}/booking/${bookingId}/activate`, { method: "POST", body: {} });
    if (!act.ok) throw new Error(`activate: HTTP ${act.status}`);
    return json({ status: "confirmed" });
  } catch (e) {
    console.error("website booking failed:", String(e.message || e));
    if (bookingId) await phorest(`/branch/${branchId}/booking/${bookingId}/cancel`, { method: "POST" }).catch(() => {});
    return json({ error: "We couldn't finish the booking. Nothing has been booked. Please message or call us." }, 502);
  }
}
