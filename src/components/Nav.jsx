import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/content-console", label: "Content Console" },
  { to: "/services", label: "Services" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <nav className="gw-nav">
      <div className="gw-container gw-nav__inner">
        <Link to="/" className="gw-logo">
          <p className="gw-logo__wordmark">GOOD WORK.</p>
        </Link>

        <div className="gw-nav__links gw-nav__links--desktop">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`gw-nav__link${pathname === l.to ? " gw-nav__link--active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
          <Link to="/contact" className="gw-nav__cta">Start a project →</Link>
        </div>

        <button
          className="gw-nav__toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <div className={`gw-nav__mobile${open ? " gw-nav__mobile--open" : ""}`}>
        {LINKS.map((l) => (
          <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <Link to="/contact" onClick={() => setOpen(false)}>Start a project →</Link>
      </div>
    </nav>
  );
}
