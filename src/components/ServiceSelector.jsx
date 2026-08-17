import { useState } from "react";
import { SERVICES, CATEGORIES, BILLING_LABELS } from "../data/services";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "one-off", label: "One-off builds" },
  { id: "retainer", label: "Monthly" },
];

function matchesFilter(s, filter) {
  if (filter === "all") return true;
  if (filter === "retainer") return s.billing !== "one-off";
  return s.billing !== "retainer";
}

export default function ServiceSelector() {
  const [selected, setSelected] = useState(new Set());
  const [filter, setFilter] = useState("all");

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const count = selected.size;

  function mailtoLink() {
    const chosen = SERVICES.filter((s) => selected.has(s.id)).map((s) => `- ${s.name}`).join("%0D%0A");
    const body = `I'd like a quote for:%0D%0A${chosen}%0D%0A%0D%0AAbout the business:%0D%0A`;
    return `mailto:hello@goodwork.agency?subject=Enquiry&body=${body}`;
  }

  return (
    <section className="gw-section" id="configure">
      <div className="gw-container">
        <p className="gw-label" style={{ marginBottom: 10 }}>What we offer</p>
        <h2 className="gw-h2">Pick what you need</h2>
        <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 20 }}>
          Everything we do, in plain English. Tick whatever's relevant and send it over — we'll come back
          with a scope and a fixed price for exactly that, and nothing you didn't ask for.
        </p>

        <div className="gw-filters" role="group" aria-label="Filter services">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`gw-filter${filter === f.id ? " gw-filter--active" : ""}`}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {CATEGORIES.map((cat) => {
          const items = SERVICES.filter((s) => s.category === cat && matchesFilter(s, filter));
          if (items.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 24 }}>
              <p className="gw-label" style={{ marginBottom: 10 }}>{cat}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((s) => {
                  const active = selected.has(s.id);
                  return (
                    <label key={s.id} className={`gw-pick${active ? " gw-pick--active" : ""}`}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(s.id)}
                        className="gw-pick__box"
                      />
                      <span className="gw-pick__body">
                        <span className="gw-pick__name">{s.name}</span>
                        <span className="gw-pick__note">{s.note}</span>
                      </span>
                      <span className="gw-pick__billing">{BILLING_LABELS[s.billing]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="gw-total">
          <div>
            <p className="gw-label" style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              {count} service{count === 1 ? "" : "s"} selected
            </p>
            <p className="gw-total__figures">
              {count > 0 ? "Send it over and we'll price it" : "Tick what you're interested in"}
            </p>
          </div>
          <a
            href={mailtoLink()}
            className="gw-button"
            style={{
              background: count > 0 ? "var(--gw-white)" : "rgba(255,255,255,0.2)",
              color: count > 0 ? "var(--gw-black)" : "rgba(255,255,255,0.5)",
              pointerEvents: count > 0 ? "auto" : "none",
            }}
          >
            Get a quote →
          </a>
        </div>
      </div>
    </section>
  );
}
