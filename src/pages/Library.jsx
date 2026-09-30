import { useCallback, useDeferredValue, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Seo from "../components/Seo";
import Button from "../components/Button";
import Price from "../components/Price";
import BuyButton from "../components/BuyButton";
import LibraryLayout from "../components/LibraryLayout";
import LibraryFilters from "../components/LibraryFilters";
import LibraryGrid, { LibrarySkeleton } from "../components/LibraryGrid";
import LibraryCard from "../components/LibraryCard";
import { ITEMS, FEATURED, LIBRARY_GROUPS, TEMPLATES, filterItems, countBy, CATEGORY_NAME } from "../data/library";
import { OFFER, LICENCE_PRINCIPLES, UPDATE_PERIOD_MONTHS } from "../data/offers";
import { itemList } from "../lib/schema";
import { track, EVENTS } from "../lib/analytics";
import { useSession } from "../lib/auth";
import { gbp, longDate } from "../lib/format";
import { SITE_URL } from "../lib/site";
import CATALOGUE from "../data/libraryCatalogue.json";

const KEYS = ["q", "category", "tier", "type", "stack"];
const COMPONENTS = CATALOGUE.length;
const UPDATED = CATALOGUE.reduce((d, i) => (i.updated > d ? i.updated : d), "");
const GROUP_LIMIT = 6;

export default function Library() {
  const session = useSession();
  const owns = session.status === "authenticated" && session.entitlements.some((e) => e.productId === "library" || e.productId === "studio");
  const download = owns ? session.downloads.find((d) => d.product === "library") : null;

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
  // the current search would then hide.
  const counts = useMemo(() => {
    const base = filterItems(ITEMS, { ...deferred, category: "", kind: "" });
    const kindPool = filterItems(base, { category: deferred.category });
    const kinds = countBy(kindPool, "kind");
    return {
      all: kindPool.length,
      category: countBy(filterItems(base, { kind: deferred.kind }), "category"),
      kind: { ...kinds, component: (kinds.component || 0) + (kinds.section || 0) },
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

  const title = filters.category
    ? `${CATEGORY_NAME[filters.category]} — Goodwork Library`
    : filters.kind === "template"
      ? "Website templates with source code"
      : filters.kind === "component"
        ? "Website component library"
        : "Goodwork Library";

  return (
    <>
      <Seo
        title={title}
        description="Browse the Goodwork Library: a website component library and quick-launch templates with responsive source code and live, sandboxed previews. One-time access, commercial use for finished client sites."
        schema={itemList("Goodwork Library", "/library", items.slice(0, 50).map((i) => ({ name: i.name, url: `${SITE_URL}/library/${i.slug}` })))}
      />

      <LibraryLayout>
        <header className="gw-docs-head">
          <nav aria-label="Breadcrumb">
            <ol className="gw-crumbs">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <span aria-current="page">Library</span>
              </li>
            </ol>
          </nav>
          <h1 className="gw-docs-title">Goodwork Library</h1>
          <p className="gw-docs-lead">
            {COMPONENTS} production-ready components and sections, the paste-and-go starter, and the Studio systems. Every preview here runs the exact code you download: copy it into
            any page, point it at your brand, ship.
          </p>
          <ul className="gw-docs-head__meta">
            <li>
              <Price amount={OFFER.library.price} billing="one-time" />
            </li>
            <li>{COMPONENTS} components</li>
            <li>Updated {longDate(UPDATED)}</li>
            <li>{UPDATE_PERIOD_MONTHS} months of updates</li>
          </ul>
          <div className="gw-actions gw-mt-3">
            {owns ? (
              <>
                {download && (
                  <Button href={download.href} download={download.filename} onClick={() => track(EVENTS.DOWNLOAD, { product: "library", from: "library" })}>
                    Download the bundle <span aria-hidden="true">↓</span>
                  </Button>
                )}
                <Button to="/dashboard" variant="secondary">
                  Your dashboard
                </Button>
              </>
            ) : (
              <>
                <Button href="#access" arrow>
                  Get Library Access
                </Button>
                <Button to="/login?next=/library" variant="secondary">
                  Sign in
                </Button>
              </>
            )}
          </div>
        </header>

        <LibraryFilters filters={filters} setFilter={setFilter} reset={reset} counts={counts} total={ITEMS.length} shown={items.length} />

        {anyFilter ? (
          <section className="gw-docs-section" aria-labelledby="results">
            <h2 className="gw-docs-h2" id="results" aria-live="polite">
              {items.length} {items.length === 1 ? "result" : "results"}
              {filters.category ? ` in ${CATEGORY_NAME[filters.category]}` : ""}
            </h2>
            {stale ? <LibrarySkeleton /> : <LibraryGrid items={items} onReset={reset} />}
          </section>
        ) : (
          <>
            <Group id="featured" title="Start here" lead="Pieces most sites begin with." items={FEATURED.slice(0, GROUP_LIMIT)} eager />
            {LIBRARY_GROUPS.map((g) => (g.id === "templates" ? <TemplatesGroup key={g.id} /> : <Group key={g.id} id={g.id} title={g.title} items={g.items} to={g.to} />))}
          </>
        )}

        <AccessPanel owns={owns} />
      </LibraryLayout>
    </>
  );
}

function Group({ id, title, lead, items, to, eager = false }) {
  const shown = items.slice(0, GROUP_LIMIT);
  return (
    <section className="gw-docs-section" aria-labelledby={`group-${id}`}>
      <div className="gw-docs-section__head">
        <h2 className="gw-docs-h2" id={`group-${id}`}>
          {title}
          <span className="gw-docs-h2__n">{items.length}</span>
        </h2>
        {to && items.length > shown.length && (
          <Link className="gw-more" to={to}>
            All {items.length} <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
      {lead && <p className="gw-docs-section__lead">{lead}</p>}
      <div className="gw-lib-grid">
        {shown.map((it, i) => (
          <LibraryCard key={it.id} item={it} eager={eager && i < 3} />
        ))}
      </div>
    </section>
  );
}

// The live starter, and the planned templates as a short honest list rather
// than a row of empty cards.
function TemplatesGroup() {
  const live = TEMPLATES.filter((t) => t.status === "available");
  const planned = TEMPLATES.filter((t) => t.status === "coming-soon");
  return (
    <section className="gw-docs-section" aria-labelledby="group-templates">
      <div className="gw-docs-section__head">
        <h2 className="gw-docs-h2" id="group-templates">
          Templates
          <span className="gw-docs-h2__n">{TEMPLATES.length}</span>
        </h2>
      </div>
      <div className="gw-lib-grid">
        {live.map((t) => (
          <LibraryCard key={t.id} item={t} />
        ))}
        {planned.length > 0 && (
          <div className="gw-planned">
            <p className="gw-eyebrow">On the way</p>
            <p className="gw-h4 gw-mt-1">Complete templates in progress</p>
            <p className="gw-small gw-body gw-mt-1">Built from the sections on this page. Not in the bundle yet, and not counted in what you pay for today.</p>
            <ul className="gw-planned__list">
              {planned.map((t) => (
                <li key={t.id}>
                  <Link to={`/library/${t.slug}`}>{t.name}</Link>
                  <span className="gw-badge gw-badge--warn">Coming soon</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function AccessPanel({ owns }) {
  return (
    <section className="gw-docs-access gw-light" id="access" aria-labelledby="access-title">
      <div className="gw-docs-access__main">
        <p className="gw-eyebrow gw-eyebrow--accent">Get access</p>
        <h2 className="gw-h2 gw-mt-2" id="access-title">
          One payment. Production-ready code.
        </h2>
        <p className="gw-body gw-mt-2">{OFFER.library.line}</p>
        <div className="gw-mt-3">
          <Price amount={OFFER.library.price} billing="one-time" size="lg" />
        </div>
        <div className="gw-mt-3">
          {owns ? (
            <Button to="/dashboard" size="lg" arrow>
              Open your dashboard
            </Button>
          ) : (
            <BuyButton productId="library" label={OFFER.library.primaryCta.label} />
          )}
        </div>
        <p className="gw-small gw-muted gw-mt-2">
          {owns ? (
            "You already have Library access."
          ) : (
            <>
              Already bought it? <Link className="gw-link" to="/login?next=/library">Sign in</Link>.
            </>
          )}{" "}
          Want the systems too?{" "}
          <Link className="gw-link" to="/studio">
            Goodwork Studio is {gbp(OFFER.studio.price)} one-time
          </Link>
          .
        </p>
      </div>
      <div className="gw-docs-access__lists">
        <div>
          <h3 className="gw-h4">What you get</h3>
          <ul className="gw-list gw-list--tight gw-mt-2">
            {OFFER.library.includes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="gw-h4">Not included</h3>
          <ul className="gw-list gw-list--x gw-list--tight gw-mt-2">
            {OFFER.library.excludes.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <h3 className="gw-h4 gw-mt-3">The licence in one breath</h3>
          <ul className="gw-list gw-list--tight gw-mt-2">
            {LICENCE_PRINCIPLES.slice(0, 4).map((x) => (
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
    </section>
  );
}
