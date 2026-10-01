import { useId } from "react";

const RING_TEXT = "GOOD WORK. · BRAND · WEB · SYSTEMS · CREATIVE · ";

/**
 * The approval stamp, with the wordmark ring turning slowly around it.
 * The rotation is the only decorative loop on the site — it's slow enough
 * (32s) to register as a detail rather than a distraction, and CSS stops it
 * dead under prefers-reduced-motion.
 */
export default function Stamp({ size = 128 }) {
  // Multiple stamps can share a page, so the textPath target has to be unique.
  const pathId = `gw-stamp-path-${useId().replace(/:/g, "")}`;

  return (
    <div className="gw-stamp" style={{ "--gw-stamp-size": `${size}px` }}>
      <svg className="gw-stamp__ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <defs>
          <path id={pathId} d="M 60,11 a 49,49 0 1,1 -0.01,0" fill="none" />
        </defs>
        <text className="gw-stamp__ring-text">
          <textPath href={`#${pathId}`} startOffset="0">
            {RING_TEXT}
          </textPath>
        </text>
      </svg>
      <div className="gw-stamp__centre">
        GOOD
        <br />
        WORK.
      </div>
    </div>
  );
}
