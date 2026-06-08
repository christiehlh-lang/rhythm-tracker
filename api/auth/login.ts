import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../_lib/db";
import { verifyPassword } from "../_lib/password";
import { createSession } from "../_lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const rows = await sql<{ id: string; password_hash: string }[]>`
    SELECT id, password_hash FROM users WHERE email = ${email}
  `;
  if (!rows.length) return res.status(401).json({ error: "invalid credentials" });

  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) return res.status(401).json({ error: "invalid credentials" });

  await createSession(rows[0].id, res);
  res.json({ ok: true, user: { id: rows[0].id, email } });
}
