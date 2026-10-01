import { useMemo } from "react";
import { usePrefersReducedMotion } from "../lib/motion";

const COLOURS = ["--gw-blue", "--gw-violet", "--gw-magenta", "--gw-coral"];

// Deterministic PRNG. Math.random() would reshuffle every sparkle on each
// re-render, so they'd visibly jump whenever anything above them changed.
function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Text with brand-coloured sparkles scattered around it.
 *
 * Built on the site's own motion layer rather than pulled from a component
 * registry: those are Tailwind components and this project has a hand-written
 * CSS system, so one would have dragged in Tailwind plus an animation runtime
 * for an effect that is a dozen lines of CSS.
 *
 * The sparkles are decorative, so they're hidden from assistive tech, and the
 * whole effect switches off under prefers-reduced-motion — leaving the text.
 */
export default function SparklesText({
  children,
  count = 12,
  as: Tag = "span",
  className = "",
  ...rest
}) {
  const reduced = usePrefersReducedMotion();
  const seedKey = typeof children === "string" ? children : "gw-sparkles";

  const sparkles = useMemo(() => {
    const rand = seeded(seedKey);
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      // Overshoot the box a little so they sit around the text, not just in it.
      left: `${rand() * 118 - 9}%`,
      top: `${rand() * 130 - 15}%`,
      size: 8 + rand() * 12,
      delay: rand() * 3.2,
      duration: 1.6 + rand() * 1.4,
      colour: COLOURS[Math.floor(rand() * COLOURS.length)],
    }));
  }, [seedKey, count]);

  return (
    <Tag className={`gw-sparkles ${className}`} {...rest}>
      {!reduced && (
        <span className="gw-sparkles__field" aria-hidden="true">
          {sparkles.map((s) => (
            <svg
              key={s.id}
              className="gw-sparkles__star"
              viewBox="0 0 24 24"
              style={{
                left: s.left,
                top: s.top,
                width: `${s.size}px`,
                height: `${s.size}px`,
                fill: `var(${s.colour})`,
                animationDelay: `${s.delay}s`,
                animationDuration: `${s.duration}s`,
              }}
            >
              <path d="M12 0 L14.4 9.6 L24 12 L14.4 14.4 L12 24 L9.6 14.4 L0 12 L9.6 9.6 Z" />
            </svg>
          ))}
        </span>
      )}
      <span className="gw-sparkles__text">{children}</span>
    </Tag>
  );
}
