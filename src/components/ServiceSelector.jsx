import { useState, useMemo } from "react";

const SERVICES = [
  // Core builds
  { id: "website", name: "Website", category: "Core builds", oneTime: 750 },
  { id: "brand", name: "Full brand identity & logo", category: "Core builds", oneTime: 500 },
  { id: "verification", name: "Google & Meta business verification", category: "Core builds", oneTime: 120 },
  { id: "contracts", name: "Company contracts — wording & design", category: "Core builds", oneTime: 350 },

  // Content Console
  { id: "console", name: "Content Console — blog, social, email & WhatsApp templates, ID badges", category: "Content Console", oneTime: 400, monthly: 150 },

  // Automation & lead capture
  { id: "whatsapp-bot", name: "Always-on WhatsApp/Telegram booking & qualifying", category: "Automation & lead capture", oneTime: 600, monthly: 80 },
  { id: "missed-call", name: "Missed-call answering & callback booking", category: "Automation & lead capture", oneTime: 300, monthly: 60 },
  { id: "quoting-app", name: "Quick quoting & contracting app, white-labelled", category: "Automation & lead capture", oneTime: 1500, monthly: 50 },

  // Growth & reporting
  { id: "ga4", name: "GA4 setup", category: "Growth & reporting", oneTime: 150 },
  { id: "meta-ads", name: "Meta ads — setup, running, optimising, monthly reporting", category: "Growth & reporting", oneTime: 200, monthly: 300 },

  // Brand extras
  { id: "social-setup", name: "Social media account setup & seeding", category: "Brand extras", oneTime: 250 },
];

const CATEGORIES = [...new Set(SERVICES.map((s) => s.category))];

function formatGBP(n) {
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

export default function ServiceSelector() {
  const [selected, setSelected] = useState(new Set());

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const { oneTimeTotal, monthlyTotal, count } = useMemo(() => {
    let oneTimeTotal = 0, monthlyTotal = 0;
    for (const s of SERVICES) {
      if (selected.has(s.id)) {
        oneTimeTotal += s.oneTime || 0;
        monthlyTotal += s.monthly || 0;
      }
    }
    return { oneTimeTotal, monthlyTotal, count: selected.size };
  }, [selected]);

  function mailtoLink() {
    const chosen = SERVICES.filter((s) => selected.has(s.id)).map((s) => `- ${s.name}`).join("%0D%0A");
    const body = `Services I'm interested in:%0D%0A${chosen}%0D%0A%0D%0AEstimated: ${formatGBP(oneTimeTotal)} one-time${monthlyTotal ? ` + ${formatGBP(monthlyTotal)}/mo` : ""}`;
    return `mailto:hello@goodwork.agency?subject=Custom%20quote%20request&body=${body}`;
  }

  return (
    <section className="gw-section" id="configure">
      <div className="gw-container">
        <p className="gw-label" style={{ marginBottom: 10 }}>Build your own</p>
        <h2 className="gw-h2">Pick what you need</h2>
        <p className="gw-body gw-max-copy gw-text-muted" style={{ marginTop: 12, marginBottom: 28 }}>
          Select any combination of services below and see the price update as you go.
        </p>

        {CATEGORIES.map((cat) => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <p className="gw-label" style={{ marginBottom: 10 }}>{cat}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SERVICES.filter((s) => s.category === cat).map((s) => {
                const active = selected.has(s.id);
                return (
                  <label
                    key={s.id}
                    className="gw-card"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "0.9rem 1.1rem",
                      cursor: "pointer",
                      borderColor: active ? "var(--gw-black)" : "var(--gw-grey-200)",
                      background: active ? "var(--gw-grey-100)" : "var(--gw-white)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggle(s.id)}
                        style={{ width: 18, height: 18, accentColor: "var(--gw-magenta)", flexShrink: 0 }}
                      />
                      <span style={{ fontSize: "0.92rem", fontWeight: active ? 600 : 400 }}>{s.name}</span>
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                      {formatGBP(s.oneTime)}{s.monthly ? <span style={{ color: "var(--gw-grey-700)", fontWeight: 500 }}> +{formatGBP(s.monthly)}/mo</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

        {/* Running total */}
        <div
          className="gw-card"
          style={{
            position: "sticky",
            bottom: 16,
            marginTop: 28,
            background: "var(--gw-black)",
            color: "var(--gw-white)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="gw-label" style={{ color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
              {count} service{count === 1 ? "" : "s"} selected
            </p>
            <p style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
              {formatGBP(oneTimeTotal)}
              {monthlyTotal > 0 && <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "rgba(255,255,255,0.65)" }}> + {formatGBP(monthlyTotal)}/mo</span>}
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
            Get this quote →
          </a>
        </div>
      </div>
    </section>
  );
}
