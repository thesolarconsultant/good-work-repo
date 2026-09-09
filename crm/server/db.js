// =========================================================
// Database access
//
// Plain node-postgres against a connection string, so the platform is not
// married to a provider — Neon, Supabase, Vercel Postgres, RDS or a box in a
// cupboard all take the same URL. That matters for a product intended to be
// sold: a buyer inheriting a proprietary data layer inherits a migration.
//
// One rule, and it is the whole reason this file exists: every query that
// touches tenant data goes through `asWorkspace`. Row-level security refuses
// to return rows unless `app.workspace_id` is set, so a query that forgets its
// scope returns nothing rather than someone else's clients.
//
// `pg` is a TCP client and cannot run on an edge runtime. These handlers are
// Node functions, unlike api/broll.js and api/enquiry.js.
// =========================================================

import pg from "pg";

// Postgres returns numerics as strings to avoid silent float damage. For money
// that is the right default and we keep it; for counts it is just noise.
pg.types.setTypeParser(20, (v) => Number(v)); // int8

let pool;

/** Lazily built, so importing this module never opens a socket. */
export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    pool = new pg.Pool({
      connectionString,
      // Serverless: many short-lived instances, each wanting few connections.
      max: Number(process.env.PGPOOL_MAX || 3),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? false : { rejectUnauthorized: true },
    });
  }
  return pool;
}

/** A transaction with no tenant scope. Sign-in only — everything else is scoped. */
export async function unscoped(run) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * A transaction scoped to one salon.
 *
 * SET LOCAL rather than SET: the setting dies with the transaction, so a
 * pooled connection can never be handed to the next request still carrying
 * the last tenant's id. That is the failure mode this whole design exists to
 * make impossible, and it is a one-word difference.
 */
export async function asWorkspace(workspaceId, run) {
  if (!workspaceId) throw new Error("asWorkspace needs a workspace id");
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.workspace_id', $1, true)", [workspaceId]);
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/** Postgres codes we turn into a human answer rather than a 500. */
export const CONFLICT = "23P01"; // exclusion_violation
