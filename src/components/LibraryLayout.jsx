import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import LibrarySidebar from "./LibrarySidebar";

/**
 * The docs layout every Library page shares: a sticky sidebar on the left,
 * the page in the middle and, when a page passes one, a right-hand rail
 * (on-this-page links and the access card). Below 900px the sidebar becomes
 * a sheet behind a "Browse the Library" button; below 1280px the rail folds
 * away and its content lives in the page.
 */
export default function LibraryLayout({ children, rail, currentSlug }) {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();

  // Close the sheet on navigation, lock scroll while it is open.
  useEffect(() => setOpen(false), [pathname, search]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.dataset.gwLocked = "true";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.dataset.gwLocked = "false";
    };
  }, [open]);

  return (
    <div className={`gw-docs${rail ? " gw-docs--rail" : ""}`}>
      <aside className="gw-docs__side">
        <LibrarySidebar currentSlug={currentSlug} />
      </aside>

      <div className="gw-docs__main">
        <div className="gw-docs__browse">
          <button type="button" className="gw-docs__browse-btn" onClick={() => setOpen(true)} aria-haspopup="dialog">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h9" strokeLinecap="round" />
            </svg>
            Browse the Library
          </button>
        </div>
        {children}
      </div>

      {rail && <aside className="gw-docs__rail">{rail}</aside>}

      {open &&
        createPortal(
          <div className="gw-sheet gw-sheet--side" role="dialog" aria-modal="true" aria-label="Browse the Library" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div className="gw-sheet__panel gw-sheet__panel--side">
              <div className="gw-sheet__head">
                <p className="gw-h4">Library</p>
                <button type="button" className="gw-btn gw-btn--ghost gw-btn--sm" onClick={() => setOpen(false)} aria-label="Close the Library menu">
                  <span>Close</span>
                </button>
              </div>
              <LibrarySidebar currentSlug={currentSlug} onNavigate={() => setOpen(false)} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
