// Canonical origin for canonical URLs, Open Graph tags and JSON-LD.
// Override at build time if the site ever moves: VITE_SITE_URL=https://…
export const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://goodwork.agency").replace(/\/$/, "");

export const SITE_NAME = "Goodwork";
export const WORDMARK = "GOOD WORK.";
export const CONTACT_EMAIL = "hello@goodwork.agency";
export const TAGLINE = "Build better. Launch faster.";
export const DESCRIPTION =
  "Production-ready websites, AI agents and business systems. Use the tools yourself, or let Goodwork build the complete operation for you.";
