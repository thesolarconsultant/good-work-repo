// =========================================================
// Appointments
//
// The one place that writes to the calendar. Segments are derived from the
// *same* serviceSegments() the interface uses, so the database and the screen
// can never disagree about what a service occupies — a second implementation
// here would be a second definition of a developing window, and they would
// drift within a month.
//
// The engine still runs before the insert, because it produces an answer a
// receptionist can read ("Priya is already booked then"). The constraints
// still run after it, because only they survive two people clicking at once.
// =========================================================

import { serviceSegments, totalDuration } from "../engine/availability.js";
import { CONFLICT } from "./db.js";

/** A services row as the engine wants it. */
export function toEngineService(row) {
  return {
    duration: row.duration,
    cleanup: row.cleanup ?? 0,
    processing: row.processing_minutes
      ? { after: row.processing_after, minutes: row.processing_minutes }
      : undefined,
    colour: row.colour,
  };
}

const addMinutes = (iso, minutes) => new Date(new Date(iso).getTime() + minutes * 60_000);

export class BookingRefused extends Error {
  constructor(reasons) {
    super(reasons.map((r) => r.message).join("; "));
    this.name = "BookingRefused";
    this.reasons = reasons;
  }
}

/**
 * Run a write that is *expected* to sometimes be refused, without poisoning
 * the transaction around it.
 *
 * A constraint violation aborts the whole transaction: every later statement
 * fails with "current transaction is aborted" until it rolls back. One
 * request/one transaction hides that, but importing a diary, booking a course
 * of six, or offering the client an alternative all do several writes in one
 * go — and the first refusal would take the rest with it. A savepoint scopes
 * the damage to the attempt.
 */
async function attempt(client, run) {
  await client.query("SAVEPOINT booking_attempt");
  try {
    const result = await run();
    await client.query("RELEASE SAVEPOINT booking_attempt");
    return result;
  } catch (error) {
    await client.query("ROLLBACK TO SAVEPOINT booking_attempt");
    const reasons = refusalFrom(error);
    if (reasons) throw new BookingRefused(reasons);
    throw error;
  }
}

/** Turn a Postgres exclusion violation into something worth showing a person. */
function refusalFrom(error) {
  if (error?.code !== CONFLICT) return null;
  const detail = `${error.constraint || ""} ${error.message || ""}`;
  if (detail.includes("staff")) {
    return [{ kind: "staff", message: "That stylist was booked while you were deciding" }];
  }
  if (detail.includes("room") || detail.includes("is full")) {
    return [{ kind: "room", message: "That room was taken while you were deciding" }];
  }
  return [{ kind: "conflict", message: "That slot was taken while you were deciding" }];
}

/**
 * Write an appointment and the segments that constrain it.
 *
 * Segment rows carry staff and room denormalised from the appointment, which
 * is what lets the exclusion constraints see them at all.
 */
