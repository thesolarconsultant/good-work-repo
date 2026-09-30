import { useEffect, useState } from "react";

// Per-item code is fetched once and shared by every preview of that item.
const cache = new Map();

/** Fetches /library/items/<id>.json on demand. Returns { code, status }. */
export function useLibraryCode(id, enabled = true) {
  const [state, setState] = useState(() => (id && cache.has(id) ? { code: cache.get(id), status: "ready" } : { code: null, status: "idle" }));

  useEffect(() => {
    if (!enabled || !id) return;
    if (cache.has(id)) {
      setState({ code: cache.get(id), status: "ready" });
      return;
    }
    let cancelled = false;
    setState({ code: null, status: "loading" });
    fetch(`/library/items/${id}.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((json) => {
        cache.set(id, json.code);
        if (!cancelled) setState({ code: json.code, status: "ready" });
      })
      .catch(() => {
        if (!cancelled) setState({ code: null, status: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [id, enabled]);

  return state;
}

export { DESKTOP_STAGE, MOBILE_STAGE, BRAND_TOKENS, FIT_SCRIPT, wrapPreview, standalonePreview, tokensIn } from "./previewDoc.js";
