// Secondary screens. Each is the real layout — toolbar, columns, states — so
// the shape of the app is settled before any of it is wired to a database.
import { CLIENTS, SERVICES, STAFF, ROOMS, BOOKINGS, SERVICE_BY_ID, CLIENT_BY_ID, clock } from "./demo.js";

const money = (n) => `£${n.toFixed(2)}`;

function Screen({ title, action, children }) {
  return (
    <div className="gwc-grid">
      {(title || action) && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h2>
          <span className="gwc-spacer" />
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

function Table({ head, children }) {
  return (
    <div className="gwc-panel" style={{ overflow: "hidden" }}>
      <table className="gwc-table">
        <thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Clients({ onOpen }) {
  return (
    <Screen title="Clients" action={<button className="gwc-btn gwc-btn--primary">＋ New client</button>}>
      <Table head={["Name", "Last visit", "Spend (12m)", "Flags", ""]}>
        {CLIENTS.map((c) => (
          <tr key={c.id}>
            <td style={{ fontWeight: 600 }}>{c.name}</td>
            <td>—</td>
            <td>{money(0)}</td>
            <td>{c.note ? <span className="gwc-pill">⚑ Note</span> : ""}</td>
            <td style={{ textAlign: "right" }}>
              <button className="gwc-btn" onClick={() => onOpen(c.id)}>Open</button>
            </td>
          </tr>
        ))}
      </Table>
    </Screen>
  );
}

export function ClientRecord({ clientId, onBack }) {
  const client = CLIENT_BY_ID[clientId] ?? CLIENTS[0];
  const history = BOOKINGS.filter((b) => b.clientId === client.id);
  return (
    <Screen title={client.name} action={<button className="gwc-btn" onClick={onBack}>← All clients</button>}>
      {client.note && <div className="gwc-note"><span>⚑</span><span>{client.note}</span></div>}
      <div className="gwc-grid" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "start" }}>
        <div className="gwc-panel">
          <div className="gwc-panel__head"><span className="gwc-panel__title">Treatment history</span></div>
          <table className="gwc-table">
            <thead><tr><th>Service</th><th>With</th><th>Time</th></tr></thead>
            <tbody>
              {history.map((b) => (
                <tr key={b.id}>
                  <td>{SERVICE_BY_ID[b.serviceId].name}</td>
                  <td>{STAFF.find((s) => s.id === b.staffId)?.name}</td>
                  <td>{clock(b.start)}</td>
                </tr>
              ))}
              {history.length === 0 && <tr><td colSpan={3} className="gwc-empty">No visits yet</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="gwc-grid">
          <div className="gwc-panel">
            <div className="gwc-panel__head"><span className="gwc-panel__title">Consultation & consent</span></div>
            <div className="gwc-panel__body gwc-grid">
              <span className="gwc-pill">Medical history — signed</span>
              <span className="gwc-pill">Patch test — 12 Aug</span>
              <button className="gwc-btn">Send a form</button>
            </div>
          </div>
          <div className="gwc-panel">
            <div className="gwc-panel__head"><span className="gwc-panel__title">Before &amp; after</span></div>
            <div className="gwc-empty">
              Photos are health data — encrypted, access logged.<br />No photos yet.
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
}

export function Services() {
  return (
    <Screen title="Service menu" action={<button className="gwc-btn gwc-btn--primary">＋ New service</button>}>
      <Table head={["Service", "Duration", "Developing", "Turnaround", "Room", "Marketplace category"]}>
        {SERVICES.map((s) => (
          <tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td>{s.duration} min</td>
            <td>{s.processing ? `${s.processing.minutes} min` : "—"}</td>
            <td>{s.cleanup ? `${s.cleanup} min` : "—"}</td>
            <td>{ROOMS.find((r) => r.id === s.room)?.name}</td>
            <td><span className="gwc-pill">Unmapped</span></td>
          </tr>
        ))}
      </Table>
      <div className="gwc-note">
        <span>ⓘ</span>
        <span>
          Marketplace category is what a consumer searches on. Your own name for the
          service never changes — the category is only how strangers find it.
        </span>
      </div>
    </Screen>
  );
}

export function Team() {
  return (
    <Screen title="Team & rota" action={<button className="gwc-btn gwc-btn--primary">Edit rota</button>}>
      <Table head={["Name", "Role", "Today", "Services", "Commission"]}>
        {STAFF.map((s) => (
          <tr key={s.id}>
            <td style={{ fontWeight: 600 }}>{s.name}</td>
            <td>{s.role}</td>
            <td>—</td>
            <td>All</td>
            <td>—</td>
          </tr>
        ))}
      </Table>
    </Screen>
  );
}

export function Till() {
  return (
    <Screen title="Till">
      <div className="gwc-grid" style={{ gridTemplateColumns: "1.4fr 1fr", alignItems: "start" }}>
        <div className="gwc-panel">
          <div className="gwc-panel__head"><span className="gwc-panel__title">Today's sales</span></div>
          <div className="gwc-empty">No sales taken yet today</div>
        </div>
        <div className="gwc-panel">
          <div className="gwc-panel__head"><span className="gwc-panel__title">Open basket</span></div>
          <div className="gwc-panel__body gwc-grid">
            <div className="gwc-empty" style={{ padding: 20 }}>Nothing in the basket</div>
            <button className="gwc-btn gwc-btn--primary" disabled>Take payment</button>
          </div>
        </div>
      </div>
    </Screen>
  );
}

export function Stock() {
  return (
    <Screen title="Stock" action={<button className="gwc-btn">Order</button>}>
      <Table head={["Product", "In stock", "Reorder at", "Supplier", "Retail"]}>
        <tr><td colSpan={5} className="gwc-empty">No products yet</td></tr>
      </Table>
    </Screen>
  );
}

export function Marketing() {
  const cards = [
    ["Appointment reminders", "SMS and email before every booking"],
    ["Rebooking prompts", "Reach clients who haven't been back"],
    ["Review requests", "Ask after the appointment, not before"],
    ["Campaigns", "One-off email and SMS to a segment"],
    ["Loyalty", "Points, courses and packages"],
  ];
  return (
    <Screen title="Marketing">
      <div className="gwc-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {cards.map(([title, blurb]) => (
          <div className="gwc-panel" key={title}>
            <div className="gwc-panel__body">
              <div className="gwc-panel__title">{title}</div>
              <p style={{ color: "var(--ink-3)", margin: "6px 0 12px" }}>{blurb}</p>
              <button className="gwc-btn">Set up</button>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function OnlineBooking() {
  return (
    <Screen title="Online booking" action={<button className="gwc-btn gwc-btn--primary">Preview page</button>}>
      <div className="gwc-panel">
        <div className="gwc-panel__body gwc-grid">
          <label className="gwc-field"><span>Booking page address</span>
            <input readOnly value="book.yoursalon.co.uk" /></label>
          <label className="gwc-field"><span>Lead time — how soon can a stranger book?</span>
            <select defaultValue="30"><option value="0">Any time</option><option value="30">30 minutes ahead</option><option value="120">2 hours ahead</option></select></label>
          <label className="gwc-field"><span>Deposit</span>
            <select defaultValue="none"><option value="none">None</option><option value="pct">Percentage of service</option><option value="fixed">Fixed amount</option></select></label>
        </div>
      </div>
      <div className="gwc-note">
        <span>ⓘ</span>
        <span>This page is the marketplace engine pointed at one salon. Build it once, run it twice.</span>
      </div>
    </Screen>
  );
}

export function Marketplace() {
  return (
    <Screen title="Marketplace" action={<span className="gwc-pill">Not live</span>}>
      <div className="gwc-grid gwc-grid--stats">
        {[["Listing", "Not published"], ["Services mapped", `0 / ${SERVICES.length}`], ["Bookings this month", "0"], ["Commission owed", money(0)]].map(([label, value]) => (
          <div className="gwc-panel" key={label}>
            <div className="gwc-panel__body">
              <div className="gwc-stat__label">{label}</div>
              <div className="gwc-stat__value">{value}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="gwc-panel">
        <div className="gwc-panel__head"><span className="gwc-panel__title">Before you can be listed</span></div>
        <div className="gwc-panel__body gwc-grid">
          <span>1. Map each service to a marketplace category, so consumers can find it.</span>
          <span>2. Publish your opening hours and roster, so search knows when you're free.</span>
          <span>3. Choose a deposit policy — no-shows cost the marketplace more than they cost you.</span>
        </div>
      </div>
    </Screen>
  );
}

export function Reports() {
  return (
    <Screen title="Reports">
      <div className="gwc-grid gwc-grid--stats">
        {[["Booked today", `${BOOKINGS.length}`], ["Utilisation", "—"], ["Average bill", money(0)], ["Rebooking rate", "—"], ["No-shows", "0"], ["Retail per visit", money(0)]].map(([label, value]) => (
          <div className="gwc-panel" key={label}>
            <div className="gwc-panel__body">
              <div className="gwc-stat__label">{label}</div>
              <div className="gwc-stat__value">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

export function Settings() {
  return (
    <Screen title="Settings">
      <div className="gwc-panel">
        <div className="gwc-panel__head"><span className="gwc-panel__title">Rooms & resources</span></div>
        <table className="gwc-table">
          <thead><tr><th>Name</th><th>Holds</th></tr></thead>
          <tbody>
            {ROOMS.map((r) => (
              <tr key={r.id}><td style={{ fontWeight: 600 }}>{r.name}</td><td>{r.capacity}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="gwc-note">
        <span>ⓘ</span>
        <span>The salon floor holds several stylists at once. A treatment room holds one. Getting this wrong is what makes a calendar refuse bookings it shouldn't.</span>
      </div>
    </Screen>
  );
}

export function WaitingList() {
  return (
    <Screen title="Waiting list" action={<button className="gwc-btn gwc-btn--primary">＋ Add</button>}>
      <Table head={["Client", "Wants", "With", "Any time after", "Notified"]}>
        <tr><td colSpan={5} className="gwc-empty">Nobody waiting. Cancellations will offer slots here.</td></tr>
      </Table>
    </Screen>
  );
}

export function Vouchers() {
  return (
    <Screen title="Vouchers & packages" action={<button className="gwc-btn gwc-btn--primary">＋ Issue</button>}>
      <Table head={["Code", "Type", "Value", "Remaining", "Expires"]}>
        <tr><td colSpan={5} className="gwc-empty">No vouchers issued</td></tr>
      </Table>
    </Screen>
  );
}