export async function createAppointment(client, draft) {
  const { rows: [service] } = await client.query(
    "SELECT * FROM services WHERE id = $1 AND active", [draft.serviceId],
  );
  if (!service) throw new Error("No such service");

  const engineService = toEngineService(service);
  const roomId = draft.roomId ?? service.room_id ?? null;
  const startsAt = new Date(draft.startsAt);
  const endsAt = addMinutes(startsAt, totalDuration(engineService));

  return attempt(client, async () => {
    const { rows: [appointment] } = await client.query(
      `INSERT INTO appointments
         (workspace_id, client_id, staff_id, service_id, room_id, starts_at, ends_at, source, created_by)
       VALUES (current_workspace(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [draft.clientId ?? null, draft.staffId, draft.serviceId, roomId,
       startsAt, endsAt, draft.source ?? "salon", draft.createdBy ?? null],
    );

    for (const segment of serviceSegments(engineService)) {
      await client.query(
        `INSERT INTO appointment_segments
           (appointment_id, workspace_id, during, staff_id, room_id, holds_staff, holds_room)
         VALUES ($1, current_workspace(), tstzrange($2, $3), $4, $5, $6, $7)`,
        [appointment.id,
         addMinutes(startsAt, segment.from), addMinutes(startsAt, segment.to),
         draft.staffId, roomId, segment.staff, segment.room],
      );
    }

    return appointment;
  });
}

/**
 * Move an appointment, rewriting its segments.
 *
 * Delete then reinsert rather than update: a service's shape can change under
 * it, and reusing rows means reasoning about how many there used to be. The
 * whole thing is one transaction, so the constraints see the new arrangement
 * and never a half-moved one.
 */
export async function moveAppointment(client, id, { startsAt, staffId, roomId }) {
  const { rows: [current] } = await client.query(
    `SELECT a.*, s.duration, s.processing_after, s.processing_minutes, s.cleanup, s.room_id AS service_room
       FROM appointments a JOIN services s ON s.id = a.service_id
      WHERE a.id = $1`, [id],
  );
  if (!current) throw new Error("No such appointment");

  const engineService = toEngineService(current);
  const start = new Date(startsAt ?? current.starts_at);
  const staff = staffId ?? current.staff_id;
  const room = roomId !== undefined ? roomId : current.room_id;
  const end = addMinutes(start, totalDuration(engineService));

  return attempt(client, async () => {
    await client.query("DELETE FROM appointment_segments WHERE appointment_id = $1", [id]);
    const { rows: [appointment] } = await client.query(
      `UPDATE appointments SET staff_id = $2, room_id = $3, starts_at = $4, ends_at = $5
        WHERE id = $1 RETURNING *`,
      [id, staff, room, start, end],
    );
    for (const segment of serviceSegments(engineService)) {
      await client.query(
        `INSERT INTO appointment_segments
           (appointment_id, workspace_id, during, staff_id, room_id, holds_staff, holds_room)
         VALUES ($1, current_workspace(), tstzrange($2, $3), $4, $5, $6, $7)`,
        [id, addMinutes(start, segment.from), addMinutes(start, segment.to),
         staff, room, segment.staff, segment.room],
      );
    }
    return appointment;
  });
}

/**
 * Cancel, rather than delete.
 *
 * The row stays — a no-show is a fact about a client that the salon needs
 * later, and a deleted appointment is an argument nobody can settle. Only the
 * segments go inactive, which is what frees the slot.
 */
export async function cancelAppointment(client, id, status = "cancelled") {
  await client.query("UPDATE appointment_segments SET active = false WHERE appointment_id = $1", [id]);
  const { rows: [appointment] } = await client.query(
    "UPDATE appointments SET status = $2 WHERE id = $1 RETURNING *", [id, status],
  );
  return appointment;
}

/** Everything the calendar needs for one day, in one round trip each. */
export async function getDay(client, date) {
  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(dayStart.getTime() + 36 * 60 * 60_000);

  // Sequential, not Promise.all. A pg client is a single connection and cannot
  // run queries concurrently — issuing them together silently serialises them
  // anyway and warns, so the parallelism was never real. Genuine concurrency
  // would mean a connection each, which is the wrong trade inside one
  // transaction that has to see a consistent day.
  const staff = await client.query(
    "SELECT id, name, role, colour FROM staff WHERE active ORDER BY name");
  const rooms = await client.query(
    "SELECT id, name, capacity FROM rooms ORDER BY name");
  const services = await client.query(
    `SELECT id, name, duration, processing_after, processing_minutes,
            cleanup, room_id, price, colour FROM services WHERE active ORDER BY name`);
  const shifts = await client.query(
    `SELECT staff_id, lower(during) AS starts_at, upper(during) AS ends_at
       FROM shifts WHERE during && tstzrange($1, $2)`, [dayStart, dayEnd]);
  const appointments = await client.query(
    `SELECT a.id, a.client_id, a.staff_id, a.service_id, a.room_id,
            a.starts_at, a.ends_at, a.status, a.source, c.name AS client_name, c.note AS client_note
       FROM appointments a
       LEFT JOIN clients c ON c.id = a.client_id
      WHERE a.starts_at >= $1 AND a.starts_at < $2 AND a.status <> 'cancelled'
      ORDER BY a.starts_at`, [dayStart, dayEnd]);

  return {
    staff: staff.rows,
    rooms: rooms.rows,
    services: services.rows,
    shifts: shifts.rows,
    appointments: appointments.rows,
  };
}
