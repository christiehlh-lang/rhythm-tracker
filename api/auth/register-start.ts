import type { VercelRequest, VercelResponse } from "@vercel/node";
import { randomUUID } from "node:crypto";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { sql } from "../_lib/db";
import { rpName, rpID } from "../_lib/webauthn";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const username = String(req.body?.username || "").trim().toLowerCase();
  if (!username || username.length < 2 || username.length > 64) {
    return res.status(400).json({ error: "username must be 2-64 chars" });
  }

  const existing = await sql<{ id: string }[]>`SELECT id FROM users WHERE username = ${username}`;
  if (existing.length) return res.status(409).json({ error: "username taken" });

  const userId = randomUUID();
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  // Stash the challenge against the prospective user id; user row is created
  // only after the credential is verified.
  await sql`
    INSERT INTO challenges (user_id, kind, challenge, expires_at)
    VALUES (${userId}, 'register', ${options.challenge}, ${expiresAt})
    ON CONFLICT (user_id, kind) DO UPDATE
      SET challenge = EXCLUDED.challenge, expires_at = EXCLUDED.expires_at
  `;

  res.json({ userId, username, options });
}
