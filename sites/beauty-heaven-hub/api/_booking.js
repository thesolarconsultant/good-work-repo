// Shared by the booking functions (files starting "_" are not endpoints).
//
// The site's own menu (/book/services.json, written by build.mjs) says which
// treatments and people can be booked online, and carries the salon's booking
// rules from data/booking-rules.json. Every time shown and every booking made
// goes through allowed(), so a rule like "Jess finishes by 6pm" holds on the
// website, and later in the WhatsApp and phone assistants, the same way.

import { createLead } from "./_crm.js";

export const BASE = "https://platform.phorest.com/third-party-api-server/api/business";
const TZ = "Europe/London";

// A booking confirmed in Phorest also lands in the CRM as a contact, so the
// salon has one view of every customer. Never throws, never blocks: the booking
// is already secured by the time this runs. Capped so a slow CRM can't hold up
// the client's confirmation.
async function copyBookingToCrm(p, cat, item, when, source) {
  try {
    await Promise.race([
      createLead({
        name: `${p.firstName} ${p.lastName}`.trim(),
        email: p.email,
        phone: p.mobile,
        source: "booking",
        subject: `${cat.title}: ${item.name}`,
        message: `Booked via ${source} for ${when.date} ${when.time}.`,
        consent: !!p.marketing,
        channel: source,
      }),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* a CRM hiccup never affects a booking */ }
}

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

// ------------------------------------------------------------ booking --
// One way to book, used by the website (api/book.js) and the assistants
// (api/_brain.js), so every channel follows the same rules and checks.
//  1. The treatment, person and time must be ones the site offers, a client
//     may book alone, and the salon's rules allow.
//  2. Re-checks that exact time with Phorest, uncached. Gone: "taken".
//  3. Finds the client by mobile and surname, or creates them. A mobile that
//     matches someone else is never booked into their record.
//  4. Holds the time (RESERVED), then re-reads that practitioner's day. If
//     anything else now overlaps, it cancels its own hold: "taken", so a
//     clash is never left in the diary.
//  5. Where the rules ask for a deposit, returns Phorest's payment link;
//     otherwise activates the booking.
// Personal details are sent only to Phorest. Nothing is stored or logged here.
export const clean = (s, n = 60) => String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
export function ukMobile(raw) {
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


export function bookingLive(data) {
  return !!data.confirmOnSite && process.env.BOOKING_LIVE === "on";
}

export async function makeBooking(data, input, source = "the website") {
  if (!bookingLive(data)) return { status: "off" };
  const p = {
    firstName: clean(input.firstName, 40), lastName: clean(input.lastName, 40),
    mobile: ukMobile(input.mobile), email: clean(input.email, 120).toLowerCase(), marketing: !!input.marketing,
  };
  if (!p.firstName || !p.lastName) return { status: "invalid", error: "Please give your first and last name." };
  if (!p.mobile) return { status: "invalid", error: "Please give a UK mobile number, starting 07." };
  if (p.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email)) return { status: "invalid", error: "That email address doesn't look right." };

  const found = findService(data, String(input.serviceId || ""));
  if (!found) return { status: "invalid", error: "unknown treatment" };
  const { item, cat } = found;
  const staffId = String(input.staffId || "");
  if (!item.staff.some(([id]) => id === staffId)) return { status: "invalid", error: "unknown practitioner" };
  if (!item.confirm) return { status: "team", error: "This treatment is booked with the team directly." };
  const start = String(input.start || "");
  if (breaksRule(data.rules, staffId, start, item.mins)) return { status: "taken" };

  // 2. Is that exact time still free?
  const t = new Date(start).getTime();
  try {
    const live = await freeTimes(data, item, staffId, new Date(t - 3600e3).toISOString(), new Date(t + 3600e3).toISOString());
    if (!live.some((s) => new Date(s.start).getTime() === t && s.staff === staffId)) return { status: "taken" };
  } catch {
    return { status: "error", error: "diary unavailable" };
  }

  const branchId = data.branchId;
  const when = london(t);
  let bookingId = "";
  try {
    // 3. Who is it for?
    const { clientId } = await findOrCreateClient(p, branchId);

    // Asked twice? Don't book twice.
    const mine = await dayAppointments(branchId, when.date, `client_id=${encodeURIComponent(clientId)}`);
    if (mine.some((a) => a.serviceId === item.id && a.startTime?.slice(0, 5) === when.time)) return { status: "confirmed", duplicate: true };

    // 4. Hold it, then make sure nothing else landed on top.
    const res = await phorest(`/branch/${branchId}/booking`, {
      method: "POST",
      body: {
        clientId,
        bookingStatus: "RESERVED",
        clientAppointmentSchedules: [{ clientId, serviceSchedules: [{ serviceId: item.id, staffId, startTime: start }] }],
        note: `Booked by ${source}.`,
      },
    });
    const made = await body(res);
    bookingId = made?.bookingId || "";
    if (!res.ok || !bookingId) {
      console.error("Phorest booking", res.status, JSON.stringify(made)?.slice(0, 300));
      return { status: "taken" };
    }
    const appointmentIds = (made.clientAppointmentSchedules?.[0]?.serviceSchedules || []).map((s) => s.appointmentId).filter(Boolean);

    const theirDay = await dayAppointments(branchId, when.date, `staff_id=${encodeURIComponent(staffId)}`);
    const ours = theirDay.filter((a) => a.bookingId === bookingId || appointmentIds.includes(a.appointmentId));
    if (!ours.length) throw new Error("booking not found after creating it");
    const clash = theirDay.some((a) => !ours.includes(a) && ours.some((o) => minutes(a.startTime) < minutes(o.endTime) && minutes(o.startTime) < minutes(a.endTime)));
    if (clash) {
      await phorest(`/branch/${branchId}/booking/${bookingId}/cancel`, { method: "POST" });
      return { status: "taken" };
    }

    // 5. Deposit, or confirm.
    if ((data.rules?.deposits || {})[cat.id]) {
      const link = await phorest(`/branch/${branchId}/deposit/payment-link`, {
        method: "POST",
        body: { appointmentIds: ours.map((a) => a.appointmentId), notifyViaSms: false, notifyViaEmail: true, autoCancelAppointmentOnExpiry: true },
      });
      const paid = await body(link);
      if (!link.ok || !paid?.url) throw new Error(`deposit link: HTTP ${link.status}`);
      await copyBookingToCrm(p, cat, item, when, source);
      return { status: "deposit", url: paid.url };
    }
    const act = await phorest(`/branch/${branchId}/booking/${bookingId}/activate`, { method: "POST", body: {} });
    if (!act.ok) throw new Error(`activate: HTTP ${act.status}`);
    await copyBookingToCrm(p, cat, item, when, source);
    return { status: "confirmed" };
  } catch (e) {
    console.error(`booking by ${source} failed:`, String(e.message || e));
    if (bookingId) await phorest(`/branch/${branchId}/booking/${bookingId}/cancel`, { method: "POST" }).catch(() => {});
    return { status: "error", error: "We couldn't finish the booking. Nothing has been booked." };
  }
}
