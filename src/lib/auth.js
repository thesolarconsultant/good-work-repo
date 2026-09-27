// =========================================================
// Customer session — the interface, honestly unimplemented.
//
// There is no authentication provider, database or entitlement store in this
// deployment yet, so this hook always reports "unauthenticated". It exists so
// the login page, the dashboard and the download buttons are written against
// a real contract now and light up when the backend lands — see
// docs/BACKEND.md for exactly what that involves.
//
// The contract a provider has to satisfy:
//
//   useSession() -> {
//     status: "loading" | "authenticated" | "unauthenticated",
//     user:   null | { id, email, name? },
//     entitlements: Array<{ productId: "library" | "studio", grantedAt, expiresUpdatesAt }>,
//     signOut(): Promise<void>,
//   }
//
// Nothing in the UI reads a token from localStorage or trusts a query
// parameter: a session is whatever the server says it is, or nothing.
// =========================================================

export const AUTH_ENABLED = false;

export function useSession() {
  return {
    status: "unauthenticated",
    user: null,
    entitlements: [],
    signOut: async () => {},
  };
}
