import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { sql } from "../_lib/db";
import { createSession } from "../_lib/session";
import { rpID, origin } from "../_lib/webauthn";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId, response } = req.body || {};
  if (!userId || !response) return res.status(400).json({ error: "bad request" });

  const ch = await sql<{ challenge: string }[]>`
    SELECT challenge FROM challenges
    WHERE user_id = ${userId} AND kind = 'login' AND expires_at > now()
  `;
  if (!ch.length) return res.status(400).json({ error: "challenge expired" });

  const credId = response.id;
  const creds = await sql<{
    id: string;
    public_key: Buffer;
    counter: string;
    transports: string[];
  }[]>`
    SELECT id, public_key, counter, transports
    FROM credentials WHERE user_id = ${userId} AND id = ${credId}
  `;
  if (!creds.length) return res.status(400).json({ error: "unknown credential" });

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: ch[0].challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: creds[0].id,
      publicKey: new Uint8Array(creds[0].public_key),
      counter: Number(creds[0].counter),
      transports: creds[0].transports as AuthenticatorTransport[],
    },
  });

  if (!verification.verified) return res.status(401).json({ error: "verification failed" });

  await sql.begin(async (tx) => {
    await tx`
      UPDATE credentials SET counter = ${verification.authenticationInfo.newCounter}
      WHERE id = ${credId}
    `;
    await tx`DELETE FROM challenges WHERE user_id = ${userId} AND kind = 'login'`;
  });

  await createSession(userId, res);
  const user = await sql<{ username: string }[]>`SELECT username FROM users WHERE id = ${userId}`;
  res.json({ ok: true, user: { id: userId, username: user[0].username } });
}
