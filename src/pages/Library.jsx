import { useCallback, useDeferredValue, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import PageHeader from "../components/PageHeader";
import Reveal from "../components/Reveal";
import Button from "../components/Button";
import Price from "../components/Price";
import LibraryFilters from "../components/LibraryFilters";
import LibraryGrid, { LibrarySkeleton } from "../components/LibraryGrid";
import LibraryCard from "../components/LibraryCard";
import { ITEMS, FEATURED, RECENT, filterItems, countBy, CATEGORY_NAME } from "../data/library";
import { OFFER, LICENCE_PRINCIPLES } from "../data/offers";
import { itemList } from "../lib/schema";
import { track, EVENTS } from "../lib/analytics";
import BuyButton from "../components/BuyButton";
import { Link } from "react-router-dom";

const KEYS = ["q", "category", "tier", "type", "stack"];

export default function Library() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(
    () => ({ q: params.get("q") || "", category: params.get("category") || "", tier: params.get("tier") || "", kind: params.get("type") || "", stack: params.get("stack") || "" }),
    [params],
  );
  const deferred = useDeferredValue(filters);
  const stale = deferred !== filters;
  const items = useMemo(() => filterItems(ITEMS, deferred), [deferred]);
  const anyFilter = KEYS.some((k) => params.get(k));

  // Counts reflect the other active filters, so a chip never promises items
  // that the current search would then hide.
  const counts = useMemo(() => {
    const base = filterItems(ITEMS, { ...deferred, category: "", tier: "", kind: "" });
    return {
      category: countBy(filterItems(base, { tier: deferred.tier, kind: deferred.kind }), "category"),
      tier: countBy(filterItems(base, { category: deferred.category, kind: deferred.kind }), "tier"),
      kind: (() => {
        const pool = filterItems(base, { category: deferred.category, tier: deferred.tier });
        const c = countBy(pool, "kind");
        return { ...c, component: (c.component || 0) + (c.section || 0) };
      })(),
    };
  }, [deferred]);

  const setFilter = useCallback(
    (key, value) => {
      const next = new URLSearchParams(params);
      const param = key === "kind" ? "type" : key;
      if (value) next.set(param, value);
      else next.delete(param);
      setParams(next, { replace: true });
      if (key !== "q") track(EVENTS.LIBRARY_FILTER, { [key]: value || "all" });
    },
    [params, setParams],
  );
  const reset = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams]);

  useEffect(() => {
    if (filters.q) {
      const t = setTimeout(() => track(EVENTS.LIBRARY_FILTER, { q: filters.q }), 800);
      return () => clearTimeout(t);
    }
  }, [filters.q]);

  const title = filters.category ? `${CATEGORY_NAME[filters.category]} — Goodwork Library` : filters.kind === "template" ? "Website templates with source code" : filters.kind === "component" ? "Website component library" : "Goodwork Library";

  return (
    <>
      <Seo
        title={title}
        description="Browse the Goodwork Library: a website component library and quick-launch templates with responsive source code and live, sandboxed previews. One-time access, commercial use for finished client sites."
        schema={itemList("Goodwork Library", "/library", items.slice(0, 50).map((i) => ({ name: i.name, url: `https://goodwork.agency/library/${i.slug}` })))}
      />

      <PageHeader
        crumbs={[{ label: "Home", to: "/" }, { label: "Library" }]}
        eyebrow="Goodwork Library"
        lines={["Production-ready code,", "previewed live."]}
        lead="Complete websites, individual sections and reusable business tools. Every component here renders in a sandboxed preview from the same code you receive. Filter it, open one, read what's included."
        aside={
          <div className="gw-card" style={{ minWidth: 280 }}>
            <p className="gw-eyebrow">Library access</p>
            <div className="gw-mt-2">
              <Price amount={OFFER.library.price} billing="one-time" />
            </div>
            <p className="gw-small gw-muted gw-mt-2">{ITEMS.filter((i) => i.tier === "library" && i.status === "available").length} live items today, updates for 12 months, commercial use for finished sites.</p>
            <div className="gw-actions gw-mt-3">
              <Button href="#access" size="sm" arrow>
                Get Library Access
              </Button>
              <Button to="/studio" variant="ghost" size="sm">
                Compare Studio
              </Button>
            </div>
          </div>
        }
      />

      <section className="gw-section--tight">
        <div className="gw-container">
          <LibraryFilters filters={filters} setFilter={setFilter} reset={reset} counts={counts} total={ITEMS.length} shown={items.length} />
        </div>
      </section>

      {!anyFilter && (
        <>
          <section className="gw-section--tight" aria-labelledby="featured">
            <div className="gw-container">
              <Reveal variant="rise">
                <p className="gw-eyebrow gw-eyebrow--accent">Featured</p>
                <h2 className="gw-h3 gw-mt-1" id="featured">
                  Where most people start
                </h2>
              </Reveal>
              <div className="gw-lib-grid gw-mt-3">
                {FEATURED.slice(0, 6).map((it, i) => (
                  <LibraryCard key={it.id} item={it} eager={i < 3} />
                ))}
              </div>
            </div>
          </section>
          <section className="gw-section--tight" aria-labelledby="recent">
            <div className="gw-container">
              <Reveal variant="rise">
                <p className="gw-eyebrow gw-eyebrow--accent">Recently added</p>
                <h2 className="gw-h3 gw-mt-1" id="recent">
                  Latest releases
                </h2>
              </Reveal>
              <div className="gw-lib-grid gw-mt-3">
                {RECENT.slice(0, 3).map((it) => (
                  <LibraryCard key={it.id} item={it} />
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <section className="gw-section--tight" aria-labelledby="all-items">
        <div className="gw-container">
          <Reveal variant="rise">
            <p className="gw-eyebrow gw-eyebrow--accent">{anyFilter ? "Results" : "Everything"}</p>
            <h2 className="gw-h3 gw-mt-1" id="all-items" aria-live="polite">
              {items.length} {items.length === 1 ? "item" : "items"}
              {filters.category ? ` in ${CATEGORY_NAME[filters.category]}` : ""}
            </h2>
          </Reveal>
          <div className="gw-mt-3">{stale ? <LibrarySkeleton /> : <LibraryGrid items={items} onReset={reset} />}</div>
        </div>
      </section>

      {/* Access: licence and exclusions are read before any payment starts. */}
      <section className="gw-section gw-light" id="access" aria-labelledby="access-title">
        <div className="gw-container">
          <div className="gw-split">
            <div>
              <p className="gw-eyebrow gw-eyebrow--accent">Get access</p>
              <h2 className="gw-h2 gw-mt-2" id="access-title">
                One payment. Production-ready code.
              </h2>
              <p className="gw-lead gw-max gw-mt-3">{OFFER.library.line}</p>
              <div className="gw-mt-4" style={{ maxWidth: 420 }}>
                <Price amount={OFFER.library.price} billing="one-time" size="lg" />
                <div className="gw-mt-3">
                  <BuyButton productId="library" label={OFFER.library.primaryCta.label} />
                </div>
                <p className="gw-small gw-muted gw-mt-2">
                  Already bought it? <Link className="gw-link" to="/login">Sign in</Link>. Want the systems too?{" "}
                  <Link className="gw-link" to="/studio">
                    Goodwork Studio is £888 one-time
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div style={{ display: "grid", gap: "1rem" }}>
              <div className="gw-card">
                <h3 className="gw-h4">What you get</h3>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  {OFFER.library.includes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="gw-card gw-card--flat">
                <h3 className="gw-h4">Not included</h3>
                <ul className="gw-list gw-list--x gw-list--tight gw-mt-2">
                  {OFFER.library.excludes.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
              <div className="gw-card gw-card--flat">
                <h3 className="gw-h4">The licence in one breath</h3>
                <ul className="gw-list gw-list--tight gw-mt-2">
                  {LICENCE_PRINCIPLES.slice(0, 5).map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
                <p className="gw-small gw-mt-2">
                  <Link className="gw-link" to="/legal/licence">
                    Read the full commercial licence
                  </Link>{" "}
                  and the{" "}
                  <Link className="gw-link" to="/legal/refunds">
                    refund policy
                  </Link>{" "}
                  before you buy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
