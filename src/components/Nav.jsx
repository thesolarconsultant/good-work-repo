import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PRIMARY_NAV, NAV_CTA, NAV_SIGN_IN, PRODUCTS_MENU, SERVICES_MENU } from "../data/nav";
import { WORDMARK, CONTACT_EMAIL } from "../lib/site";
import { useScrollDirection } from "../lib/motion";

function Chevron() {
  return (
    <svg className="gw-nav__chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M2 3.5l3 3 3-3" />
    </svg>
  );
}

/** A top-level item with a dropdown. Opens on hover or click, closes on Escape, outside click or navigation. */
function MenuItem({ item, active, openId, setOpenId }) {
  const open = openId === item.label;
  const ref = useRef(null);
  const timer = useRef(0);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      if (!ref.current?.contains(e.target)) setOpenId(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenId(null);
        ref.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpenId]);

  const enter = () => {
    clearTimeout(timer.current);
    setOpenId(item.label);
  };
  const leave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpenId((id) => (id === item.label ? null : id)), 140);
  };

  const menu = item.menu;
  const narrow = menu.items.length <= 4;

  return (
    <li className="gw-nav__item" ref={ref} onPointerEnter={enter} onPointerLeave={leave}>
      <button
        type="button"
        className={`gw-nav__link${active ? " gw-nav__link--active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={`gw-menu-${item.label}`}
        onClick={() => setOpenId(open ? null : item.label)}
      >
        {item.label}
        <Chevron />
      </button>
      {open && (
        <div id={`gw-menu-${item.label}`} className={`gw-menu${narrow ? " gw-menu--narrow" : ""}`} role="region" aria-label={`${item.label} menu`}>
          <p className="gw-menu__intro">{menu.intro}</p>
          <div className="gw-menu__grid">
            {menu.items.map((m) => (
              <Link key={m.to} to={m.to} className="gw-menu__link" onClick={() => setOpenId(null)}>
                <span className="gw-menu__label">{m.label}</span>
                <span className="gw-menu__note">{m.note}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

export default function Nav({ announce = false }) {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState(null);
  const { pathname } = useLocation();
  const { past, direction } = useScrollDirection();
  const toggleRef = useRef(null);
  const drawerRef = useRef(null);

  // Retract only once clear of the top, never while a menu is open.
  const hidden = !open && openId == null && past && direction === "down";

  useEffect(() => {
    setOpen(false);
    setOpenId(null);
  }, [pathname]);

  // Freeze and hide the page behind the drawer.
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

  useEffect(
    () => () => {
      document.body.dataset.gwLocked = "false";
      const main = document.getElementById("gw-main");
      if (main) main.inert = false;
    },
    [],
  );

  const isActive = (to) => {
    const base = to.split("?")[0];
    return base === "/" ? pathname === "/" : pathname === base || pathname.startsWith(`${base}/`);
  };
  const productsActive = PRODUCTS_MENU.items.some((m) => isActive(m.to)) || isActive("/library") || isActive("/studio");
  const servicesActive = SERVICES_MENU.items.some((m) => isActive(m.to)) || isActive("/services");

  const navClass = ["gw-nav", announce && "gw-nav--announce", hidden && "gw-nav--hidden"].filter(Boolean).join(" ");

  return (
    <>
      <nav className={navClass} aria-label="Primary">
        <div className="gw-container gw-nav__inner">
          <Link to="/" className="gw-brand" aria-label="Goodwork, home">
            <span className="gw-brand__word">{WORDMARK}</span>
          </Link>

          <ul className="gw-nav__links" style={{ listStyle: "none" }}>
            {PRIMARY_NAV.map((item) => {
              const active = item.menu ? (item.label === "Library" ? productsActive : servicesActive) : isActive(item.to);
              if (item.menu) {
                return <MenuItem key={item.label} item={item} active={active} openId={openId} setOpenId={setOpenId} />;
              }
              return (
                <li key={item.to} className="gw-nav__item">
                  <Link to={item.to} className={`gw-nav__link${active ? " gw-nav__link--active" : ""}`} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="gw-nav__actions">
            <Link to={NAV_SIGN_IN.to} className="gw-nav__signin">
              {NAV_SIGN_IN.label}
            </Link>
            <Link to={NAV_CTA.to} className="gw-btn gw-btn--primary gw-btn--sm">
              {NAV_CTA.label}
            </Link>
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
        </div>
      </nav>

      {open && (
        <div id="gw-drawer" ref={drawerRef} className={`gw-drawer${announce ? " gw-drawer--announce" : ""}`} role="dialog" aria-modal="true" aria-label="Menu">
          {PRIMARY_NAV.map((item) => (
            <div key={item.label} className="gw-drawer__group">
              <Link to={item.to} className="gw-drawer__link" onClick={() => setOpen(false)}>
                {item.label}
                <span aria-hidden="true">→</span>
              </Link>
              {item.menu && (
                <div className="gw-drawer__sub">
                  {item.menu.items.map((m) => (
                    <Link key={m.to} to={m.to} className="gw-drawer__sublink" onClick={() => setOpen(false)}>
                      {m.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="gw-drawer__actions">
            <Link to={NAV_CTA.to} className="gw-btn gw-btn--primary gw-btn--lg" onClick={() => setOpen(false)}>
              {NAV_CTA.label}
            </Link>
            <Link to={NAV_SIGN_IN.to} className="gw-btn gw-btn--secondary" onClick={() => setOpen(false)}>
              {NAV_SIGN_IN.label}
            </Link>
            <Link to="/contact" className="gw-btn gw-btn--ghost" onClick={() => setOpen(false)}>
              Talk to Goodwork
            </Link>
          </div>
          <p className="gw-drawer__meta">
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </div>
      )}
    </>
  );
}
