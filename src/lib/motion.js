// =========================================================
// GOOD WORK. — MOTION PRIMITIVES
//
// Everything here is dependency-free on purpose. An agency site
// should not ship 40kB of animation runtime to fade a heading in.
// It's IntersectionObserver + CSS transforms, driven by a handful
// of hooks, and it all switches off under prefers-reduced-motion.
// =========================================================

import { useCallback, useEffect, useRef, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** True when the visitor has asked their OS to calm animation down. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia(QUERY).matches
      : false,
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
 * Fires once by default — content that re-animates every time you scroll past
 * it reads as a gimmick rather than a flourish.
 */
export function useInView({ threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (or a bot/old browser): show everything immediately.
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
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/**
 * Splits a stat like "~1 min" or "100%" into the bit we can animate and the
 * bits we have to keep verbatim, so the count-up never mangles the copy.
 */
export function parseFigure(figure) {
  const match = String(figure).match(/^(\D*?)([\d.,]+)(.*)$/s);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  const value = Number(digits.replace(/,/g, ""));
  if (!Number.isFinite(value)) return null;
  return { prefix, value, suffix, decimals: (digits.split(".")[1] || "").length };
}

/**
 * Counts a number up once it scrolls into view. Uses rAF with an eased curve
 * so it decelerates into the final value instead of ticking linearly.
 */
export function useCountUp(figure, { duration = 1400, enabled = true } = {}) {
  const parsed = parseFigure(figure);
  const [ref, inView] = useInView({ threshold: 0.4 });
  const [display, setDisplay] = useState(() => (parsed && enabled ? null : figure));

  useEffect(() => {
    if (!parsed || !enabled) {
      setDisplay(figure);
      return;
    }
    if (!inView) {
      // Hold at zero until it's on screen, so the count is always seen.
      setDisplay(`${parsed.prefix}${(0).toFixed(parsed.decimals)}${parsed.suffix}`);
      return;
    }

    let frame;
    let start;
    const tick = (now) => {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = parsed.value * eased;
      setDisplay(
        `${parsed.prefix}${current.toFixed(parsed.decimals)}${parsed.suffix}`,
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // `parsed` is derived from `figure` each render, so tracking figure is enough.
    // oxlint-disable-next-line exhaustive-deps
  }, [figure, inView, duration, enabled]);

  return [ref, display ?? figure, inView];
}

/**
 * Tracks the pointer over an element and writes its position to CSS custom
 * properties, so the glow/spotlight effects stay in CSS where they belong.
 * Skipped entirely on touch devices — there's no cursor to follow.
 */
export function usePointerGlow(enabled = true) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onPointerMove = useCallback(
    (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      const node = ref.current;
      if (!node) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        node.style.setProperty("--gw-glow-x", `${event.clientX - rect.left}px`);
        node.style.setProperty("--gw-glow-y", `${event.clientY - rect.top}px`);
        node.style.setProperty("--gw-glow-opacity", "1");
      });
    },
    [enabled],
  );

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    ref.current?.style.setProperty("--gw-glow-opacity", "0");
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { ref, onPointerMove, onPointerLeave };
}

/**
 * Magnetic hover: the element leans a few pixels towards the cursor and snaps
 * back on exit. Deliberately subtle — 2026, not 2014.
 */
export function useMagnetic({ strength = 0.28, max = 10, enabled = true } = {}) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onPointerMove = useCallback(
    (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      const node = ref.current;
      if (!node) return;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const clamp = (n) => Math.max(-max, Math.min(max, n * strength));
        node.style.setProperty("--gw-magnet-x", `${clamp(dx)}px`);
        node.style.setProperty("--gw-magnet-y", `${clamp(dy)}px`);
      });
    },
    [strength, max, enabled],
  );

  const onPointerLeave = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--gw-magnet-x", "0px");
    node.style.setProperty("--gw-magnet-y", "0px");
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { ref, onPointerMove, onPointerLeave };
}

/**
 * Reading progress, written straight to the returned element's transform.
 * Deliberately not React state — this updates every scroll frame, and
 * re-rendering a component 60 times a second to move a 3px bar is silly.
 */
export function useScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const node = ref.current;
      if (!node) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      node.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return ref;
}

/**
 * Coarse scroll state for the nav: has the page moved at all, are we past the
 * hero, and which way are we going. Returns booleans that change a handful of
 * times per page rather than a pixel value that changes every frame, so the
 * nav re-renders on transitions only.
 */
export function useScrollDirection({ threshold = 280 } = {}) {
  const [state, setState] = useState({ scrolled: false, past: false, direction: "up" });

  useEffect(() => {
    let frame = 0;
    let lastY = window.scrollY;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      // A few pixels of deadzone stops the nav flickering on trackpad jitter.
      const direction = Math.abs(delta) < 6 ? null : delta > 0 ? "down" : "up";
      if (direction) lastY = y;

      setState((prev) => {
        const next = {
          scrolled: y > 12,
          past: y > threshold,
          direction: direction ?? prev.direction,
        };
        return prev.scrolled === next.scrolled &&
          prev.past === next.past &&
          prev.direction === next.direction
          ? prev
          : next;
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
 * Gentle parallax driven by the element's own position in the viewport.
 * Writes a CSS variable rather than restyling from JS on every frame.
 */
export function useParallax({ distance = 28, enabled = true } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    let frame = 0;
    let visible = false;

    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      // -1 when the element is below the fold, +1 when it's above it.
      const centre = (rect.top + rect.height / 2 - window.innerHeight / 2) / window.innerHeight;
      node.style.setProperty("--gw-parallax", `${(-centre * distance).toFixed(2)}px`);
    };

    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };

    // Only listen while the element is anywhere near the viewport.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) update();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    observer.observe(node);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [distance, enabled]);

  return ref;
}
