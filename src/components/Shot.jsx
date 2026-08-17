import { useInView, useParallax, usePrefersReducedMotion } from "../lib/motion";
import MANIFEST from "../data/imageManifest.json";

// Single-file preview builds inline every asset as base64, so a full srcset
// would balloon the document. There, one mid-size WebP is the whole story.
const FLAT = Boolean(import.meta.env.VITE_HASH_ROUTER);

/**
 * Every screenshot on the site goes through here.
 *
 * - AVIF and WebP srcsets from scripts/optimise-images.mjs, so a phone pulls
 *   ~15kB instead of the 2160px original.
 * - Intrinsic width/height always set, so nothing shifts as images land.
 * - Reveals with a clip-path wipe and drifts a few pixels on scroll.
 */
export default function Shot({
  src,
  alt,
  caption,
  sizes = "(max-width: 860px) 100vw, 1040px",
  priority = false,
  parallax = true,
  reveal = true,
  className = "",
  ...rest
}) {
  const reduced = usePrefersReducedMotion();
  const [revealRef, inView] = useInView({ threshold: 0.12 });
  const parallaxRef = useParallax({ enabled: parallax && !reduced });

  const meta = MANIFEST[src];
  const setFor = (format) =>
    meta.widths.map((w) => `${meta.base}-${w}.${format} ${w}w`).join(", ");

  const img = (
    <img
      src={FLAT && meta ? meta.flat : src}
      alt={alt}
      width={meta?.width}
      height={meta?.height}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      {...rest}
    />
  );

  return (
    <figure
      className={`gw-shot ${className}`}
      ref={reveal ? revealRef : undefined}
      data-gw-reveal={reveal ? "mask" : undefined}
      data-gw-visible={reveal ? (reduced || inView ? "true" : "false") : undefined}
    >
      <div className="gw-shot__frame" ref={parallaxRef}>
        {meta && !FLAT ? (
          <picture>
            <source type="image/avif" srcSet={setFor("avif")} sizes={sizes} />
            <source type="image/webp" srcSet={setFor("webp")} sizes={sizes} />
            {img}
          </picture>
        ) : (
          img
        )}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
