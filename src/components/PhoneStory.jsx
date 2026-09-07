import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../lib/motion";

const SCROLL_PER_MESSAGE = 220;

/**
 * A phone-screen conversation that plays out as you scroll — the same
 * sticky-pin-and-measure technique as HorizontalWork, just turned
 * vertical: the section is exactly as tall as it needs to be for one
 * message to reveal per SCROLL_PER_MESSAGE px, the phone stays pinned
 * for that whole distance, and nothing calls preventDefault or touches
 * the scrollbar.
 *
 * Below 780px, and under prefers-reduced-motion, it renders as a plain
 * static phone with every message already visible — a pinned section
 * that can't be scrolled past is worse than no animation at all.
 */
export default function PhoneStory({ kicker, title, intro, contact, subtitle, messages }) {
  const reduced = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(0);
  const sectionRef = useRef(null);
  const screenRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 780px)");
    const sync = () => setEnabled(mq.matches && !reduced);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;
    const section = sectionRef.current;
    if (!section) return;
    const pin = section.firstElementChild;

    let frame = 0;
    let visible = false;

    const measure = () => {
      section.style.height = `${pin.offsetHeight + messages.length * SCROLL_PER_MESSAGE}px`;
    };

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const total = rect.height - pin.offsetHeight;
      const scrolled = (parseFloat(getComputedStyle(pin).top) || 0) - rect.top;
      const t = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
      setActive(Math.min(messages.length - 1, Math.floor(t * messages.length)));
    };

    const onScroll = () => {
      if (visible && !frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      update();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) update();
      },
      { rootMargin: "50% 0px 50% 0px" },
    );
    observer.observe(section);

    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      section.style.height = "";
    };
  }, [enabled, messages.length]);

  // Follow the newest revealed bubble down the phone screen, the way a
  // real messaging app scrolls itself as replies come in. This scrolls
  // only the phone's own screen (screen.scrollTo), never the page —
  // scrollIntoView() was tried here first and rejected: it can escalate
  // to ancestor scrollers, including the window, which fights the very
  // page-scroll position this component reads to drive `active`.
  useEffect(() => {
    const screen = screenRef.current;
    const bubble = screen?.querySelectorAll(".gw-phonestory__bubble")[active];
    if (!screen || !bubble) return;
    const target = bubble.offsetTop + bubble.offsetHeight - screen.clientHeight + 24;
    screen.scrollTo({ top: Math.max(0, target), behavior: enabled ? "smooth" : "auto" });
  }, [active, enabled]);

  const phone = (
    <div className="gw-phonestory__phone">
      <div className="gw-phonestory__notch" aria-hidden="true" />
      <div className="gw-phonestory__screen" ref={screenRef}>
        <div className="gw-phonestory__header">
          <span className="gw-phonestory__avatar" aria-hidden="true">{contact.slice(0, 1)}</span>
          <div>
            <p className="gw-phonestory__contact">{contact}</p>
            <p className="gw-phonestory__status">{subtitle}</p>
          </div>
        </div>
        <div className="gw-phonestory__messages">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`gw-phonestory__bubble gw-phonestory__bubble--${m.from}${!enabled || i <= active ? " is-visible" : ""}`}
            >
              {m.text}
            </div>
          ))}
        </div>
      </div>
      <div className="gw-phonestory__home" aria-hidden="true" />
    </div>
  );

  const copy = (
    <div className="gw-phonestory__intro">
      {kicker && <p className="gw-label">{kicker}</p>}
      {title && <h3 className="gw-h2" style={{ marginTop: 10 }}>{title}</h3>}
      {intro && <p className="gw-body gw-text-muted" style={{ marginTop: 14 }}>{intro}</p>}
    </div>
  );

  if (!enabled) {
    return (
      <div className="gw-phonestory gw-phonestory--static">
        {copy}
        {phone}
      </div>
    );
  }

  return (
    <div className="gw-phonestory" ref={sectionRef}>
      <div className="gw-phonestory__pin">
        {copy}
        {phone}
      </div>
    </div>
  );
}
