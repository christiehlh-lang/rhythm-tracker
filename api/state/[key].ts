// GET  /api/state/<key>  → { value }
// PUT  /api/state/<key>  body: any JSON  → { ok: true }

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requireUser } from "../_lib/session";
import { sql } from "../_lib/db";

const ALLOWED_KEYS = new Set([
  "rhythm.dailyEntries.v1",
  "rhythm.brainDumps.v1",
  "rhythm.tasks.v1",
  "rhythm.cycle.v1",
  "rhythm.calendarEvents.v1",
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireUser(req, res);
  if (!userId) return;

  const key = String(req.query.key || "");
  if (!ALLOWED_KEYS.has(key)) return res.status(400).json({ error: "unknown key" });

  if (req.method === "GET") {
    const rows = await sql<{ value: unknown }[]>`
      SELECT value FROM user_state WHERE user_id = ${userId} AND key = ${key}
    `;
    return res.json({ value: rows[0]?.value ?? null });
  }

  if (req.method === "PUT") {
    if (req.body === undefined) return res.status(400).json({ error: "missing body" });
    await sql`
      INSERT INTO user_state (user_id, key, value, updated_at)
      VALUES (${userId}, ${key}, ${sql.json(req.body)}, now())
      ON CONFLICT (user_id, key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = now()
    `;
    return res.json({ ok: true });
  }

  res.status(405).end();
}
