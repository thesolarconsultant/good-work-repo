import { useEffect, useRef } from "react";
import Button from "./Button";
import { CATEGORIES } from "../data/library";

const TYPES = [
  { id: "", name: "All" },
  { id: "component", name: "Components" },
  { id: "template", name: "Templates" },
  { id: "system", name: "Systems" },
];

function Chip({ on, onClick, children, n }) {
  return (
    <button type="button" className={`gw-chip${on ? " gw-chip--on" : ""}`} aria-pressed={on} onClick={onClick}>
      {children}
      {n != null && <span className="gw-chip__n">{n}</span>}
    </button>
  );
}

/**
 * Search, a type switch and the category chips. "/" focuses the search from
 * anywhere on the page. On a phone the category chips scroll sideways in one
 * line, and the sidebar is one tap away behind "Browse the Library".
 */
export default function LibraryFilters({ filters, setFilter, reset, counts, total, shown }) {
  const input = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      input.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const active = Boolean(filters.q || filters.category || filters.kind || filters.tier || filters.stack);
  const typeCount = (id) => (id ? counts.kind[id] || 0 : counts.all);

  return (
    <div className="gw-lib-toolbar">
      <div className="gw-lib-toolbar__top">
        <label className="gw-lib-search">
          <span className="gw-sr-only">Search the Library</span>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <input ref={input} className="gw-input" type="search" placeholder="Search components, sections, templates…" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} autoComplete="off" />
          {!filters.q && (
            <kbd className="gw-kbd" aria-hidden="true">
              /
            </kbd>
          )}
        </label>
        <span className="gw-lib-count" aria-live="polite">
          {shown} of {total}
        </span>
        {active && (
          <Button variant="ghost" size="sm" onClick={reset}>
            Clear
          </Button>
        )}
      </div>
      <div className="gw-lib-chips" role="group" aria-label="Type">
        {TYPES.map((t) => (
          <Chip key={t.id || "all"} on={(filters.kind || "") === t.id} onClick={() => setFilter("kind", t.id)} n={typeCount(t.id)}>
            {t.name}
          </Chip>
        ))}
      </div>
      <div className="gw-lib-chips gw-lib-chips--scroll" role="group" aria-label="Category">
        <Chip on={!filters.category} onClick={() => setFilter("category", "")}>
          Every category
        </Chip>
        {CATEGORIES.map((c) => {
          const n = counts.category[c.id] || 0;
          if (!n && filters.category !== c.id) return null;
          return (
            <Chip key={c.id} on={filters.category === c.id} onClick={() => setFilter("category", filters.category === c.id ? "" : c.id)} n={n}>
              {c.name}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
