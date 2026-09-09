// =========================================================
// Booking against a real database.
//
// The unit tests prove the arithmetic. This proves the arithmetic, the
// repository and the constraints agree — which is the part that breaks, since
// each could be right on its own and still disagree about what a service
// occupies.
//
//   createdb salon
//   psql -d salon -f crm/schema.sql -f crm/seed.sql
//   DATABASE_URL=postgres://…/salon npm run test:db
//
// It writes; point it at a scratch database, never a live one.
// =========================================================

import { asWorkspace } from "./db.js";
import { createAppointment, moveAppointment, cancelAppointment, getDay, BookingRefused }
  from "./appointments.js";

const WS = "11111111-1111-1111-1111-111111111111";
const SAM = "bbbbbbbb-0000-0000-0000-000000000001";
const PRIYA = "bbbbbbbb-0000-0000-0000-000000000002";
const BALAYAGE = "cccccccc-0000-0000-0000-000000000002";
const FACIAL = "cccccccc-0000-0000-0000-000000000003";
const CUT = "cccccccc-0000-0000-0000-000000000004";

const ok = (label) => console.log(`  ok    ${label}`);
const no = (label, why) => console.log(`  FAIL  ${label} — ${why}`);

async function attempt(label, run, expect) {
  try {
    const result = await run();
    if (expect === "refused") no(label, "was accepted but should have been refused");
    else ok(label);
    return result;
  } catch (error) {
    if (expect === "refused" && error instanceof BookingRefused) ok(`${label} → "${error.message}"`);
    else no(label, error.message);
    return null;
  }
}

await asWorkspace(WS, async (db) => {
  // Start from an empty diary. Without this the run only passes once: the
  // second time, yesterday's bookings occupy the slots and every expectation
  // inverts. A test whose result depends on how often it has been run before
  // is not a test.
  await db.query("TRUNCATE appointments, appointment_segments CASCADE");

  console.log("\nBooking against a real database\n");

  const balayage = await attempt("balayage at 12:00 for Priya", () =>
    createAppointment(db, { staffId: PRIYA, serviceId: BALAYAGE, startsAt: "2026-09-10T11:00:00Z" }));

  await attempt("a cut at 13:00, inside the developing window, same stylist", () =>
    createAppointment(db, { staffId: PRIYA, serviceId: CUT, startsAt: "2026-09-10T12:00:00Z" }));

  await attempt("a cut at 12:15, while Priya is still applying", () =>
    createAppointment(db, { staffId: PRIYA, serviceId: CUT, startsAt: "2026-09-10T11:15:00Z" }), "refused");

  await attempt("a facial in treatment room 1 at 09:00", () =>
    createAppointment(db, { staffId: SAM, serviceId: FACIAL, startsAt: "2026-09-10T08:00:00Z" }));

  await attempt("another facial at 10:05, inside the room's turnaround", () =>
    createAppointment(db, { staffId: PRIYA, serviceId: FACIAL, startsAt: "2026-09-10T09:05:00Z" }), "refused");

  await attempt("a cut for Sam at 10:05 — the room is busy, Sam is not", () =>
    createAppointment(db, { staffId: SAM, serviceId: CUT, startsAt: "2026-09-10T09:05:00Z" }));

  // Sam is genuinely free at midday, so this move is legitimate.
  await attempt("moving the balayage onto Sam, who is free at midday", () =>
    moveAppointment(db, balayage.id, { staffId: SAM }));

  // Now make Sam busy across it, and try to move it back onto him.
  await attempt("parking a cut on Priya at 12:30", () =>
    createAppointment(db, { staffId: PRIYA, serviceId: CUT, startsAt: "2026-09-10T14:00:00Z" }));
  await attempt("moving the balayage onto Priya, who is busy then", () =>
    moveAppointment(db, balayage.id, { staffId: PRIYA, startsAt: "2026-09-10T14:00:00Z" }), "refused");

  await attempt("moving the balayage later, to 16:00", () =>
    moveAppointment(db, balayage.id, { startsAt: "2026-09-10T15:00:00Z" }));

  const day = await getDay(db, "2026-09-10");
  console.log(`\n  the day now holds ${day.appointments.length} appointments`);

  await cancelAppointment(db, balayage.id);
  const after = await getDay(db, "2026-09-10");
  console.log(`  after cancelling one: ${after.appointments.length}`);

  await attempt("rebooking the freed 16:00 slot", () =>
    createAppointment(db, { staffId: PRIYA, serviceId: BALAYAGE, startsAt: "2026-09-10T15:00:00Z" }));

  // Segments are what the constraints see, so they are worth looking at.
  const { rows } = await db.query(
    `SELECT s.holds_staff, s.holds_room, to_char(lower(s.during),'HH24:MI') AS f,
            to_char(upper(s.during),'HH24:MI') AS t
       FROM appointment_segments s JOIN appointments a ON a.id = s.appointment_id
      WHERE a.service_id = $1 AND s.active ORDER BY lower(s.during)`, [BALAYAGE]);
  console.log("\n  segments written for a balayage (staff / room):");
  for (const r of rows) console.log(`    ${r.f}–${r.t}  staff ${r.holds_staff ? "held" : "free"}, room ${r.holds_room ? "held" : "free"}`);
});

process.exit(0);
