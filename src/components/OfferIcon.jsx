import { useId } from "react";
import { ICONS, GRADIENT_STOPS, GLYPH_SCALE } from "../data/icons";

/**
 * A product's round icon: its glyph from data/icons.js on a black disc. The
 * same drawings are the product images in Stripe (scripts/build-product-icons.mjs).
 * Decorative: the card it sits on already names the product.
 */
export default function OfferIcon({ id, size = 44, className = "" }) {
  const gradientId = `gw-icon-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const icon = ICONS[id];
  if (!icon) return null;
  const [x1, y1, x2, y2] = icon.grad;
  return (
    <svg className={`gw-offer-icon ${className}`.trim()} viewBox="0 0 1024 1024" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={x1} y1={y1} x2={x2} y2={y2}>
          {GRADIENT_STOPS.map(([offset, color]) => (
            <stop key={offset} offset={offset} stopColor={color} />
          ))}
        </linearGradient>
      </defs>
      <circle cx="512" cy="512" r="512" fill="#111111" />
      {/* Static markup from data/icons.js, never user input. */}
      <g
        transform={`translate(512 512) scale(${GLYPH_SCALE}) translate(-512 -512)`}
        dangerouslySetInnerHTML={{ __html: icon.body.replaceAll("url(#g)", `url(#${gradientId})`) }}
      />
    </svg>
  );
}
