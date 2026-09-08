// =========================================================
// Availability
//
// The hardest thing in salon software, and the thing it gets judged on. Two
// clients booked into the same stylist at the same time is the failure nobody
// forgives, and it is a failure of *arithmetic*, not of UI — so it lives here,
// with no I/O and no framework, where it can be tested exhaustively.
//
// Everything is minutes since the epoch. Not Date objects, which drag a
// timezone into every comparison, and not ISO strings, which sort correctly
// and subtract incorrectly. The caller resolves the salon's timezone once at
// the edge; in here a day is just a pair of integers.
//
// The one non-obvious idea is processing time. A tint takes 30 minutes to
// apply, 35 to develop and 20 to finish — and during those 35 minutes the
// stylist is free to start someone else. Software that models a service as a
// single opaque block gets that wrong, and a busy colourist loses two clients
// a day to it. So a service is a list of segments, each of which either holds
// the staff member or doesn't.
// =========================================================

/** A booking that holds a resource, as a half-open interval [start, end). */
const overlaps = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

export const MINUTE = 1;
export const HOUR = 60;

/**
 * Break a service into the segments it actually occupies.
 *
 * `duration`       total minutes from arrival to leaving.
 * `processing`     optional { after, minutes } — a window, starting `after`
 *                  minutes in, where the client is occupied but the staff
 *                  member is not.
 * `cleanup`        minutes after the client leaves where the room is still
 *                  held. Never holds the staff member, so they can be booked
 *                  back-to-back while the room turns around.
 *
 * Returns segments with explicit holds, so the conflict check never has to
 * know what kind of service it is looking at.
 */
export function serviceSegments(service) {
  const duration = Math.max(0, Number(service.duration) || 0);
  const cleanup = Math.max(0, Number(service.cleanup) || 0);
  const segments = [];

  const processing = service.processing;
  const hasProcessing = processing &&
    Number(processing.minutes) > 0 &&
    Number(processing.after) >= 0 &&
    Number(processing.after) + Number(processing.minutes) <= duration;

  if (hasProcessing) {
    const after = Number(processing.after);
    const minutes = Number(processing.minutes);
    // Apply — staff and room both held.
    if (after > 0) segments.push({ from: 0, to: after, staff: true, room: true });
    // Develop — the client and the room are held, the staff member is free.
    segments.push({ from: after, to: after + minutes, staff: false, room: true });
    // Finish.
    if (after + minutes < duration) {
      segments.push({ from: after + minutes, to: duration, staff: true, room: true });
    }
  } else if (duration > 0) {
    segments.push({ from: 0, to: duration, staff: true, room: true });
  }

  // Turnaround: room only, nobody in the chair.
  if (cleanup > 0) segments.push({ from: duration, to: duration + cleanup, staff: false, room: true });

  return segments;
}

/** Total minutes a service blocks the room for, cleanup included. */
export function totalDuration(service) {
  const segments = serviceSegments(service);
  return segments.length ? segments[segments.length - 1].to : 0;
}

/** Absolute intervals a booking occupies, given a start time. */
export function bookingIntervals(booking) {
  const start = Number(booking.start);
  return serviceSegments(booking.service).map((seg) => ({
    start: start + seg.from,
    end: start + seg.to,
    staff: seg.staff,
    room: seg.room,
    staffId: booking.staffId ?? null,
    roomId: booking.roomId ?? null,
  }));
}

/**
 * Why a proposed booking can't happen. Empty array means it can.
 *
 * Returns every reason rather than the first, because a receptionist moving an
 * appointment needs to know it clashes with both the stylist *and* the room,
 * not to discover the second problem after fixing the first.
 */
export function findConflicts(candidate, existing = [], options = {}) {
  const conflicts = [];
  const mine = bookingIntervals(candidate);

  for (const other of existing) {
    // Moving a booking shouldn't collide with where it currently is.
    if (other.id && candidate.id && other.id === candidate.id) continue;
    if (other.status === "cancelled") continue;

    for (const theirs of bookingIntervals(other)) {
      for (const ours of mine) {
        if (!overlaps(ours.start, ours.end, theirs.start, theirs.end)) continue;

        if (ours.staff && theirs.staff && ours.staffId && ours.staffId === theirs.staffId) {
          conflicts.push({ kind: "staff", with: other.id ?? null, staffId: ours.staffId });
        }
        if (ours.room && theirs.room && ours.roomId && ours.roomId === theirs.roomId) {
          conflicts.push({ kind: "room", with: other.id ?? null, roomId: ours.roomId });
        }
        // The client is one person and can only be in one chair, even across
        // two different salons on the same marketplace.
        if (candidate.clientId && other.clientId && candidate.clientId === other.clientId) {
          conflicts.push({ kind: "client", with: other.id ?? null, clientId: candidate.clientId });
        }
      }
    }
  }

  // Working hours are a constraint, not a booking, so they're checked apart.
  const shifts = options.shifts ?? null;
  if (shifts) {
    const span = mine.filter((i) => i.staff);
    const covered = span.every((i) =>
      shifts.some((s) => s.staffId === candidate.staffId && s.start <= i.start && i.end <= s.end),
    );
    if (span.length > 0 && !covered) {
      conflicts.push({ kind: "off_shift", staffId: candidate.staffId ?? null });
    }
  }

  // Deduplicate: one overlap can trip the same rule across several segments.
  const seen = new Set();
  return conflicts.filter((c) => {
    const key = `${c.kind}:${c.with ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Can this booking happen? */
export function isBookable(candidate, existing, options) {
  return findConflicts(candidate, existing, options).length === 0;
}

/**
 * Every start time a service could be booked at.
 *
 * This is what the marketplace searches and what the online booking widget
 * renders, so it is deliberately cheap: no allocation per candidate beyond the
 * conflict check, and a caller-controlled step so a busy day can be scanned at
 * 15-minute granularity instead of every minute.
 *
 * `leadTime` keeps the next twenty minutes off a public booking page — nobody
 * wants a stranger booking a slot the stylist is already walking towards.
 */
export function freeSlots({
  service,
  staffIds = [],
  roomIds = [],
  shifts = [],
  bookings = [],
  step = 15,
  now = null,
  leadTime = 0,
}) {
  const slots = [];
  const span = totalDuration(service);
  if (span <= 0) return slots;

  const earliest = now === null ? -Infinity : Number(now) + Number(leadTime);
  // A service with no room requirement is offered against a single null room,
  // so the loop below doesn't need a special case for it.
  const rooms = roomIds.length > 0 ? roomIds : [null];

  for (const shift of shifts) {
    if (staffIds.length > 0 && !staffIds.includes(shift.staffId)) continue;

    for (let start = shift.start; start + span <= shift.end; start += step) {
      if (start < earliest) continue;

      for (const roomId of rooms) {
        const candidate = { start, service, staffId: shift.staffId, roomId };
        if (findConflicts(candidate, bookings, { shifts }).length > 0) continue;
        slots.push({ start, end: start + span, staffId: shift.staffId, roomId });
        break; // One free room is enough to offer the slot.
      }
    }
  }

  return slots.sort((a, b) => a.start - b.start || String(a.staffId).localeCompare(String(b.staffId)));
}
