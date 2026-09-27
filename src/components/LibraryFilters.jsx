import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";
import { CATEGORIES, TIERS, KINDS } from "../data/library";

function ChipRow({ label, options, value, onChange, counts, allLabel = "All" }) {
  return (
    <div className="gw-lib-row" role="group" aria-label={label}>
      <span className="gw-lib-row__label">{label}</span>
      <button type="button" className={`gw-chip${!value ? " gw-chip--on" : ""}`} aria-pressed={!value} onClick={() => onChange("")}>
        {allLabel}
      </button>
      {options.map((o) => {
        const n = counts?.[o.id] ?? 0;
        if (counts && n === 0 && value !== o.id) return null;
        return (
          <button key={o.id} type="button" className={`gw-chip${value === o.id ? " gw-chip--on" : ""}`} aria-pressed={value === o.id} onClick={() => onChange(value === o.id ? "" : o.id)}>
            {o.name}
            {counts && <span className="gw-chip__n">{n}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Search plus three chip rows on wide screens; on a phone the rows move into
 * an accessible bottom sheet so the grid stays reachable.
 */
export default function LibraryFilters({ filters, setFilter, reset, counts, total, shown }) {
  const [sheet, setSheet] = useState(false);
  const active = ["category", "tier", "kind"].filter((k) => filters[k]).length;

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e) => e.key === "Escape" && setSheet(false);
    document.addEventListener("keydown", onKey);
    document.body.dataset.gwLocked = "true";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.dataset.gwLocked = "false";
    };
  }, [sheet]);

  const rows = (
    <>
      <ChipRow label="Type" options={KINDS} value={filters.kind} onChange={(v) => setFilter("kind", v)} counts={counts.kind} />
      <ChipRow label="Tier" options={TIERS.map((t) => ({ id: t.id, name: `${t.name} · ${t.price}` }))} value={filters.tier} onChange={(v) => setFilter("tier", v)} counts={counts.tier} allLabel="Both" />
      <ChipRow label="Category" options={CATEGORIES} value={filters.category} onChange={(v) => setFilter("category", v)} counts={counts.category} />
    </>
  );

  return (
    <div className="gw-lib-toolbar">
      <div className="gw-lib-row" style={{ justifyContent: "space-between" }}>
        <label className="gw-lib-search" style={{ flex: "1 1 280px", maxWidth: 520 }}>
          <span className="gw-sr-only">Search the library</span>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l4 4" />
          </svg>
          <input className="gw-input" type="search" placeholder="Search components, sections, templates…" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} autoComplete="off" />
        </label>
        <div className="gw-lib-row">
          <span className="gw-lib-count" aria-live="polite">
            {shown} of {total}
          </span>
          <Button variant="secondary" size="sm" className="gw-lib-filters__open" onClick={() => setSheet(true)} aria-haspopup="dialog">
            Filters{active ? ` (${active})` : ""}
          </Button>
          {(active || filters.q) && (
            <Button variant="ghost" size="sm" onClick={reset}>
              Clear
            </Button>
          )}
        </div>
      </div>
      <div className="gw-lib-filters--desktop">{rows}</div>

      {sheet &&
        createPortal(
        <div className="gw-sheet" role="dialog" aria-modal="true" aria-label="Filters" onClick={(e) => e.target === e.currentTarget && setSheet(false)}>
          <div className="gw-sheet__panel">
            <div className="gw-sheet__head">
              <h2 className="gw-h3">Filters</h2>
              <Button variant="ghost" size="sm" onClick={() => setSheet(false)} aria-label="Close filters">
                Close
              </Button>
            </div>
            {rows}
            <div className="gw-sheet__foot">
              <Button variant="secondary" onClick={reset}>
                Clear all
              </Button>
              <Button variant="primary" onClick={() => setSheet(false)} style={{ flex: 1 }}>
                Show {shown} items
              </Button>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
