import { useMemo, useState } from "react";
import Calendar from "./Calendar.jsx";
import * as Screens from "./Screens.jsx";
import { findConflicts, freeSlots } from "../engine/availability.js";
import {
  BOOKINGS, CLIENTS, SERVICES, SERVICE_BY_ID, SHIFTS, STAFF, ROOM_CAPACITY,
  DAY_START, DAY_END, clock, hm,
} from "./demo.js";
import "./app.css";

const NAV = [
  { group: "Front desk", items: [
    { id: "calendar", label: "Appointments", icon: "▦" },
    { id: "clients", label: "Clients", icon: "◍" },
    { id: "till", label: "Till", icon: "▤" },
    { id: "waiting", label: "Waiting list", icon: "◷" },
  ] },
  { group: "The salon", items: [
    { id: "services", label: "Service menu", icon: "✦" },
    { id: "team", label: "Team & rota", icon: "◎" },
    { id: "stock", label: "Stock", icon: "▪" },
    { id: "vouchers", label: "Vouchers", icon: "◈" },
  ] },
  { group: "Growth", items: [
    { id: "marketing", label: "Marketing", icon: "◐" },
    { id: "booking", label: "Online booking", icon: "◇" },
    { id: "marketplace", label: "Marketplace", icon: "◭", badge: "New" },
  ] },
  { group: "Business", items: [
    { id: "reports", label: "Reports", icon: "◫" },
    { id: "settings", label: "Settings", icon: "⚙" },
  ] },
];

const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items).map((i) => [i.id, i.label]));

