# Setup

Vercel does everything: hosting, the database (Vercel Postgres), and the API
(serverless functions in `api/`). No third-party auth service, no CORS config,
no email provider.

## 1. Create the database

Vercel project → **Storage** → **Create Database** → **Postgres** → pick the
region closest to your users → connect it to the project.

Vercel auto-injects `POSTGRES_URL` (pooled, for the API) and
`POSTGRES_URL_NON_POOLING` (direct, for migrations) on every deploy. You don't
have to set them by hand.

## 2. Run the schema migration

```bash
# pull the auto-injected env vars down to your machine
vercel env pull .env.local

# apply migrations/0001_init.sql
pnpm db:migrate
```

This creates `users`, `sessions`, and `user_state`.

## 3. Deploy

```bash
git push origin main
```

Vercel rebuilds. No env vars to configure manually.

## 4. Verify

- Visit the deployed URL — you'll see the sign-in screen.
- Click **Create an account**, enter any email + password (≥8 chars).
- You're signed in; log a check-in; sign out and back in — entry persists.

## Auth model

- Email + password. `scrypt` hashing (Node built-in, no native deps).
- Sessions are 32-byte random tokens, SHA-256 hashed before storage.
- Cookies: `HttpOnly`, `Secure` (in production), `SameSite=Lax`. 60-day TTL.
- All `/api/state/<key>` calls require the cookie; the function pulls
  `user_id` from the verified session, so users can only read/write their own
  data.
- `localStorage` stays the local cache so the app works offline; writes go to
  Postgres (debounced 600 ms) when online.

## Limits to know

- No password recovery yet — losing your password means losing the account.
  Add an email provider + `/api/auth/reset` if you need recovery.
- No email verification yet. Anyone with a typo'd email still gets an account
  on that typo. Fine for testing; tighten before public launch.
