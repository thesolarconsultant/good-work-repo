import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import { useInView } from "../lib/motion";
import { SERVICES, CATEGORIES, BILLING_LABELS } from "../data/services";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "one-off", label: "One-off builds" },
  { id: "retainer", label: "Monthly" },
];

const STORAGE_KEY = "gw:selected-services";

function matchesFilter(s, filter) {
  if (filter === "all") return true;
  if (filter === "retainer") return s.billing !== "one-off";
  return s.billing !== "retainer";
}

export default function ServiceSelector() {
  // Restore a part-finished selection — coming back from a case study
  // shouldn't cost you the ten things you'd already ticked.
  const [selected, setSelected] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });
  const [filter, setFilter] = useState("all");
  const [bump, setBump] = useState(false);
  const firstRender = useRef(true);

  // The summary bar is pinned to the bottom of the viewport, so left alone it
  // would sit over the filters and the intro copy for the whole height of the
  // section. Narrowing the observer root to a band across the middle of the
  // screen means it only slides up once the list is genuinely what you're
  // looking at, and drops away again once you've scrolled past it.
  const [listRef, listEngaged] = useInView({
    threshold: 0,
    rootMargin: "-50% 0px -30% 0px",
    once: false,
  });

  const count = selected.size;

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    } catch {
      // Private browsing with storage disabled — the selector still works.
    }
  }, [selected]);

  // Pop the counter whenever it changes, so a tick at the top of a long list
  // is still visible in the bar pinned at the bottom.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setBump(true);
    const timer = setTimeout(() => setBump(false), 380);
    return () => clearTimeout(timer);
  }, [count]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function mailtoLink() {
    const chosen = SERVICES.filter((s) => selected.has(s.id))
      .map((s) => `- ${s.name}`)
      .join("\n");
    const body = `I'd like a quote for:\n${chosen}\n\nAbout the business:\n`;
    return `mailto:hello@goodwork.agency?subject=${encodeURIComponent(
      "Enquiry — service selection",
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="gw-section" id="configure">
      <div className="gw-container">
        <Reveal variant="rise">
          <p className="gw-label">What we offer</p>
          <h2 className="gw-h2 gw-stack-sm">Pick what you need</h2>
          <p className="gw-body gw-max-copy gw-text-muted gw-stack-sm">
            Everything we do, in plain English. Tick whatever's relevant and send it over — we'll
            come back with a scope and a fixed price for exactly that, and nothing you didn't ask
            for.
          </p>
        </Reveal>

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

        <div ref={listRef}>
        {CATEGORIES.map((cat) => {
          const items = SERVICES.filter((s) => s.category === cat && matchesFilter(s, filter));
          if (items.length === 0) return null;
          return (
            <div key={cat} className="gw-pick-group">
              <p className="gw-label" style={{ marginBottom: 10 }}>{cat}</p>
              <div className="gw-pick-list">
                {items.map((s, i) => {
                  const active = selected.has(s.id);
                  return (
                    <Reveal key={s.id} variant="rise" delay={Math.min(i * 60, 240)} asChild>
                      <label className={`gw-pick${active ? " gw-pick--active" : ""}`}>
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
                    </Reveal>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>

        <div
          className={`gw-total${count > 0 ? " gw-total--armed" : ""}`}
          data-gw-pinned={listEngaged ? "true" : "false"}
        >
          <div>
            <p className="gw-label gw-total__label" aria-live="polite">
              <span className={`gw-total__count${bump ? " gw-total__count--bump" : ""}`}>{count}</span>
              {" "}service{count === 1 ? "" : "s"} selected
            </p>
            <p className="gw-total__figures">
              {count > 0 ? "Send it over and we'll price it" : "Tick what you're interested in"}
            </p>
          </div>
          <div className="gw-total__actions">
            {count > 0 && (
              <button type="button" className="gw-total__clear" onClick={() => setSelected(new Set())}>
                Clear
              </button>
            )}
            <a
              href={mailtoLink()}
              className="gw-button gw-button--light"
              aria-disabled={count === 0}
              tabIndex={count === 0 ? -1 : undefined}
              data-gw-inactive={count === 0 ? "true" : undefined}
            >
              <span className="gw-button__label">Get a quote</span>
              <span className="gw-button__arrow" aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
