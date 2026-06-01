# Database + Auth Setup

The app gates behind passkey sign-in and syncs per-user data to a Neon Postgres
database via Vercel serverless functions. All sensitive logic lives in `api/`.

## 1. Create the Neon database

1. Sign in at https://neon.tech and create a new project.
2. From the dashboard → **Connection Details** → copy the `postgresql://…`
   connection string (it already includes `sslmode=require`).
3. Pick the region that matches your users (EU if you have EU testers).

## 2. Configure environment variables

Set these on Vercel (Project → Settings → Environment Variables) **and** in a
local `.env` if you want to run migrations from your machine:

| Variable        | Example                                                | Notes                                               |
| --------------- | ------------------------------------------------------ | --------------------------------------------------- |
| `DATABASE_URL`  | `postgresql://user:pw@ep-xxx.neon.tech/db?sslmode=require` | Neon connection string                          |
| `RP_ID`         | `your-app.vercel.app`                                  | Host only, no scheme, no port. Use `localhost` locally. |
| `RP_ORIGIN`     | `https://your-app.vercel.app`                          | Full origin. Use `http://localhost:5173` locally.   |

Passkeys are bound to `RP_ID`. Changing it later invalidates existing passkeys.

## 3. Run the schema migration

```bash
DATABASE_URL='postgresql://…' pnpm db:migrate
```

This creates `users`, `credentials`, `challenges`, `sessions`, and `user_state`
tables, plus row-level security policies that scope every read/write to the
signed-in user.

## 4. Deploy

```bash
git push origin claude/kind-bell-MsC7L
```

Then on Vercel: New Project → import the repo → set the three env vars from
step 2 → Deploy. The `vercel.json` here already excludes `/api/*` from the SPA
rewrite so the serverless functions route correctly.

## 5. Verify

- Visit the deployed URL. You should see the sign-in screen.
- Create an account with a username; the browser will prompt for a passkey
  (Face ID / Touch ID / Windows Hello / security key).
- Log a check-in, sign out, sign back in — the entry should reappear.

## Security posture

- **Sessions** are 32-byte random tokens, SHA-256 hashed before storage.
  Cookies are `HttpOnly`, `Secure` (in production), `SameSite=Lax`.
- **Row-level security** is enforced in Postgres. Every per-user query runs
  inside a transaction that sets `app.current_user_id`; the DB refuses to
  return another user's rows even if app code has a bug.
- **Passkeys** mean there's no password to phish or reuse. Lose all your
  passkeys for an account and the account is irrecoverable — there's no
  email-based recovery flow yet. Add a backup passkey on a second device.
- **localStorage stays the local cache** so the app works offline. Writes
  go to the server (debounced 600 ms) when online.
