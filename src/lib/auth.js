// =========================================================
// Customer session — backed by the access-key endpoint.
//
// A session is whatever /api/access says it is. The key lives in an HttpOnly
// cookie scoped to /api that page scripts cannot read; all the app can see is
// a marker cookie (gw_signed_in=1) saying it is worth asking the server.
// Nothing here reads a token from localStorage or trusts a query parameter,
// and nothing is "unlocked" client-side: the dashboard shows what the server
// returned, and the download endpoint checks the key again on every request.
//
// The contract:
//
//   useSession({ probe }) -> {
//     status:       "loading" | "authenticated" | "unauthenticated",
//     configured:   null | boolean,   // null until the server has answered
//     asked:        boolean,          // has the server been asked at all
//     user:         null | { id, name },
//     entitlements: Array<{ productId: "library" | "studio", source }>,
//     downloads:    Array<{ product, name, version, updated, items, filename, href, note }>,
//     pending:      string[],         // honest notes, e.g. Studio systems still to ship
//     signIn(key):  Promise<{ ok, status, error? }>,
//     signOut():    Promise<void>,
//     refresh():    Promise<void>,
//   }
//
// `probe: true` (the sign-in page) asks the server even without the marker,
// so the page can tell "not configured" from "not signed in". Everywhere else
// only asks when the marker is present, so ordinary visitors cost nothing.
//
// One module-level store: the nav, the dashboard and an item page share a
// single answer instead of each asking the server.
// =========================================================

import { useEffect, useSyncExternalStore } from "react";
import { track, EVENTS } from "./analytics";

const MARKER = "gw_signed_in=1";
const ENDPOINT = "/api/access";

const hasMarker = () => typeof document !== "undefined" && document.cookie.split(";").some((c) => c.trim() === MARKER);

const EMPTY = { user: null, entitlements: [], downloads: [], pending: [] };
let state = { status: hasMarker() ? "loading" : "unauthenticated", configured: null, asked: false, ...EMPTY };
const listeners = new Set();
let inflight = null;

function emit(next) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;

function apply(response, body) {
  if (response.status === 503 || response.status === 404) {
    emit({ status: "unauthenticated", configured: false, asked: true, ...EMPTY });
    return false;
  }
  if (response.ok && body?.ok) {
    emit({
      status: "authenticated",
      configured: true,
      asked: true,
      user: body.user || null,
      entitlements: Array.isArray(body.entitlements) ? body.entitlements : [],
      downloads: Array.isArray(body.downloads) ? body.downloads : [],
      pending: Array.isArray(body.pending) ? body.pending : [],
    });
    return true;
  }
  emit({ status: "unauthenticated", configured: true, asked: true, ...EMPTY });
  return false;
}

async function call(init = {}) {
  const response = await fetch(ENDPOINT, {
    credentials: "same-origin",
    ...init,
    headers: { Accept: "application/json", ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

/** Ask the server what the cookie is worth. Concurrent callers share one request. */
export function refresh() {
  if (inflight) return inflight;
  inflight = call({ method: "GET" })
    .then(({ response, body }) => {
      apply(response, body);
    })
    .catch(() => {
      // Unreachable server: not signed in as far as the UI is concerned, and
      // marked as asked so nothing loops on a retry.
      emit({ status: "unauthenticated", asked: true, ...EMPTY });
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export async function signIn(key) {
  try {
    const { response, body } = await call({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key }) });
    const ok = apply(response, body);
    if (ok) {
      track(EVENTS.SIGN_IN, { products: state.entitlements.map((e) => e.productId) });
      return { ok: true, status: response.status };
    }
    const error = body?.error || (response.status === 503 ? "Customer access isn't switched on for this deployment yet." : `Sign-in failed (${response.status}).`);
    return { ok: false, status: response.status, error };
  } catch (err) {
    return { ok: false, status: 0, error: err?.message ? `Couldn't reach the server: ${err.message}` : "Couldn't reach the server." };
  }
}

export async function signOut() {
  try {
    await call({ method: "DELETE" });
  } catch {
    // The cookie is the server's to clear; the page state resets regardless.
  }
  emit({ status: "unauthenticated", ...EMPTY });
}

export function useSession({ probe = false } = {}) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (snapshot.status === "loading" || (probe && !snapshot.asked)) refresh();
  }, [probe, snapshot.status, snapshot.asked]);
  return { ...snapshot, signIn, signOut, refresh };
}
