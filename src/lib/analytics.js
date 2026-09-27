// =========================================================
// Analytics hooks — provider-agnostic on purpose.
//
// No vendor is approved yet, so nothing here loads a script or sends a
// network request. Every intent event is:
//
//   1. pushed onto window.dataLayer (Google Tag Manager picks this up as-is),
//   2. handed to window.gwAnalytics.track(name, props) if a provider has
//      registered one (Plausible, PostHog, Fathom — a five-line adapter),
//   3. dispatched as a `gw:track` DOM CustomEvent for anything else.
//
// Wire a provider by defining window.gwAnalytics before the bundle runs, or
// by listening for `gw:track`. The event names below are the contract.
// =========================================================

export const EVENTS = {
  PAGE_VIEW: "page_view",
  LIBRARY_PREVIEW: "library_preview",
  LIBRARY_DETAIL: "library_detail",
  LIBRARY_FILTER: "library_filter",
  PRICING_VIEW: "pricing_view",
  CHECKOUT_START: "checkout_start",
  CHECKOUT_UNAVAILABLE: "checkout_unavailable",
  SERVICE_ENQUIRY_START: "service_enquiry_start",
  SERVICE_ENQUIRY_SUBMIT: "service_enquiry_submit",
  AGENCY_APPLICATION_SUBMIT: "agency_application_submit",
  CONTACT_SUBMIT: "contact_submit",
  ACCESS_INTEREST: "access_interest",
  SIGN_IN: "sign_in",
  DOWNLOAD: "download",
  LIBRARY_COPY: "library_copy",
};

export function track(name, props = {}) {
  if (typeof window === "undefined") return;
  const detail = { event: name, ...props, ts: Date.now() };
  try {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(detail);
    if (typeof window.gwAnalytics?.track === "function") window.gwAnalytics.track(name, props);
    window.dispatchEvent(new CustomEvent("gw:track", { detail }));
    if (import.meta.env.DEV) console.debug("[gw:track]", name, props);
  } catch {
    // Analytics must never break the page.
  }
}
