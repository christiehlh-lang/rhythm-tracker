import { randomBytes, createHash } from "node:crypto";
import { parse, serialize } from "cookie";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "./db";

const COOKIE = "rhythm_session";
const TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, res: VercelResponse): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await sql`
    INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${hash(token)}, ${userId}, ${expiresAt})
  `;
  res.setHeader(
    "Set-Cookie",
    serialize(COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: TTL_MS / 1000,
    }),
  );
}

export async function getUserId(req: VercelRequest): Promise<string | null> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const token = parse(cookieHeader)[COOKIE];
  if (!token) return null;
  const rows = await sql<{ user_id: string }[]>`
    SELECT user_id FROM sessions
    WHERE token_hash = ${hash(token)} AND expires_at > now()
  `;
  return rows[0]?.user_id ?? null;
}

export async function destroySession(req: VercelRequest, res: VercelResponse): Promise<void> {
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const token = parse(cookieHeader)[COOKIE];
    if (token) await sql`DELETE FROM sessions WHERE token_hash = ${hash(token)}`;
  }
  res.setHeader("Set-Cookie", serialize(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 }));
}

export async function requireUser(
  req: VercelRequest,
  res: VercelResponse,
): Promise<string | null> {
  const userId = await getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return userId;
}
