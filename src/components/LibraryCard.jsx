import { Link } from "react-router-dom";
import LibraryPreview from "./LibraryPreview";
import { CATEGORY_NAME, STATUS_LABEL } from "../data/library";
import { track, EVENTS } from "../lib/analytics";

function TierBadge({ tier }) {
  return <span className={`gw-badge gw-badge--${tier}`}>Included in {tier === "studio" ? "Studio" : "Library"}</span>;
}

/**
 * One item in the grid. Live items mount a sandboxed preview as they scroll
 * into view; systems show a real screenshot where one exists; planned items
 * say "Coming soon" and never grow a download button.
 */
export default function LibraryCard({ item, eager = false }) {
  const detailTo = `/library/${item.slug}`;
  const live = item.status === "available" && (item.kind === "component" || item.kind === "section");

  return (
    <article className="gw-lib-card" aria-labelledby={`lib-${item.id}`}>
      <div className="gw-lib-card__preview">
        <div className="gw-lib-card__badges">
          <TierBadge tier={item.tier} />
          <span className={`gw-badge${item.status === "coming-soon" ? " gw-badge--warn" : item.status === "preview" ? " gw-badge--muted" : " gw-badge--ok"}`}>
            {STATUS_LABEL[item.status]}
          </span>
        </div>
        {live ? (
          <LibraryPreview id={item.id} name={item.name} eager={eager} />
        ) : item.image ? (
          <img src={item.image} alt={`${item.name} screenshot`} loading="lazy" decoding="async" />
        ) : (
          <div className="gw-lib-card__ph">{item.kind === "template" ? "Template" : "System"}</div>
        )}
      </div>
      <div className="gw-lib-card__body">
        <h3 className="gw-lib-card__name" id={`lib-${item.id}`}>
          <Link to={detailTo} onClick={() => track(EVENTS.LIBRARY_DETAIL, { item: item.slug, from: "card" })}>
            {item.name}
          </Link>
        </h3>
        <p className="gw-lib-card__desc">{item.description}</p>
        <div className="gw-lib-card__meta">
          <span>{CATEGORY_NAME[item.category]}</span>
          <span>{item.stack.slice(0, 3).join(" · ")}</span>
          <span>v{item.version}</span>
        </div>
      </div>
      <div className="gw-lib-card__actions">
        {item.status === "available" && item.href ? (
          <a className="gw-btn gw-btn--secondary gw-btn--sm" href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => track(EVENTS.LIBRARY_PREVIEW, { item: item.slug })}>
            Live preview
          </a>
        ) : live ? (
          <Link className="gw-btn gw-btn--secondary gw-btn--sm" to={`${detailTo}#preview`} onClick={() => track(EVENTS.LIBRARY_PREVIEW, { item: item.slug })}>
            Live preview
          </Link>
        ) : (
          <span className="gw-btn gw-btn--secondary gw-btn--sm" aria-disabled="true">
            {item.status === "coming-soon" ? "Coming soon" : "Preview"}
          </span>
        )}
        <Link className="gw-btn gw-btn--ghost gw-btn--sm" to={detailTo} onClick={() => track(EVENTS.LIBRARY_DETAIL, { item: item.slug, from: "button" })}>
          View details →
        </Link>
      </div>
    </article>
  );
}
