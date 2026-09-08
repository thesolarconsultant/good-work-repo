import test from "node:test";
import assert from "node:assert/strict";
import { serviceSegments, totalDuration, findConflicts, isBookable, freeSlots } from "./availability.js";

// A day expressed in minutes from an arbitrary origin. 540 = 09:00.
const at = (h, m = 0) => h * 60 + m;

const CUT = { duration: 45 };
const TINT = { duration: 85, processing: { after: 30, minutes: 35 } };
const FACIAL = { duration: 60, cleanup: 15 };

test("a plain service holds staff and room for its whole duration", () => {
  assert.deepEqual(serviceSegments(CUT), [{ from: 0, to: 45, staff: true, room: true }]);
  assert.equal(totalDuration(CUT), 45);
});

test("processing time frees the stylist in the middle but not the chair", () => {
  assert.deepEqual(serviceSegments(TINT), [
    { from: 0, to: 30, staff: true, room: true },
    { from: 30, to: 65, staff: false, room: true },
    { from: 65, to: 85, staff: true, room: true },
  ]);
});

test("cleanup holds the room after the client has gone, but never the staff", () => {
  const segments = serviceSegments(FACIAL);
  assert.deepEqual(segments.at(-1), { from: 60, to: 75, staff: false, room: true });
  assert.equal(totalDuration(FACIAL), 75);
});

test("the same stylist cannot be double-booked", () => {
  const existing = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1" }];
  const clash = { start: at(10, 30), service: CUT, staffId: "sam", roomId: "r2" };
  assert.deepEqual(findConflicts(clash, existing).map((c) => c.kind), ["staff"]);
});

test("a second client fits inside another's processing time", () => {
  // Sam applies a tint 10:00-10:30, it develops until 11:05, finish 11:05-11:25.
  const existing = [{ id: "a", start: at(10), service: TINT, staffId: "sam", roomId: "r1" }];
  // A 30-minute cut at 10:30 lands entirely in the developing window.
  const squeeze = { start: at(10, 30), service: { duration: 30 }, staffId: "sam", roomId: "r2" };
  assert.equal(isBookable(squeeze, existing), true, "should fit in the gap");

  // Five minutes later it would run into the finish, so it must be refused.
  const tooLate = { start: at(10, 40), service: { duration: 30 }, staffId: "sam", roomId: "r2" };
  assert.deepEqual(findConflicts(tooLate, existing).map((c) => c.kind), ["staff"]);
});

test("a room can only hold one client, even with different staff", () => {
  const existing = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1" }];
  const clash = { start: at(10, 15), service: CUT, staffId: "alex", roomId: "r1" };
  assert.deepEqual(findConflicts(clash, existing).map((c) => c.kind), ["room"]);
});

test("cleanup blocks the room but leaves the stylist free", () => {
  const existing = [{ id: "a", start: at(10), service: FACIAL, staffId: "sam", roomId: "r1" }];
  // 11:05 is inside the 11:00-11:15 turnaround.
  assert.deepEqual(
    findConflicts({ start: at(11, 5), service: CUT, staffId: "alex", roomId: "r1" }, existing).map((c) => c.kind),
    ["room"],
  );
  // Same moment, a different room: Sam is free the second the client leaves.
  assert.equal(isBookable({ start: at(11, 5), service: CUT, staffId: "sam", roomId: "r2" }, existing), true);
});

test("back-to-back bookings do not collide", () => {
  const existing = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1" }];
  assert.equal(isBookable({ start: at(10, 45), service: CUT, staffId: "sam", roomId: "r1" }, existing), true);
});

test("one client cannot be in two chairs at once", () => {
  const existing = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1", clientId: "c1" }];
  const clash = { start: at(10, 15), service: CUT, staffId: "alex", roomId: "r2", clientId: "c1" };
  assert.deepEqual(findConflicts(clash, existing).map((c) => c.kind), ["client"]);
});

test("a cancelled appointment frees its slot", () => {
  const existing = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1", status: "cancelled" }];
  assert.equal(isBookable({ start: at(10), service: CUT, staffId: "sam", roomId: "r1" }, existing), true);
});

test("moving an appointment does not clash with where it already is", () => {
  const existing = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1" }];
  const moved = { id: "a", start: at(10, 15), service: CUT, staffId: "sam", roomId: "r1" };
  assert.equal(isBookable(moved, existing), true);
});

test("every reason is reported, not just the first", () => {
  const existing = [
    { id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1", clientId: "c1" },
  ];
  const clash = { start: at(10, 10), service: CUT, staffId: "sam", roomId: "r1", clientId: "c1" };
  assert.deepEqual(findConflicts(clash, existing).map((c) => c.kind).sort(), ["client", "room", "staff"]);
});

test("a booking outside the stylist's shift is refused", () => {
  const shifts = [{ staffId: "sam", start: at(9), end: at(17) }];
  const late = { start: at(16, 30), service: { duration: 45 }, staffId: "sam", roomId: "r1" };
  assert.deepEqual(findConflicts(late, [], { shifts }).map((c) => c.kind), ["off_shift"]);
});

test("free slots respect shift, service length and existing bookings", () => {
  const shifts = [{ staffId: "sam", start: at(9), end: at(12) }];
  const bookings = [{ id: "a", start: at(10), service: CUT, staffId: "sam", roomId: "r1" }];
  const slots = freeSlots({ service: CUT, shifts, bookings, roomIds: ["r1"], step: 15 });
  const starts = slots.map((s) => s.start);

  assert.ok(starts.includes(at(9)), "09:00 is free");
  assert.ok(!starts.includes(at(9, 30)), "09:30 would run into the 10:00 booking");
  assert.ok(!starts.includes(at(10)), "10:00 is taken");
  assert.ok(starts.includes(at(10, 45)), "10:45 is free once the cut ends");
  assert.ok(starts.every((s) => s + 45 <= at(12)), "nothing runs past the end of the shift");
});

test("lead time keeps imminent slots off a public booking page", () => {
  const shifts = [{ staffId: "sam", start: at(9), end: at(12) }];
  const slots = freeSlots({ service: CUT, shifts, step: 15, now: at(9), leadTime: 30 });
  assert.equal(slots[0].start, at(9, 30));
});

test("a slot is offered while any room is free", () => {
  const shifts = [{ staffId: "sam", start: at(9), end: at(11) }];
  const bookings = [{ id: "a", start: at(9), service: CUT, staffId: "alex", roomId: "r1" }];
  const slots = freeSlots({ service: CUT, shifts, bookings, roomIds: ["r1", "r2"], step: 15 });
  assert.equal(slots[0].start, at(9), "r2 is free even though r1 is not");
  assert.equal(slots[0].roomId, "r2");
});

test("no slots are offered when every room is taken", () => {
  const shifts = [{ staffId: "sam", start: at(9), end: at(10) }];
  const bookings = [
    { id: "a", start: at(9), service: CUT, staffId: "alex", roomId: "r1" },
    { id: "b", start: at(9), service: CUT, staffId: "jo", roomId: "r2" },
  ];
  assert.deepEqual(freeSlots({ service: CUT, shifts, bookings, roomIds: ["r1", "r2"], step: 15 }), []);
});
