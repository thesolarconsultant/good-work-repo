import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useScrollDirection } from "../lib/motion";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/case-studies", label: "Case studies" },
  { to: "/content-console", label: "Content Console" },
  { to: "/services", label: "Services" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { scrolled, past, direction } = useScrollDirection();
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  // Only retract once we're clear of the hero, and never while the menu is open.
  const hidden = !open && past && direction === "down";

  // Any navigation closes the menu.
  useEffect(() => setOpen(false), [pathname]);

  // Freeze and hide the page behind the drawer: no background scroll, and
  // nothing back there stays reachable by keyboard or screen reader.
  useEffect(() => {
    const main = document.getElementById("gw-main");
    document.body.dataset.gwLocked = open ? "true" : "false";
    if (main) main.inert = open;

    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    drawerRef.current?.querySelector("a")?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    return () => {
      document.body.dataset.gwLocked = "false";
      const main = document.getElementById("gw-main");
      if (main) main.inert = false;
    };
  }, []);

  const navClass = [
    "gw-nav",
    scrolled && "gw-nav--scrolled",
    hidden && "gw-nav--hidden",
  ]
    .filter(Boolean)
    .join(" ");

  const isActive = (to) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <>
      <nav className={navClass} aria-label="Primary">
        <div className="gw-container gw-nav__inner">
          <Link to="/" className="gw-logo" aria-label="GOOD WORK., creative agency — home">
            <p className="gw-logo__wordmark">GOOD WORK.</p>
            {/* Sentence case in the markup, uppercased in CSS — screen readers
                can spell out a genuinely capitalised string letter by letter. */}
            <span className="gw-logo__descriptor">Creative agency</span>
          </Link>

          <div className="gw-nav__links gw-nav__links--desktop">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`gw-nav__link${isActive(l.to) ? " gw-nav__link--active" : ""}`}
                aria-current={isActive(l.to) ? "page" : undefined}
              >
                {l.label}
              </Link>
            ))}
            <Link to="/contact" className="gw-nav__cta">
              Start a project →
            </Link>
          </div>

          <button
            ref={toggleRef}
            className="gw-nav__toggle"
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="gw-drawer"
            onClick={() => setOpen((o) => !o)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      <div
        id="gw-drawer"
        ref={drawerRef}
        className={`gw-drawer${open ? " gw-drawer--open" : ""}`}
      >
        {LINKS.concat({ to: "/contact", label: "Contact" }).map((l, i) => (
          <Link
            key={l.to}
            to={l.to}
            className={`gw-drawer__link${isActive(l.to) ? " gw-drawer__link--active" : ""}`}
            aria-current={isActive(l.to) ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            {l.label}
            <span className="gw-drawer__index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
          </Link>
        ))}
        <div className="gw-drawer__foot">
          <p className="gw-label">Get in touch</p>
          <a className="gw-body" href="mailto:hello@goodwork.agency">
            hello@goodwork.agency
          </a>
        </div>
      </div>
    </>
  );
}
