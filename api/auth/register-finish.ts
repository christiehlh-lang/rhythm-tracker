import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { sql } from "../_lib/db";
import { createSession } from "../_lib/session";
import { rpID, origin } from "../_lib/webauthn";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const { userId, username, response } = req.body || {};
  if (!userId || !username || !response) return res.status(400).json({ error: "bad request" });

  const rows = await sql<{ challenge: string }[]>`
    SELECT challenge FROM challenges
    WHERE user_id = ${userId} AND kind = 'register' AND expires_at > now()
  `;
  if (!rows.length) return res.status(400).json({ error: "challenge expired" });

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: rows[0].challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return res.status(400).json({ error: "verification failed" });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  await sql.begin(async (tx) => {
    await tx`INSERT INTO users (id, username) VALUES (${userId}, ${username})`;
    await tx`
      INSERT INTO credentials (id, user_id, public_key, counter, transports, device_type, backed_up)
      VALUES (
        ${credential.id},
        ${userId},
        ${Buffer.from(credential.publicKey)},
        ${credential.counter},
        ${credential.transports || []},
        ${credentialDeviceType},
        ${credentialBackedUp}
      )
    `;
    await tx`DELETE FROM challenges WHERE user_id = ${userId} AND kind = 'register'`;
  });

  await createSession(userId, res);
  res.json({ ok: true, user: { id: userId, username } });
}
