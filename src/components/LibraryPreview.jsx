import { useMemo } from "react";
import { useElementSize, useInView } from "../lib/motion";
import { useLibraryCode, wrapPreview, DESKTOP_STAGE, MOBILE_STAGE } from "../lib/libraryCode";

/**
 * A sandboxed live preview that fills its (positioned) parent.
 *
 * The snippet renders at its real size, centred; if it is bigger than the
 * frame (a tall FAQ in a small card, say) the document's fit script scales it
 * down to fit instead of letting it be cut off.
 *
 * `allow-scripts` without `allow-same-origin` gives the snippet an opaque
 * origin: it can animate, it cannot read cookies, storage or this page.
 * Frames far off-screen unmount, so a long catalogue never runs every
 * animation at once.
 */
export default function LibraryPreview({ id, name, code: codeProp, eager = false, reloadKey = 0, className = "" }) {
  const [ref, inView] = useInView({ threshold: 0, rootMargin: "400px 0px", once: false });
  const wanted = eager || inView;
  const fetched = useLibraryCode(codeProp ? null : id, wanted && !codeProp);
  const code = codeProp ?? fetched.code;
  const status = codeProp ? "ready" : fetched.status;
  const doc = useMemo(() => (code ? wrapPreview(code) : ""), [code]);

  return (
    <div ref={ref} className={`gw-preview ${className}`.trim()}>
      {code && wanted ? (
        <iframe key={reloadKey} className="gw-preview__frame gw-preview__frame--fill" title={`${name} preview`} sandbox="allow-scripts" scrolling="no" srcDoc={doc} />
      ) : (
        <div className="gw-preview__ph" aria-hidden="true">
          {status === "failed" ? "Preview unavailable" : ""}
        </div>
      )}
    </div>
  );
}

/**
 * A real page (a template) laid out at desktop or phone width in its own
 * sandboxed frame and scaled down to fit, like a screenshot that still runs.
 */
export function PagePreview({ src, name, device = "desktop", eager = false, reloadKey = 0 }) {
  const [ref, inView] = useInView({ threshold: 0, rootMargin: "400px 0px", once: false });
  const box = useElementSize(ref);
  const stage = device === "mobile" ? MOBILE_STAGE : DESKTOP_STAGE;
  const scale = box.width ? Math.min(1, box.width / stage) : 1;
  return (
    <div ref={ref} className="gw-preview">
      {(eager || inView) && box.width > 0 ? (
        <iframe
          key={reloadKey}
          className="gw-preview__frame"
          title={`${name} preview`}
          src={src}
          loading="lazy"
          sandbox="allow-scripts"
          style={{ width: `${stage}px`, height: `${Math.max(box.height / scale, 1)}px`, transform: scale < 1 ? `scale(${scale})` : undefined }}
        />
      ) : (
        <div className="gw-preview__ph" aria-hidden="true" />
      )}
    </div>
  );
}
