import { useInView } from "../lib/motion";
import { useLibraryCode, wrapPreview } from "../lib/libraryCode";

/**
 * A sandboxed, lazily-mounted live preview. `allow-scripts` without
 * `allow-same-origin` gives the snippet an opaque origin: it can animate,
 * it cannot read cookies, storage or the parent document.
 */
export default function LibraryPreview({ id, name, code: codeProp, scale = 1, eager = false, className = "" }) {
  const [ref, inView] = useInView({ threshold: 0.01, rootMargin: "200px 0px" });
  const wanted = eager || inView;
  const fetched = useLibraryCode(codeProp ? null : id, wanted && !codeProp);
  const code = codeProp ?? fetched.code;
  const status = codeProp ? "ready" : fetched.status;

  return (
    <div ref={ref} className={className} style={{ position: "absolute", inset: 0 }}>
      {code && wanted ? (
        <iframe title={`${name} preview`} sandbox="allow-scripts" loading="lazy" scrolling="no" srcDoc={wrapPreview(code, { scale })} />
      ) : (
        <div className="gw-lib-card__ph" aria-hidden="true">
          {status === "failed" ? "Preview unavailable" : "Preview"}
        </div>
      )}
    </div>
  );
}
