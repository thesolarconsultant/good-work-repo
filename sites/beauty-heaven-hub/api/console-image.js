// The Content Console's picture endpoint (Higgsfield), shared with the Good
// Work site (repo root api/console-image.js). Needs HIGGSFIELD_API_KEY on this
// Vercel project. Behind the console password. The reference photos it sends
// Higgsfield are served, unprotected, at /goodwork/brands/beauty-heaven-hub/photos/.
export const config = { runtime: "edge" };
export { default } from "../../../api/console-image.js";
