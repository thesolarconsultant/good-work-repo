// The Content Console is for the salon and Good Work, not the public: it holds
// the brand and spends on paid writing and picture services. Everything under
// /console/ and its endpoints asks for the console password (CONSOLE_PASSWORD
// in Vercel; any username). The public website is untouched.

import { next } from "@vercel/functions";

export const config = {
  matcher: [
    "/console", "/console/:path*",
    "/api/console", "/api/console/:path*",
    "/api/console-image", "/api/console-image/:path*",
    "/api/console-store", "/api/console-store/:path*",
    "/api/console-week", "/api/console-week/:path*",
    "/api/send-email", "/api/send-email/:path*",
    "/api/crm-leads", "/api/crm-leads/:path*",
  ],
};

function same(a, b) {
  if (!b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default function middleware(request) {
  const password = process.env.CONSOLE_PASSWORD || "";
  if (!password) return new Response("The console is locked: CONSOLE_PASSWORD is not set.", { status: 503 });
  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Basic ")) {
    let given = "";
    try { given = atob(header.slice(6)).split(":").slice(1).join(":"); } catch { /* bad header */ }
    if (same(given, password)) return next();
  }
  return new Response("Password needed.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Beauty Heaven Content Console", charset="UTF-8"', "Cache-Control": "no-store" },
  });
}
