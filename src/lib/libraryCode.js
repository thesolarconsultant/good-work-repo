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

// Every preview renders inside its own srcdoc document with the brand tokens
// defined, so the snippet looks exactly as it will when pasted, and nothing
// in it can reach the parent page.
const FONT_STACK = "Poppins, 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif";
export function wrapPreview(code, { scale = 1, padding = 18 } = {}) {
  return (
    // color-scheme must match the embedding page's, or Chromium paints an
    // opaque white canvas behind the frame instead of letting the card's dark
    // surface show through.
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark">` +
    `<style>:root{color-scheme:dark;background:transparent;--accent:#3366FF;--accent-2:#7A5CFF;--ink:#F4F0E8;--body:#B6BDC8;--card:#15181E;--card2:#1C2027;--line:#262C34;--bg:#0F1115}` +
    `*{box-sizing:border-box}html,body{height:100%;margin:0}` +
    `body{display:grid;place-items:center;background:transparent;color:var(--ink);font-family:${FONT_STACK};overflow:hidden;padding:${padding}px;text-align:center;zoom:${scale}}` +
    `a{cursor:default}</style></head><body>${code}</body></html>`
  );
}
