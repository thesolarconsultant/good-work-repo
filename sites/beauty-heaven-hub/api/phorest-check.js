// Read-only Phorest connection check.
//
//   GET /api/phorest-check   with header  x-check-key: <PHOREST_CHECK_KEY>
//
// Confirms the credentials work and reports only non-personal facts: the
// branch, and how many services and service categories Phorest returns. It
// never reads clients or staff, and it answers 404 to anyone without the key,
// so its existence isn't advertised. Credentials come from the project's
// sensitive environment variables, never from the repo.

export const config = { runtime: "edge" };

const BASE = "https://platform.phorest.com/third-party-api-server/api/business";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });

// Compare without leaking the key's length or content through timing.
function sameKey(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

async function get(path, auth) {
  const res = await fetch(`${BASE}/${process.env.PHOREST_BUSINESS_ID}${path}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  const body = res.ok ? await res.json() : null;
  return { status: res.status, body };
}

const total = (body, key) => body?.page?.totalElements ?? body?._embedded?.[key]?.length ?? null;

export default async function handler(request) {
  if (!sameKey(request.headers.get("x-check-key") || "", process.env.PHOREST_CHECK_KEY || "")) {
    return new Response("Not found", { status: 404 });
  }
  const { PHOREST_USERNAME: user, PHOREST_PASSWORD: pass, PHOREST_BUSINESS_ID: biz } = process.env;
  if (!user || !pass || !biz) return json({ ok: false, error: "Phorest settings are missing on this project." }, 503);

  const auth = "Basic " + btoa(`${user}:${pass}`);
  const branch = await get("/branch", auth);
  if (!branch.body) return json({ ok: false, step: "branch", status: branch.status });

  const branches = (branch.body._embedded?.branches || []).map((b) => ({
    branchId: b.branchId,
    name: b.name,
    town: b.city || null,
    postcode: b.postalCode || null,
    timeZone: b.timeZone || null,
  }));
  const first = branches[0]?.branchId;
  const services = first ? await get(`/branch/${first}/service?size=1`, auth) : null;
  const categories = first ? await get(`/branch/${first}/service-category?size=1`, auth) : null;

  return json({
    ok: true,
    branches,
    services: services && { status: services.status, total: total(services.body, "services") },
    serviceCategories: categories && { status: categories.status, total: total(categories.body, "serviceCategories") },
  });
}
