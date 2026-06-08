// Password hashing with Node's built-in scrypt. No native deps — works in
// Vercel's serverless runtime out of the box.

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LEN = 64;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(plain, salt, KEY_LEN);
  return `scrypt:${salt}:${buf.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const [scheme, salt, hex] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hex) return false;
  const expected = Buffer.from(hex, "hex");
  const got = await scryptAsync(plain, salt, KEY_LEN);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}
