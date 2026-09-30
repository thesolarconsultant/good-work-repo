// Read-only export of the public menu from Phorest, for the site build.
//
//   GET /api/phorest-menu/   with header  x-check-key: <PHOREST_CHECK_KEY>
//
// Returns every branch's service categories and services: names, prices,
// durations, the online-booking flag and the online description. That is
// business data, the same as the public booking page shows, so the build can
// commit it as a snapshot. It never reads clients or staff. Answers 404
// without the key.

export const config = { runtime: "edge" };

const BASE = "https://platform.phorest.com/third-party-api-server/api/business";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });

function sameKey(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// Fields kept from a service. Anything staff-related (who is disqualified,
// per-staff prices) is left out on purpose.
const SERVICE_KEYS = ["serviceId", "categoryId", "name", "price", "duration", "gapTime", "internetEnabled", "internetDescription", "description", "archived", "deleted"];
const pick = (o, keys) => Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));

async function all(path, key, auth) {
  const out = [];
  const seen = new Set();
  for (let page = 0; page < 30; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}/${process.env.PHOREST_BUSINESS_ID}${path}${sep}size=100&page=${page}`, {
      headers: { Authorization: auth, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`${path} page ${page}: HTTP ${res.status}`);
    const body = await res.json();
    const items = body._embedded?.[key] || [];
    items.forEach((i) => Object.keys(i).forEach((k) => seen.add(k)));
    out.push(...items);
    const totalPages = body.page?.totalPages ?? 1;
    if (page + 1 >= totalPages) break;
  }
  return { items: out, keys: [...seen].sort() };
}

export default async function handler(request) {
  if (!sameKey(request.headers.get("x-check-key") || "", process.env.PHOREST_CHECK_KEY || "")) {
    return new Response("Not found", { status: 404 });
  }
  const { PHOREST_USERNAME: user, PHOREST_PASSWORD: pass } = process.env;
  const auth = "Basic " + btoa(`${user}:${pass}`);
  try {
    const branches = (await all("/branch", "branches", auth)).items;
    const result = [];
    for (const b of branches) {
      const cats = await all(`/branch/${b.branchId}/service-category`, "serviceCategories", auth);
      const svcs = await all(`/branch/${b.branchId}/service`, "services", auth);
      result.push({
        branchId: b.branchId,
        name: (b.name || "").trim(),
        postcode: b.postalCode || null,
        categories: cats.items.map((c) => pick(c, ["categoryId", "name", "description"])),
        services: svcs.items.map((s) => pick(s, SERVICE_KEYS)),
        // what Phorest actually sends, so the pick list can be checked
        serviceFieldsSeen: svcs.keys,
      });
    }
    return json({ fetchedAt: new Date().toISOString(), branches: result });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
}
