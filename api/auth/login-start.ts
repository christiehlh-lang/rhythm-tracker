import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { sql } from "../_lib/db";
import { rpID } from "../_lib/webauthn";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const username = String(req.body?.username || "").trim().toLowerCase();
  if (!username) return res.status(400).json({ error: "username required" });

  const users = await sql<{ id: string }[]>`SELECT id FROM users WHERE username = ${username}`;
  if (!users.length) return res.status(404).json({ error: "no such user" });
  const userId = users[0].id;

  const creds = await sql<{ id: string; transports: string[] }[]>`
    SELECT id, transports FROM credentials WHERE user_id = ${userId}
  `;
  if (!creds.length) return res.status(400).json({ error: "no credentials registered" });

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: creds.map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransport[] | undefined,
    })),
  });

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await sql`
    INSERT INTO challenges (user_id, kind, challenge, expires_at)
    VALUES (${userId}, 'login', ${options.challenge}, ${expiresAt})
    ON CONFLICT (user_id, kind) DO UPDATE
      SET challenge = EXCLUDED.challenge, expires_at = EXCLUDED.expires_at
  `;

  res.json({ userId, options });
}
