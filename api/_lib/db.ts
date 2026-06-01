import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

// Neon serverless: keep a small pool, prefer per-request transactions.
export const sql = postgres(url, {
  ssl: "require",
  max: 1,
  idle_timeout: 20,
});

// Run `fn` inside a transaction with app.current_user_id set so RLS policies
// scope every query to this user. Never run user-bound queries outside this.
export async function withUserContext<T>(
  userId: string,
  fn: (tx: postgres.TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx`SELECT set_config('app.current_user_id', ${userId}, true)`;
    return fn(tx);
  });
}
