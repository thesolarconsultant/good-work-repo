import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL } from "../lib/site";

/**
 * Per-page metadata. React 19 hoists <title>, <meta> and <link> into <head>
 * from wherever they're rendered, so pages can declare their own without a
 * helmet library.
 *
 * JSON-LD stays inline: it isn't hoisted, and structured data is valid
 * anywhere in the document.
 */
export default function Seo({ title, description, image = "/og.png", schema, noindex = false }) {
  const { pathname } = useLocation();

  // index.html carries a set of site-level fallbacks for scrapers that never
  // run JavaScript. Once we're mounted they'd only be duplicates, so they go.
  useEffect(() => {
    document.head.querySelectorAll("meta[data-gw-default]").forEach((el) => el.remove());
  }, []);

  const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;
  const fullTitle = title.includes("GOOD WORK") ? title : `${title} — GOOD WORK.`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="GOOD WORK." />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_GB" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {schema && (
        <script
          type="application/ld+json"
          // Structured data is authored here, not user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
    </>
  );
}
