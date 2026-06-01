// Apply SQL migrations in order. Tracks applied ones in a _migrations table.
// Run with: pnpm db:migrate

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require" });

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  const dir = path.join(process.cwd(), "migrations");
  const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set(
    (await sql<{ name: string }[]>`SELECT name FROM _migrations`).map((r) => r.name),
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip   ${file}`);
      continue;
    }
    const body = readFileSync(path.join(dir, file), "utf8");
    console.log(`apply  ${file}`);
    await sql.unsafe(body);
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
  }

  await sql.end();
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
