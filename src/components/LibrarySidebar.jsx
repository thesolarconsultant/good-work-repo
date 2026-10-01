import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { GETTING_STARTED, LIBRARY_GROUPS } from "../data/library";

/**
 * The Library's left-hand navigation: getting-started links, then every group
 * with every item in it, the way component-library docs are laid out. The
 * current item is highlighted and scrolled into view inside the sidebar (not
 * the page) on arrival.
 */
export default function LibrarySidebar({ currentSlug, onNavigate }) {
  const ref = useRef(null);
  const { pathname, search } = useLocation();
  const here = pathname + search;

  useEffect(() => {
    const box = ref.current;
    const active = box?.querySelector('[aria-current="page"]');
    const scroller = box?.closest(".gw-docs__side, .gw-sheet__panel");
    if (!active || !scroller) return;
    const top = active.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    if (top < scroller.scrollTop + 40 || top > scroller.scrollTop + scroller.clientHeight - 80) {
      scroller.scrollTop = Math.max(0, top - scroller.clientHeight / 3);
    }
  }, [currentSlug]);

  const link = (to, label, current, extra) => (
    <li key={to}>
      <Link to={to} className="gw-side__link" aria-current={current ? "page" : undefined} onClick={onNavigate}>
        <span>{label}</span>
        {extra}
      </Link>
    </li>
  );

  return (
    <nav ref={ref} className="gw-side" aria-label="Library">
      <div className="gw-side__group">
        <p className="gw-side__title">Getting started</p>
        <ul className="gw-side__list">{GETTING_STARTED.map((l) => link(l.to, l.label, l.to === "/library" ? here === "/library" : pathname === l.to))}</ul>
      </div>
      {LIBRARY_GROUPS.map((g) => (
        <div key={g.id} className="gw-side__group">
          <Link to={g.to} className="gw-side__title gw-side__title--link" aria-current={here === g.to ? "page" : undefined} onClick={onNavigate}>
            {g.title}
            <span className="gw-side__count">{g.items.length}</span>
          </Link>
          <ul className="gw-side__list">
            {g.items.map((it) =>
              link(
                `/library/${it.slug}`,
                it.name,
                it.slug === currentSlug,
                it.status === "coming-soon" ? <span className="gw-side__tag">Soon</span> : it.tier === "studio" ? <span className="gw-side__tag">Studio</span> : null,
              ),
            )}
          </ul>
        </div>
      ))}
    </nav>
  );
}
