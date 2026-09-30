// The Content Console's writing endpoint. One source of truth: the same
// handler as the Good Work site's (repo root api/console.js). Needs
// DEEPSEEK_API_KEY on this Vercel project. Behind the console password.
export const config = { runtime: "edge" };
export { default } from "../../../api/console.js";
