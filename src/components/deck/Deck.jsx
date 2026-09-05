import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "../../lib/motion";
import Seo from "../Seo";

// =====================================================================
// Deck.jsx — a lightweight, presenter-led slide engine, built to drive
// live in a meeting (laptop, screen-share, or tablet).
//
// Navigate with:
//   → / Space / PageDown / click-right   → next
//   ← / PageUp / click-left              → previous
//   Home / End                           → first / last
//   F                                    → toggle fullscreen
// Touch: swipe left/right. Progress dots are clickable.
//
// `slides` is an array of { content: <JSX>, label?: string,
// noClickAdvance?: boolean }. A slide with an interactive control (a button,
// a link) sets noClickAdvance so a stray click never skips it.
//
// No animation library: the cross-dissolve between slides is a genuine
// two-slide transition — the outgoing slide is kept mounted just long enough
// to animate out while the incoming one animates in over it — done in plain
// CSS keyframes, no framer-motion. prefers-reduced-motion drops both slides
// straight to their end state with no transition at all.
// =====================================================================

// Matches deck.css's out/in keyframe duration, plus a small buffer so the
// outgoing slide never gets yanked out mid-animation.
const TRANSITION_MS = 520;

// Targets that should never trigger click/space advance.
const INTERACTIVE = "a,button,input,textarea,select,label,form,[data-no-advance]";

export default function Deck({ slides, title, description }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  // The slide animating out, kept mounted only for the transition's length.
  const [outgoing, setOutgoing] = useState(null);
  const containerRef = useRef(null);
  const touchX = useRef(null);
  const outgoingTimer = useRef(null);
  const reduced = usePrefersReducedMotion();
  const last = slides.length - 1;

  useEffect(() => () => clearTimeout(outgoingTimer.current), []);

  const go = useCallback(
    (to) => {
      const clamped = Math.min(Math.max(to, 0), last);
      setIndex((current) => {
        if (clamped === current) return current;
        setDirection(clamped > current ? 1 : -1);
        if (!reduced) {
          setOutgoing({ idx: current, dir: clamped > current ? 1 : -1 });
          clearTimeout(outgoingTimer.current);
          outgoingTimer.current = setTimeout(() => setOutgoing(null), TRANSITION_MS);
        }
        return clamped;
      });
    },
    [last, reduced]
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      const inField =
        e.target instanceof HTMLElement && e.target.closest("input,textarea,select,[contenteditable]");
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case " ":
          if (inField) return;
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          prev();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(last);
          break;
        case "f":
        case "F":
          if (inField) return;
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, go, last, toggleFullscreen]);

  const onClick = (e) => {
    if (slides[index].noClickAdvance) return;
    if (e.target.closest(INTERACTIVE)) return;
    // Left ~18% goes back, the rest advances — mirrors a clicker's two buttons.
    if (e.clientX < window.innerWidth * 0.18) prev();
    else next();
  };

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) next();
      else prev();
    }
    touchX.current = null;
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      className="gw-deck gw-dark"
    >
      <Seo title={title} description={description} noindex />

      <div className="gw-deck__glow" aria-hidden="true" />
      <div className="gw-deck__grain" aria-hidden="true" />

      <div className="gw-deck__chrome">
        <Link to="/" data-no-advance className="gw-deck__brand">
          <span className="gw-deck__brand-word">GOOD WORK.</span>
        </Link>
        <div className="gw-deck__chrome-right">
          <span className="gw-deck__count">
            {index + 1} / {slides.length}
          </span>
          <button
            type="button"
            data-no-advance
            onClick={toggleFullscreen}
            aria-label="Toggle fullscreen"
            className="gw-deck__icon-btn"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="gw-deck__stage">
        {outgoing && (
          <div
            key={`out-${outgoing.idx}`}
            className="gw-deck__slide gw-deck__slide--out"
            data-gw-deck-anim={outgoing.dir > 0 ? "out-fwd" : "out-back"}
          >
            <div className="gw-deck__slide-inner">{slides[outgoing.idx].content}</div>
          </div>
        )}
        <div
          key={index}
          className="gw-deck__slide gw-deck__slide--in"
          data-gw-deck-anim={reduced ? "off" : direction > 0 ? "in-fwd" : "in-back"}
        >
          <div className="gw-deck__slide-inner">{slides[index].content}</div>
        </div>
      </div>

      <button
        type="button"
        data-no-advance
        onClick={prev}
        disabled={index === 0}
        aria-label="Previous slide"
        className="gw-deck__edge gw-deck__edge--prev"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        data-no-advance
        onClick={next}
        disabled={index === last}
        aria-label="Next slide"
        className="gw-deck__edge gw-deck__edge--next"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="gw-deck__dots">
        {slides.map((s, i) => (
          <button
            key={i}
            type="button"
            data-no-advance
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}${s.label ? `: ${s.label}` : ""}`}
            aria-current={i === index}
            className={`gw-deck__dot${i === index ? " on" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
