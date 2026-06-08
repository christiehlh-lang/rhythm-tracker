import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { sql } from "../_lib/db";
import { hashPassword } from "../_lib/password";
import { createSession } from "../_lib/session";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "valid email required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) return res.status(409).json({ error: "email already registered" });

  const id = randomUUID();
  const password_hash = await hashPassword(password);
  await sql`INSERT INTO users (id, email, password_hash) VALUES (${id}, ${email}, ${password_hash})`;
  await createSession(id, res);
  res.json({ ok: true, user: { id, email } });
}
