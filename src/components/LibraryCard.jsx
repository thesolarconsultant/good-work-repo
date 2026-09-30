import { Link } from "react-router-dom";
import LibraryPreview, { PagePreview } from "./LibraryPreview";
import { SystemArt, PlannedArt } from "./LibraryArt";
import { CATEGORY_NAME, isLive, stackLabel } from "../data/library";
import { track, EVENTS } from "../lib/analytics";

/**
 * One item in a grid: the live preview on top, the name and one line under
 * it. The preview stays interactive (hover effects work in the grid); the
 * text area is the link. Only exceptions get a badge: Studio items and
 * planned ones.
 */
export default function LibraryCard({ item, eager = false }) {
  const to = `/library/${item.slug}`;
  const live = isLive(item);
  const flag = item.status === "coming-soon" ? { label: "Coming soon", tone: "warn" } : item.tier === "studio" ? { label: "Studio", tone: "studio" } : null;

  return (
    <article className="gw-lib-card" aria-labelledby={`lib-${item.id}`}>
      <div className="gw-lib-card__preview">
        {live ? (
          <LibraryPreview id={item.id} name={item.name} eager={eager} />
        ) : item.href && item.status === "available" ? (
          <PagePreview src={item.href} name={item.name} eager={eager} />
        ) : item.image ? (
          <img src={item.image} alt="" loading="lazy" decoding="async" />
        ) : item.kind === "system" ? (
          <SystemArt item={item} />
        ) : (
          <PlannedArt />
        )}
        {flag && <span className={`gw-badge gw-badge--${flag.tone} gw-lib-card__flag`}>{flag.label}</span>}
      </div>
      <div className="gw-lib-card__body">
        <h3 className="gw-lib-card__name" id={`lib-${item.id}`}>
          <Link to={to} onClick={() => track(EVENTS.LIBRARY_DETAIL, { item: item.slug, from: "card" })}>
            {item.name}
          </Link>
          <span className="gw-lib-card__go" aria-hidden="true">
            →
          </span>
        </h3>
        <p className="gw-lib-card__desc">{item.description}</p>
        <p className="gw-lib-card__meta">
          <span>{CATEGORY_NAME[item.category]}</span>
          <span>{stackLabel(item)}</span>
        </p>
      </div>
    </article>
  );
}
