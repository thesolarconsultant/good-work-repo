// The Content Console's shared copy: one row per salon in Supabase.
//
//   GET /api/console-store/   -> { version, data }       (data null before the first save)
//   PUT /api/console-store/   { version, data } -> { version }   409 { version, data } if stale
//
// Behind the console password (middleware.js). The version number stops two
// people silently overwriting each other: a save made from an older copy is
// refused with the newer copy, and the console keeps whichever is newer.

import { supa } from "./_store.js";

export const config = { runtime: "edge" };

const ID = "beauty-heaven-hub";
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function current(db) {
  const res = await db(`console_state?id=eq.${ID}&select=version,data`);
  if (!res.ok) throw new Error(`read: HTTP ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

export default async function handler(request) {
  const db = supa();
  if (!db) return json({ error: "no database on this deployment" }, 404);
  try {
    if (request.method === "GET") {
      const row = await current(db);
      return json({ version: row?.version || 0, data: row?.data || null });
    }
    if (request.method !== "PUT") return json({ error: "GET or PUT" }, 405);

    const text = await request.text();
    if (text.length > 4_000_000) return json({ error: "too large" }, 413);
    const { version = 0, data } = JSON.parse(text || "{}");
    if (!data || typeof data !== "object" || !data.brand) return json({ error: "not console data" }, 400);

    const row = await current(db);
    if (!row) {
      const res = await db("console_state", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ id: ID, version: 1, data, updated_at: new Date().toISOString() }),
      });
      if (res.ok) return json({ version: 1 });
      const again = await current(db); // someone created it first
      return json({ version: again?.version || 0, data: again?.data || null }, 409);
    }
    if (row.version !== version) return json({ version: row.version, data: row.data }, 409);
    // Only succeeds if nobody saved in between.
    const res = await db(`console_state?id=eq.${ID}&version=eq.${version}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ version: version + 1, data, updated_at: new Date().toISOString() }),
    });
    const updated = res.ok ? await res.json() : [];
    if (!updated.length) {
      const now = await current(db);
      return json({ version: now?.version || 0, data: now?.data || null }, 409);
    }
    return json({ version: version + 1 });
  } catch (e) {
    console.error("console-store:", e.message);
    return json({ error: "database unavailable" }, 502);
  }
}
