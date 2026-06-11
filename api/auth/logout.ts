import type { VercelRequest, VercelResponse } from "@vercel/node";
import { destroySession } from "../_lib/session.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  await destroySession(req, res);
  res.json({ ok: true });
}
