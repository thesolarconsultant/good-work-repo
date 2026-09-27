import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { track, EVENTS } from "../lib/analytics";

/**
 * Scroll to the top on navigation (but let the browser restore position on
 * back/forward), scroll to in-page anchors once the route has painted, and
 * emit a page_view intent event for whatever analytics provider is wired.
 */
export default function RouteManager() {
  const { pathname, hash, key, search } = useLocation();

  useEffect(() => {
    track(EVENTS.PAGE_VIEW, { path: pathname, search });
  }, [pathname, search]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.history.scrollRestoration) window.history.scrollRestoration = "auto";

    if (hash) {
      const id = hash.slice(1);
      let attempts = 0;
      const find = () => {
        const target = document.getElementById(id);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        } else if (attempts++ < 30) {
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
