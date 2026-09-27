import { Link } from "react-router-dom";
import Headline from "./Headline";
import Reveal from "./Reveal";

/**
 * The header block every inner page opens with: optional breadcrumbs, an
 * eyebrow, the headline, a lead and actions. `aside` renders on the right on
 * wide screens (a price block, a badge, a small summary).
 */
export default function PageHeader({ crumbs, eyebrow, title, lines, lead, children, aside, className = "" }) {
  return (
    <header className={`gw-pagehead ${className}`.trim()}>
      <div className="gw-container">
        {crumbs && (
          <nav aria-label="Breadcrumb">
            <ol className="gw-crumbs">
              {crumbs.map((c, i) => (
                <li key={c.to || c.label}>
                  {c.to && i < crumbs.length - 1 ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="gw-pagehead__row">
          <div style={{ maxWidth: 820 }}>
            {eyebrow && <p className="gw-eyebrow gw-eyebrow--accent">{eyebrow}</p>}
            <Headline onMount as="h1" className="gw-h1 gw-mt-2" lines={lines || [title]} />
            {lead && (
              <Reveal variant="rise" delay={140}>
                <p className="gw-lead gw-max gw-mt-3">{lead}</p>
              </Reveal>
            )}
            {children && (
              <Reveal variant="rise" delay={220}>
                <div className="gw-mt-4">{children}</div>
              </Reveal>
            )}
          </div>
          {aside && (
            <Reveal variant="rise" delay={180}>
              {aside}
            </Reveal>
          )}
        </div>
      </div>
    </header>
  );
}
