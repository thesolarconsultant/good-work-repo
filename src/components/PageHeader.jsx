import { Link } from "react-router-dom";
import Headline from "./Headline";
import Reveal from "./Reveal";
import ShaderField from "./ShaderField";
import { withDot } from "../lib/withDot";

/**
 * The header block every inner page opens with, in the original site's style:
 * a soft four-colour aurora behind (plus the live WebGL field when `shader`
 * is set), breadcrumbs, a pulsing eyebrow, the headline with its coral full
 * stop, a lead and actions. `aside` renders on the right on wide screens.
 */
export default function PageHeader({ crumbs, eyebrow, title, lines, lead, children, aside, shader = false, className = "" }) {
  const all = lines || [title];
  const shown = all.map((l, i) => (i === all.length - 1 ? withDot(l) : l));
  return (
    <header className={`gw-pagehead gw-aurora-host ${className}`.trim()}>
      <div className="gw-aurora" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
      {shader && <ShaderField />}
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
          <div style={{ maxWidth: 860 }}>
            {eyebrow && <p className="gw-eyebrow gw-pulse">{eyebrow}</p>}
            <Headline onMount as="h1" className="gw-h1 gw-mt-2" lines={shown} />
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
