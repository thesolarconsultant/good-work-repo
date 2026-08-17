import { useCountUp, usePrefersReducedMotion } from "../lib/motion";

/**
 * A single figure + label. The number counts up the first time it scrolls
 * into view; under reduced motion it just renders the final value.
 */
export default function Stat({ figure, label, delay = 0 }) {
  const reduced = usePrefersReducedMotion();
  const [ref, display, inView] = useCountUp(figure, { enabled: !reduced });

  return (
    <div
      className="gw-fact"
      ref={ref}
      data-gw-reveal="rise"
      data-gw-visible={reduced || inView ? "true" : "false"}
      style={delay ? { "--gw-reveal-delay": `${delay}ms` } : undefined}
    >
      <span className="gw-fact__figure">{display}</span>
      <span className="gw-fact__label">{label}</span>
    </div>
  );
}
