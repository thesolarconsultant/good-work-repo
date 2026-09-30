// =========================================================
// Motion primitives — dependency-free on purpose.
// IntersectionObserver + CSS transforms, driven by a few hooks, and all of it
// switches off under prefers-reduced-motion.
// =========================================================

import { useEffect, useRef, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor has asked their OS to calm animation down. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia ? window.matchMedia(QUERY).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Reveal-on-scroll. Returns a ref to attach and whether it has entered view.
 * Fires once by default.
 */
export function useInView({ threshold = 0.12, rootMargin = "0px 0px -8% 0px", once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);

    // Safety net: content must never stay hidden because a callback was
    // delayed (background tab, print, a full-page capture). If the element is
    // already within the viewport's height after a moment and still hasn't
    // been marked visible, mark it.
    const fallback = setTimeout(() => {
      const rect = node.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.2) setInView(true);
    }, 1800);

    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/**
 * Coarse scroll state for the nav: has the page moved, are we past the hero,
 * which way are we going. Changes a handful of times per page, not per frame.
 */
export function useScrollDirection({ threshold = 240 } = {}) {
  const [state, setState] = useState({ scrolled: false, past: false, direction: "up" });

  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;
    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      const direction = Math.abs(delta) < 6 ? null : delta > 0 ? "down" : "up";
      if (direction) lastY = y;
      setState((prev) => {
        const next = { scrolled: y > 8, past: y > threshold, direction: direction ?? prev.direction };
        return prev.scrolled === next.scrolled && prev.past === next.past && prev.direction === next.direction ? prev : next;
      });
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  return state;
}

/**
 * The rendered size of a node, kept current with a ResizeObserver. Pass the
 * ref from useInView (or any ref) so one element carries both.
 */
export function useElementSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => {
      const r = node.getBoundingClientRect();
      setSize((prev) => (Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5 ? prev : { width: r.width, height: r.height }));
    };
    read();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}
