import postgres from "postgres";

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) throw new Error("POSTGRES_URL (or DATABASE_URL) is not set");

export const sql = postgres(url, {
  ssl: "require",
  max: 1,
  idle_timeout: 20,
});
