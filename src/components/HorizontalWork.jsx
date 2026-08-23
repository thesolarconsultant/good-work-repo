import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Shot from "./Shot";
import Stat from "./Stat";
import { usePrefersReducedMotion } from "../lib/motion";

/**
 * The work, travelling sideways as you scroll.
 *
 * This is NOT scroll-jacking. Nothing calls preventDefault and the scrollbar
 * is never touched: the section is simply taller than the viewport, its inner
 * frame is sticky, and how far you've scrolled through that height maps to how
 * far the track has moved. So the back button, keyboard scrolling, find-in-page
 * and a trackpad fling all behave exactly as they normally would — you can
 * scroll straight past it at any speed.
 *
 * The section's height is measured, never guessed: it is the pinned frame's
 * height plus exactly how far the track has to travel. One pixel of scrolling
 * buys one pixel of sideways movement, so the pin lasts precisely as long as
 * there is something left to show and not a pixel longer. That also means it
 * scales on its own as case studies are added.
 *
 * If the track already fits the viewport — few cards, or a very wide monitor —
 * there is nothing to travel, so it unpins and renders as a plain row. Pinning
 * a section that cannot move is how you make a site feel broken.
 *
 * Below 900px, and under prefers-reduced-motion, it renders as an ordinary
 * stacked grid instead. A pinned sideways rail on a phone is a way to lose
 * someone who was looking for your phone number.
 */
export default function HorizontalWork({ items }) {
  const reduced = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const sync = () => setEnabled(mq.matches && !reduced);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    let frame = 0;
    let visible = false;
    let travel = 0;

    // How far the track must move, and therefore how tall the section is.
    // Read before any transform is applied, so scrollWidth is the untranslated
    // content width.
    const measure = () => {
      const previous = track.style.transform;
      track.style.transform = "";
      travel = Math.max(0, track.scrollWidth - window.innerWidth);
      track.style.transform = previous;

      if (travel === 0) {
        section.classList.add("gw-rail--static");
        section.style.height = "";
        track.style.transform = "";
        return;
      }
      section.classList.remove("gw-rail--static");
      section.style.height = `${section.firstElementChild.offsetHeight + travel}px`;
    };

    const update = () => {
      frame = 0;
      if (travel === 0) return;
      const pin = section.firstElementChild;
      const rect = section.getBoundingClientRect();
      // The pin is stuck from the moment the section's top reaches the sticky
      // offset until its bottom passes the pin's far edge.
      const total = rect.height - pin.offsetHeight;
      const scrolled = (parseFloat(getComputedStyle(pin).top) || 0) - rect.top;
      const t = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
      track.style.transform = `translate3d(${-t * travel}px,0,0)`;
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
      section.classList.remove("gw-rail--static");
      section.style.height = "";
      track.style.transform = "";
    };
  }, [enabled, items.length]);

  const cards = items.map((w, i) => (
    <Link to={w.to} className="gw-rail__card" key={w.name}>
      <span className="gw-rail__index" aria-hidden="true">{i + 1}</span>
      <div className="gw-rail__media">
        <Shot
          src={w.shot}
          alt={`${w.name} website`}
          sizes="(max-width: 900px) 100vw, 620px"
          parallax={false}
          reveal={false}
          className="gw-rail__figure"
        />
      </div>
      <div className="gw-rail__body">
        <span className="gw-work-card__tag">{w.tag}</span>
        <h3 className="gw-rail__name">{w.name}</h3>
        {w.site && <p className="gw-case-site">{w.site}</p>}
        <p className="gw-body">{w.desc}</p>
        {/* The figures count up as the card slides in — the observer sees them
            arrive because the pin clips them until then. */}
        {w.facts?.length ? (
          <div className="gw-facts gw-facts--pair gw-rail__facts">
            {w.facts.map((f, n) => (
              <Stat key={f.label} figure={f.figure} label={f.label} delay={n * 120} />
            ))}
          </div>
        ) : null}
        <span className="gw-work-card__go">Read the case study <span aria-hidden="true">→</span></span>
      </div>
    </Link>
  ));

  if (!enabled) {
    return <div className="gw-rail-grid">{cards}</div>;
  }

  return (
    <div className="gw-rail" ref={sectionRef}>
      <div className="gw-rail__pin">
        <div className="gw-rail__track" ref={trackRef}>
          {cards}
          <div className="gw-rail__end">
            <p className="gw-label">That's the lot</p>
            <p className="gw-rail__end-line">Yours could be next<span className="gw-dot" /></p>
          </div>
        </div>
      </div>
    </div>
  );
}
