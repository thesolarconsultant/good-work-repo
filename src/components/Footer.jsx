import { Link, useLocation } from "react-router-dom";
import Button from "./Button";
import { FOOTER_COLUMNS } from "../data/nav";
import { WORDMARK, DESCRIPTOR, CONTACT_EMAIL, TAGLINE } from "../lib/site";
import { OWNERSHIP_PRINCIPLE } from "../data/offers";
import { withDot } from "../lib/withDot";

// The line the footer opens with. Every page ends on a statement and a way
// forward, as the original site did.
const STATEMENTS = {
  "/": "Choose the fastest route to better work",
  "/services": "Make your business look as good as it actually is",
  "/library": "Build the next site from something that already works",
  "/studio": "Build the whole system yourself",
};
const DEFAULT_STATEMENT = "Got something worth making better";
const SUBLINES = {
  "/": "Start with the code, take the complete Studio toolkit or ask Goodwork to build the system with you.",
};

export default function Footer() {
  const { pathname } = useLocation();
  const statement = STATEMENTS[pathname] || (pathname.startsWith("/library/") ? STATEMENTS["/library"] : DEFAULT_STATEMENT);

  return (
    <footer className="gw-footer">
      <div className="gw-block__rule" aria-hidden="true" />
      <div className="gw-container">
        <div className="gw-footer__lead">
          <p className="gw-footer__statement">{withDot(`${statement}.`)}</p>
          {SUBLINES[pathname] && <p className="gw-lead gw-max">{SUBLINES[pathname]}</p>}
          <div className="gw-actions">
            <Button to="/pricing" arrow>
              Get access
            </Button>
            <Button to="/contact" variant="secondary">
              Talk to Goodwork
            </Button>
          </div>
        </div>
        <div className="gw-footer__top">
          <div className="gw-footer__brand">
            <Link to="/" className="gw-logo gw-logo--start" aria-label="Goodwork, home">
              <span className="gw-logo__wordmark">{WORDMARK}</span>
              <span className="gw-logo__descriptor">{DESCRIPTOR}</span>
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
          <p>© {new Date().getFullYear()} Goodwork. All prices in GBP, with no VAT added. One-time fees are paid once; managed plans are per month and optional.</p>
          <p>
            <Link to="/legal/licence">Commercial licence</Link> · <Link to="/legal/privacy">Privacy</Link> ·{" "}
            <Link to="/legal/terms">Terms</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
