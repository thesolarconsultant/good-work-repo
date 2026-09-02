import { useMemo } from "react";
import { useInView, usePrefersReducedMotion } from "../lib/motion";

const DEFAULT_LOCATIONS = [
  "Cardiff", "Newport", "Bristol", "Swansea", "Bath", "Gloucester",
  "Cheltenham", "Chepstow", "Bridgend", "Merthyr Tydfil",
];

// Deterministic PRNG, seeded per label — placement never reshuffles on
// re-render, and stays identical between server and client renders.
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

// Spreads up to `max` locations evenly through the full list, so a radar
// capped at 24 dots still represents the whole coverage area rather than
// just however many entries happen to be typed in first.
function sample(list, max) {
  if (list.length <= max) return list.map((label, i) => ({ label, i }));
  const step = list.length / max;
  return Array.from({ length: max }, (_, k) => {
    const i = Math.min(list.length - 1, Math.round(k * step));
    return { label: list[i], i };
  });
}

/**
 * A decorative "coverage radar" for a service-area section: a pulsing hub
 * with locations scattered around it in a seeded, evenly-spread pattern,
 * backed by a real, fully-listed set of area chips underneath — the chips
 * are what a screen reader and a search engine actually read, the radar
 * is aria-hidden flourish.
 *
 * There's no real geography here on purpose — exact coordinates would need
 * a mapping dependency this hand-written motion layer doesn't carry. This
 * reads as "we cover a wide patch around X", which is what these sections
 * are actually for.
 */
export default function ServiceAreaMap({
  hub = "Head office",
  locations = DEFAULT_LOCATIONS,
  maxPins = 24,
  sweep = true,
  rings = 3,
  className = "",
}) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ threshold: 0.25 });

  const pins = useMemo(() => {
    const picked = sample(locations, maxPins);
    const total = picked.length || 1;
    const slice = 360 / total;
    return picked.map(({ label, i: originalIndex }, k) => {
      const rand = seeded(`${label}-${originalIndex}`);
      const angle = k * slice + (rand() - 0.5) * slice * 0.7;
      const radius = 20 + rand() * 25;
      const rad = (angle * Math.PI) / 180;
      return {
        label,
        x: 50 + Math.cos(rad) * radius,
        y: 50 + Math.sin(rad) * radius,
        size: 5 + rand() * 4,
        delay: rand() * 0.6,
      };
    });
  }, [locations, maxPins]);

  const visible = reduced || inView;

  return (
    <div
      ref={ref}
      className={`gw-service-map ${className}`.trim()}
      data-gw-map-visible={visible ? "true" : "false"}
    >
      <div className="gw-service-map__radar" aria-hidden="true">
        {Array.from({ length: rings }, (_, i) => (
          <span
            key={i}
            className="gw-service-map__ring"
            style={{ "--gw-ring-delay": `${i * (2.6 / rings)}s` }}
          />
        ))}
        {sweep && <span className="gw-service-map__sweep" />}
        {pins.map((pin, i) => (
          <span
            key={`${pin.label}-${i}`}
            className="gw-service-map__pin"
            title={pin.label}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              width: `${pin.size}px`,
              height: `${pin.size}px`,
              "--gw-pin-delay": `${pin.delay}s`,
            }}
          />
        ))}
        <span className="gw-service-map__hub">
          <span className="gw-service-map__hub-dot" />
          <span className="gw-service-map__hub-label">{hub}</span>
        </span>
      </div>

      <ul className="gw-service-map__list">
        {locations.map((label, i) => (
          <li
            key={`${label}-${i}`}
            className="gw-service-map__chip"
            style={{ "--gw-chip-delay": `${Math.min(i, 18) * 35}ms` }}
          >
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}
