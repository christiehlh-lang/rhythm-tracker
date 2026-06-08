import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getUserId } from "../_lib/session";
import { sql } from "../_lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await getUserId(req);
  if (!userId) return res.json({ user: null });
  const rows = await sql<{ email: string }[]>`SELECT email FROM users WHERE id = ${userId}`;
  if (!rows.length) return res.json({ user: null });
  res.json({ user: { id: userId, email: rows[0].email } });
}
