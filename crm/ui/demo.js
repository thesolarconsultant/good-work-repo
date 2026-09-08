// Demo salon — a realistic Thursday, so the calendar can be judged against a
// day that actually happens rather than four tidy appointments.
// Minutes from midnight throughout; the engine doesn't care what day it is.

export const hm = (h, m = 0) => h * 60 + m;
export const clock = (mins) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;

export const STAFF = [
  { id: "sam", name: "Sam Okoye", role: "Senior stylist", initials: "SO" },
  { id: "priya", name: "Priya Shah", role: "Colourist", initials: "PS" },
  { id: "mel", name: "Mel Ryan", role: "Aesthetician", initials: "MR" },
  { id: "jo", name: "Jo Bianchi", role: "Stylist", initials: "JB" },
];

// The floor is an open area with stations, not a room — capacity is how many
// chairs it has. Treatment rooms hold one client at a time.
export const ROOMS = [
  { id: "floor", name: "Salon floor", capacity: 6 },
  { id: "room1", name: "Treatment room 1", capacity: 1 },
  { id: "room2", name: "Treatment room 2", capacity: 1 },
];

export const ROOM_CAPACITY = Object.fromEntries(ROOMS.map((r) => [r.id, r.capacity]));

// `processing` is the window where the client is occupied but the staff member
// is free — the thing most salon calendars get wrong.
export const SERVICES = [
  { id: "cut_bd", name: "Cut & blow dry", duration: 45, colour: "blue", room: "floor" },
  { id: "restyle", name: "Restyle", duration: 75, colour: "blue", room: "floor" },
  { id: "roots", name: "Root tint", duration: 90, processing: { after: 30, minutes: 40 }, colour: "violet", room: "floor" },
  { id: "balayage", name: "Balayage", duration: 165, processing: { after: 60, minutes: 60 }, colour: "violet", room: "floor" },
  { id: "facial", name: "Signature facial", duration: 60, cleanup: 15, colour: "magenta", room: "room1" },
  { id: "peel", name: "Chemical peel", duration: 45, cleanup: 15, colour: "magenta", room: "room1" },
  { id: "botox", name: "Anti-wrinkle treatment", duration: 30, cleanup: 10, colour: "coral", room: "room2" },
  { id: "consult", name: "Consultation", duration: 20, colour: "grey", room: "room2" },
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

export const CLIENTS = [
  { id: "c1", name: "Hannah Wright", note: "Allergic to PPD — patch tested 12 Aug" },
  { id: "c2", name: "Aoife Byrne", note: "" },
  { id: "c3", name: "Denise Clarke", note: "Prefers Priya" },
  { id: "c4", name: "Lauren Idris", note: "" },
  { id: "c5", name: "Marcus Bell", note: "" },
  { id: "c6", name: "Simone Adeyemi", note: "New client — consultation first" },
  { id: "c7", name: "Kate Lyons", note: "" },
  { id: "c8", name: "Ruth Nkemelu", note: "Course of 6 — session 3" },
];

export const CLIENT_BY_ID = Object.fromEntries(CLIENTS.map((c) => [c.id, c]));

export const SHIFTS = [
  { staffId: "sam", start: hm(9), end: hm(17, 30) },
  { staffId: "priya", start: hm(9, 30), end: hm(18) },
  { staffId: "mel", start: hm(10), end: hm(19) },
  { staffId: "jo", start: hm(12), end: hm(20) },
];

let n = 0;
const book = (staffId, clientId, serviceId, start, extra = {}) => ({
  id: `b${++n}`,
  staffId,
  clientId,
  serviceId,
  start,
  service: SERVICE_BY_ID[serviceId],
  roomId: extra.roomId ?? SERVICE_BY_ID[serviceId].room,
  status: "booked",
  ...extra,
});

export const BOOKINGS = [
  book("sam", "c1", "cut_bd", hm(9, 30)),
  book("sam", "c2", "restyle", hm(10, 30)),
  book("sam", "c5", "cut_bd", hm(13)),
  book("sam", "c7", "restyle", hm(15)),

  // The balayage develops 13:00–14:00, and Denise's cut sits inside that gap.
  book("priya", "c3", "balayage", hm(12)),
  book("priya", "c4", "cut_bd", hm(13)),
  book("priya", "c8", "roots", hm(15, 30)),

  book("mel", "c6", "consult", hm(10, 15), { roomId: "room2" }),
  book("mel", "c8", "facial", hm(11)),
  book("mel", "c1", "peel", hm(14)),
  book("mel", "c4", "botox", hm(16), { roomId: "room2" }),

  book("jo", "c2", "cut_bd", hm(12, 30)),
  book("jo", "c6", "cut_bd", hm(14)),
  book("jo", "c3", "restyle", hm(17)),
];

export const DAY_START = hm(8);
export const DAY_END = hm(20, 30);
