import { useState, useMemo } from "react";
import { SERVICES, CATEGORIES, billingOf, formatGBP, priceLabel } from "../data/services";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "oneoff", label: "One-off builds" },
  { id: "monthly", label: "Monthly retainer" },
];

function matchesFilter(s, filter) {
  if (filter === "all") return true;
  if (filter === "monthly") return Boolean(s.monthly || s.monthlyOnly);
  return Boolean(s.oneTime) || (s.poa && !s.monthlyOnly);
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

  const { oneTimeTotal, monthlyTotal, count, poaCount } = useMemo(() => {
    let oneTimeTotal = 0, monthlyTotal = 0, poaCount = 0;
    for (const s of SERVICES) {
      if (!selected.has(s.id)) continue;
      if (s.poa) poaCount += 1;
      oneTimeTotal += s.oneTime || 0;
      monthlyTotal += s.monthly || 0;
    }
    return { oneTimeTotal, monthlyTotal, count: selected.size, poaCount };
  }, [selected]);

  function mailtoLink() {
    const chosen = SERVICES.filter((s) => selected.has(s.id)).map((s) => `- ${s.name}`).join("%0D%0A");
    const estimate = `${formatGBP(oneTimeTotal)} one-time${monthlyTotal ? ` + ${formatGBP(monthlyTotal)}/mo` : ""}`;
    const poaNote = poaCount ? `%0D%0A(${poaCount} item${poaCount === 1 ? "" : "s"} priced on enquiry — not included above)` : "";
    const body = `Services I'm interested in:%0D%0A${chosen}%0D%0A%0D%0AEstimated: ${estimate}${poaNote}`;
    return `mailto:hello@goodwork.agency?subject=Quote%20request&body=${body}`;
  }

  return (
    <section className="gw-section" id="configure">
      <div className="gw-container">
        <p className="gw-label" style={{ marginBottom: 10 }}>Build your own</p>
        <h2 className="gw-h2">Pick what you need</h2>
        <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 20 }}>
          Every service, priced separately. Tick anything and the running total splits what you pay once
          from what you pay monthly.
        </p>

        <div className="gw-filters" role="group" aria-label="Filter services by how they're billed">
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
                  const price = priceLabel(s);
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
                        <span className="gw-pick__billing">{billingOf(s)}</span>
                      </span>
                      <span className="gw-pick__price">
                        {price.main}
                        {price.sub && <small>{price.sub}</small>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Running total */}
        <div className="gw-total">
          <div>
            <p className="gw-label" style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              {count} service{count === 1 ? "" : "s"} selected
            </p>
            <p className="gw-total__figures">
              {formatGBP(oneTimeTotal)} <small>one-off</small>
              {monthlyTotal > 0 && (
                <>
                  <span className="gw-total__plus">+</span>
                  {formatGBP(monthlyTotal)} <small>per month</small>
                </>
              )}
            </p>
            {poaCount > 0 && (
              <p className="gw-total__poa">
                {poaCount} item{poaCount === 1 ? "" : "s"} priced on enquiry — not counted above
              </p>
            )}
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
            Get this quote →
          </a>
        </div>
      </div>
    </section>
  );
}
