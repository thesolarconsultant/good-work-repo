import { useInView, usePrefersReducedMotion } from "../lib/motion";
import MANIFEST from "../data/imageManifest.json";

const FLAT = Boolean(import.meta.env.VITE_HASH_ROUTER);

/**
 * A decorative texture layer that drifts behind a section.
 *
 * A still image, moved by CSS — not a video. A looping video texture is
 * megabytes; the whole site is currently 381kB on a cold load, and one clip
 * would undo that on its own. A single AVIF at ~40kB, slowly scaled and
 * rotated, reads as a moving texture and costs almost nothing. It also
 * composites on the GPU, so it doesn't fight the WebGL field in the hero.
 *
 * Purely decorative, so it is aria-hidden and never carries alt text.
 *
 * `variant` picks the drift:
 *   drift  — slow diagonal wander, the default
 *   breathe — scales in and out on the spot, for tight blocks
 *   rotate — very slow rotation, for circular or radial sources
 *
 * The animation is paused whenever the section is off screen, and under
 * prefers-reduced-motion the image is still there but perfectly still — the
 * texture is part of the design, the movement is the decoration.
 */
export default function Texture({
  src,
  variant = "drift",
  blend = "multiply",
  opacity = 0.5,
  className = "",
}) {
  const reduced = usePrefersReducedMotion();
  const [ref, inView] = useInView({ threshold: 0, rootMargin: "20% 0px", once: false });

  const meta = MANIFEST[src];
  if (!meta) {
    // A missing texture should be invisible, not a broken image icon on a
    // client's homepage.
    if (import.meta.env.DEV) console.warn(`Texture: no manifest entry for ${src}`);
    return null;
  }

  const setFor = (format) => meta.widths.map((w) => `${meta.base}-${w}.${format} ${w}w`).join(", ");

  return (
    <div
      ref={ref}
      className={`gw-texture gw-texture--${variant} ${className}`}
      aria-hidden="true"
      data-gw-running={!reduced && inView ? "true" : "false"}
      style={{ "--gw-texture-opacity": opacity, mixBlendMode: blend }}
    >
      {FLAT ? (
        <img src={meta.flat} alt="" decoding="async" loading="lazy" />
      ) : (
        <picture>
          <source type="image/avif" srcSet={setFor("avif")} sizes="100vw" />
          <source type="image/webp" srcSet={setFor("webp")} sizes="100vw" />
          <img src={src} alt="" decoding="async" loading="lazy" />
        </picture>
      )}
    </div>
  );
}
