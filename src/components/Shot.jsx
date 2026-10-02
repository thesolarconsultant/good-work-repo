import MANIFEST from "../data/imageManifest.json";

// Single-file preview builds inline every asset as base64, so a full srcset
// would balloon the document. There, one mid-size WebP is the whole story.
const FLAT = Boolean(import.meta.env.VITE_HASH_ROUTER);

/** Just the responsive picture for a screenshot, for frames other than Shot's own. */
export function ShotPicture({ src, alt, sizes = "(max-width: 860px) 100vw, 600px", priority = false, ...rest }) {
  const meta = MANIFEST[src];
  const setFor = (format) => meta.widths.map((w) => `${meta.base}-${w}.${format} ${w}w`).join(", ");
  const img = (
    <img
      src={FLAT && meta ? meta.flat : src}
      alt={alt}
      width={meta?.width}
      height={meta?.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      {...rest}
    />
  );
  if (!meta || FLAT) return img;
  return (
    <picture>
      <source type="image/avif" srcSet={setFor("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={setFor("webp")} sizes={sizes} />
      {img}
    </picture>
  );
}

/**
 * Every screenshot on the site goes through here: AVIF and WebP srcsets from
 * scripts/optimise-images.mjs, intrinsic width and height always set so
 * nothing shifts as images land, lazy unless marked priority.
 */
export default function Shot({
  src,
  alt,
  caption,
  sizes = "(max-width: 860px) 100vw, 1040px",
  priority = false,
  className = "",
  frameClassName = "",
  ...rest
}) {
  const meta = MANIFEST[src];
  const setFor = (format) => meta.widths.map((w) => `${meta.base}-${w}.${format} ${w}w`).join(", ");

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
    <figure className={`gw-shot ${className}`.trim()}>
      <div className={`gw-shot__frame ${frameClassName}`.trim()}>
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
