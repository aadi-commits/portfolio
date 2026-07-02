/**
 * Optional PostgreSQL access for contact-form submissions.
 *
 * If DATABASE_URL is not set, every function degrades gracefully: callers
 * should treat a `null`/`false` result as "no DB configured" and fall back to
 * email/log. The app runs fine with zero database during dev.
 */

import type { Pool } from "pg";

let pool: Pool | null = null;
let poolTried = false;
let schemaReady = false;

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

async function getPool(): Promise<Pool | null> {
  if (!isDbConfigured()) return null;
  if (poolTried) return pool;
  poolTried = true;

  try {
    const { Pool: PgPool } = await import("pg");
    pool = new PgPool({
      connectionString: process.env.DATABASE_URL,
      // Most hosted Postgres (Neon/Supabase/RDS) needs SSL; opt in via env.
      ssl:
        process.env.DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
    return pool;
  } catch {
    pool = null;
    return null;
  }
}

async function ensureSchema(p: Pool): Promise<void> {
  if (schemaReady) return;
  await p.query(`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id          BIGSERIAL PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      message     TEXT NOT NULL,
      user_agent  TEXT,
      ip          TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  schemaReady = true;
}

export type ContactSubmission = {
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  ip?: string;
};

/**
 * Persist a contact submission.
 * @returns the new row id, or null if no DB is configured / on failure.
 */
export async function saveContactSubmission(
  data: ContactSubmission,
): Promise<number | null> {
  const p = await getPool();
  if (!p) return null;

  try {
    await ensureSchema(p);
    const res = await p.query<{ id: string }>(
      `INSERT INTO contact_submissions (name, email, message, user_agent, ip)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.name, data.email, data.message, data.userAgent ?? null, data.ip ?? null],
    );
    return Number(res.rows[0]?.id ?? 0) || null;
  } catch (err) {
    console.error("[db] saveContactSubmission failed:", err);
    return null;
  }
}
