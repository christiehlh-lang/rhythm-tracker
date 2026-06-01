import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "../_lib/session";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await getUserId(req);
  if (!userId) return res.status(200).json({ user: null });
  const rows = await sql<{ username: string }[]>`
    SELECT username FROM users WHERE id = ${userId}
  `;
  if (!rows.length) return res.status(200).json({ user: null });
  res.json({ user: { id: userId, username: rows[0].username } });
}
