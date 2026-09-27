import { Link } from "react-router-dom";
import { FOOTER_COLUMNS } from "../data/nav";
import { WORDMARK, CONTACT_EMAIL, TAGLINE } from "../lib/site";
import { OWNERSHIP_PRINCIPLE } from "../data/offers";

export default function Footer() {
  return (
    <footer className="gw-footer">
      <div className="gw-container">
        <div className="gw-footer__top">
          <div className="gw-footer__brand">
            <Link to="/" className="gw-brand" aria-label="Goodwork, home">
              <span className="gw-brand__word">{WORDMARK}</span>
            </Link>
            <p className="gw-h4">{TAGLINE}</p>
            <p className="gw-small gw-muted gw-max-sm">
              Production-ready websites, AI agents and business systems. Use the tools yourself, or let
              Goodwork build the complete operation for you.
            </p>
            <p className="gw-small gw-muted gw-max-sm">{OWNERSHIP_PRINCIPLE}</p>
            <p className="gw-small">
              <a className="gw-link" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="gw-footer__col">
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="gw-footer__bottom">
          <p>© {new Date().getFullYear()} Goodwork. All prices in GBP. One-time fees are paid once; managed plans are per month and optional.</p>
          <p>
            <Link to="/legal/licence">Commercial licence</Link> · <Link to="/legal/privacy">Privacy</Link> ·{" "}
            <Link to="/legal/terms">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
