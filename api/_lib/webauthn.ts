// WebAuthn configuration. RP_ID = effective domain (no scheme, no port).
// RP_ORIGIN = full origin (scheme + host + optional port).

export const rpName = "Your Rhythm";
export const rpID = process.env.RP_ID || "localhost";
export const origin = process.env.RP_ORIGIN || "http://localhost:5173";
