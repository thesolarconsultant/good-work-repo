import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Two things a single-page site gets wrong by default:
 *
 * 1. Navigating keeps your old scroll position, so you land halfway down a
 *    new page.
 * 2. A link to /case-studies#8energy doesn't actually go to #8energy, because
 *    the target hasn't rendered yet when the browser looks for it.
 *
 * This fixes both, and leaves back/forward alone so the browser can restore
 * position itself.
 */
export default function RouteManager() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Let the browser handle restoration on back/forward.
    if (window.history.scrollRestoration) {
      window.history.scrollRestoration = "auto";
    }

    if (hash) {
      // Wait for the route's content to paint before hunting for the anchor.
      const id = hash.slice(1);
      let attempts = 0;
      const find = () => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // Anchors aren't focusable by default; make this one focusable once
          // so keyboard users continue from where they were sent.
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        } else if (attempts++ < 20) {
          requestAnimationFrame(find);
        }
      };
      requestAnimationFrame(find);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash, key]);

  return null;
}