/** New-appointment drawer. Refuses to save a booking the engine won't allow. */
function BookingDrawer({ slot, bookings, onClose, onSave }) {
  const [clientId, setClientId] = useState(CLIENTS[0].id);
  const [serviceId, setServiceId] = useState(SERVICES[0].id);
  const [staffId, setStaffId] = useState(slot.staffId);
  const [start, setStart] = useState(slot.start);

  const service = SERVICE_BY_ID[serviceId];
  const candidate = { start, service, staffId, roomId: service.room, clientId };
  const conflicts = findConflicts(candidate, bookings, { shifts: SHIFTS, roomCapacity: ROOM_CAPACITY });

  // If it can't go here, offer where it can — a refusal with no next step is
  // how a receptionist ends up keeping a paper book.
  const alternatives = useMemo(() => {
    if (conflicts.length === 0) return [];
    return freeSlots({
      service, shifts: SHIFTS, bookings, staffIds: [staffId],
      roomIds: [service.room], roomCapacity: ROOM_CAPACITY, step: 15,
    })
      .filter((s) => Math.abs(s.start - start) <= 180)
      .slice(0, 6);
  }, [conflicts.length, service, bookings, staffId, start]);

  return (
    <>
      <div className="gwc-backdrop" onClick={onClose} />
      <aside className="gwc-drawer" aria-label="New appointment">
        <div className="gwc-drawer__head">
          <span className="gwc-drawer__title">New appointment</span>
          <span className="gwc-spacer" />
          <button className="gwc-btn gwc-btn--icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="gwc-drawer__body">
          <label className="gwc-field"><span>Client</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="gwc-field"><span>Service</span>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {SERVICES.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.duration} min</option>)}
            </select>
          </label>
          <label className="gwc-field"><span>With</span>
            <select value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              {STAFF.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="gwc-field"><span>Starts</span>
            <select value={start} onChange={(e) => setStart(Number(e.target.value))}>
              {Array.from({ length: (DAY_END - DAY_START) / 15 }, (_, i) => DAY_START + i * 15).map((m) => (
                <option key={m} value={m}>{clock(m)}</option>
              ))}
            </select>
          </label>

          {service.processing && (
            <div className="gwc-note">
              <span>ⓘ</span>
              <span>
                Develops for {service.processing.minutes} minutes from {clock(start + service.processing.after)} —
                the stylist is free to take another client in that window.
              </span>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="gwc-conflict">
              <strong>Can't book that.</strong>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {conflicts.map((c, i) => <li key={i}>{c.kind === "staff" ? "That stylist is already booked" : c.kind === "room" ? "No room free" : c.kind === "client" ? "The client is booked elsewhere" : "They aren't rostered then"}</li>)}
              </ul>
              {alternatives.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {alternatives.map((s) => (
                    <button key={s.start} className="gwc-btn" onClick={() => setStart(s.start)}>{clock(s.start)}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="gwc-drawer__foot">
          <button className="gwc-btn" onClick={onClose}>Cancel</button>
          <button
            className="gwc-btn gwc-btn--primary"
            disabled={conflicts.length > 0}
            onClick={() => onSave({ clientId, serviceId, staffId, start, roomId: service.room })}
          >
            Book it
          </button>
        </div>
      </aside>
    </>
  );
}

/** Screens are addressable, so a link into the app lands where it says it will. */
const screenFromHash = () => {
  const id = typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, "");
  return TITLES[id] ? id : "calendar";
};

export default function App() {
  const [screen, setScreen] = useState(screenFromHash);
  const [collapsed, setCollapsed] = useState(false);
  const [bookings, setBookings] = useState(BOOKINGS);
  const [slot, setSlot] = useState(null);
  const [openClient, setOpenClient] = useState(null);

  const now = useMemo(() => {
    const d = new Date();
    return hm(d.getHours(), d.getMinutes());
  }, []);

  const move = (id, next) =>
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, ...next } : b)));

  const save = (draft) => {
    setBookings((list) => [...list, {
      ...draft,
      id: `b${Date.now()}`,
      service: SERVICE_BY_ID[draft.serviceId],
      status: "booked",
    }]);
    setSlot(null);
  };

  const body = () => {
    switch (screen) {
      case "calendar":
        return (
          <Calendar
            staff={STAFF} bookings={bookings} shifts={SHIFTS} services={SERVICE_BY_ID}
            clients={CLIENTS} roomCapacity={ROOM_CAPACITY}
            dayStart={DAY_START} dayEnd={DAY_END} now={now}
            onMove={move} onPickSlot={setSlot}
          />
        );
      case "clients":
        return openClient
          ? <Screens.ClientRecord clientId={openClient} onBack={() => setOpenClient(null)} />
          : <Screens.Clients onOpen={setOpenClient} />;
      case "services": return <Screens.Services />;
      case "team": return <Screens.Team />;
      case "till": return <Screens.Till />;
      case "stock": return <Screens.Stock />;
      case "waiting": return <Screens.WaitingList />;
      case "vouchers": return <Screens.Vouchers />;
      case "marketing": return <Screens.Marketing />;
      case "booking": return <Screens.OnlineBooking />;
      case "marketplace": return <Screens.Marketplace />;
      case "reports": return <Screens.Reports />;
      case "settings": return <Screens.Settings />;
      default: return null;
    }
  };

  return (
    <div className="gwc" data-rail={collapsed ? "collapsed" : "open"}>
      <nav className="gwc-rail">
        <div className="gwc-rail__brand">
          <span className="gwc-rail__mark" />
          {!collapsed && <span>GOOD WORK.</span>}
        </div>
        <div className="gwc-rail__nav">
          {NAV.map((group) => (
            <div className="gwc-rail__group" key={group.group}>
              <div className="gwc-rail__grouplabel">{group.group}</div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  className="gwc-navitem"
                  aria-current={screen === item.id ? "page" : undefined}
                  onClick={() => {
                    setScreen(item.id);
                    setOpenClient(null);
                    if (typeof window !== "undefined") window.location.hash = item.id;
                  }}
                >
                  <span className="gwc-navitem__icon" aria-hidden="true">{item.icon}</span>
                  <span className="gwc-navitem__label">{item.label}</span>
                  {item.badge && <span className="gwc-navitem__badge">{item.badge}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </nav>

      <div className="gwc-main">
        <header className="gwc-topbar">
          <button className="gwc-btn gwc-btn--icon" onClick={() => setCollapsed((c) => !c)} aria-label="Toggle menu">☰</button>
          <span className="gwc-topbar__title">{TITLES[screen]}</span>
          {screen === "calendar" && (
            <>
              <button className="gwc-btn gwc-btn--icon" aria-label="Previous day">‹</button>
              <button className="gwc-btn">Today</button>
              <button className="gwc-btn gwc-btn--icon" aria-label="Next day">›</button>
              <span style={{ fontWeight: 600, color: "var(--ink-2)" }}>Thursday 10 September</span>
              <span className="gwc-spacer" />
              <div className="gwc-seg">
                <button aria-pressed="true">Day</button>
                <button aria-pressed="false">3 day</button>
                <button aria-pressed="false">Week</button>
              </div>
            </>
          )}
          <span className="gwc-spacer" />
          <div className="gwc-search">
            <span aria-hidden="true">⌕</span>
            <input placeholder="Search clients, bookings…" aria-label="Search" />
          </div>
          <button className="gwc-btn gwc-btn--primary" onClick={() => setSlot({ staffId: STAFF[0].id, start: hm(11) })}>
            ＋ New
          </button>
        </header>

        <main className={`gwc-screen${screen === "calendar" ? " gwc-screen--flush" : ""}`}>
          {body()}
        </main>
      </div>

      {slot && (
        <BookingDrawer slot={slot} bookings={bookings} onClose={() => setSlot(null)} onSave={save} />
      )}
    </div>
  );
}
