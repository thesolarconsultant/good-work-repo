import { usePrefersReducedMotion } from "../lib/motion";

/**
 * An infinite kinetic strip of what we do. The track is duplicated once and
 * translated by exactly -50%, which is what makes the loop seamless; the copy
 * is only in the DOM twice, and the duplicate is hidden from screen readers.
 *
 * Pauses on hover, and degrades to a static, horizontally scrollable row
 * under prefers-reduced-motion.
 */
export default function Marquee({ items, speed = 38, reverse = false }) {
  const reduced = usePrefersReducedMotion();

  const row = items.map((item, i) => (
    <span className="gw-marquee__item" key={`${item}-${i}`}>
      {item}
      <span className="gw-marquee__sep" aria-hidden="true" />
    </span>
  ));

  return (
    <div className="gw-marquee" data-gw-static={reduced ? "true" : undefined}>
      <div
        className="gw-marquee__track"
        style={{ "--gw-marquee-duration": `${speed}s`, "--gw-marquee-direction": reverse ? "reverse" : "normal" }}
      >
        <div className="gw-marquee__group">{row}</div>
        <div className="gw-marquee__group" aria-hidden="true">
          {row}
        </div>
      </div>
    </div>
  );
}
