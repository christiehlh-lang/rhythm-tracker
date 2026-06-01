# Database + Auth Setup

The app uses **Appwrite** for both authentication (magic-link email) and
per-user data storage. No custom backend code — everything talks to the
Appwrite SDK from the browser.

## 1. Create the Appwrite project

1. Sign in at https://cloud.appwrite.io (or self-host — same SDK).
2. **Create a project**. Note the **Project ID** (top of dashboard).
3. **Settings → Platforms → Add Platform → Web App**. Add your hostnames:
   - `localhost`
   - `your-app.vercel.app` (and any custom domain)
4. **Auth → Settings**: enable **Email/Password** *or* **Magic URL**. The app
   uses Magic URL — make sure that toggle is on.

## 2. Create the database + collection

1. **Databases → Create database**. Note the **Database ID**.
2. Inside it, **Create collection** named `userState`. Note the **Collection ID**.
3. Add a single attribute:
   - **value** — String, size `1000000` (1 MB), required.
4. **Collection → Settings → Permissions**:
   - Document-level security: **enabled**.
   - Collection permissions: **Create — Any authenticated user (`users`)**.
   - The app sets per-document read/write/delete permissions for the owner
     when creating each document, so no other roles are needed at the
     collection level.

## 3. Configure environment variables

Set these on Vercel (Project → Settings → Environment Variables) and locally
in `.env.local`. They must start with `VITE_` to be exposed to the browser.

| Variable                          | Example                              |
| --------------------------------- | ------------------------------------ |
| `VITE_APPWRITE_ENDPOINT`          | `https://cloud.appwrite.io/v1`       |
| `VITE_APPWRITE_PROJECT_ID`        | `66f0…`                              |
| `VITE_APPWRITE_DATABASE_ID`       | `rhythm`                             |
| `VITE_APPWRITE_COLLECTION_ID`     | `userState`                          |

## 4. Deploy

```bash
git push origin claude/kind-bell-MsC7L
```

Then on Vercel: import the repo → set the four env vars from step 3 → Deploy.

## 5. Verify

- Visit the deployed URL. You should see the sign-in screen.
- Enter an email, receive a magic link, click it. The redirect lands on
  `/auth/callback` which the app intercepts to create a session.
- Log a check-in, sign out, sign back in — the entry should reappear.

## Security posture

- **Auth, sessions, and password hashing** are Appwrite's responsibility.
  Sessions are HTTP-only cookies set by Appwrite for your project's endpoint.
- **Document permissions** are enforced server-side by Appwrite. Each
  `userState` document is created with read/update/delete restricted to a
  single user ID (`Role.user(userId)`) — no other user can read it even if
  they know the document ID.
- **localStorage stays the local cache** so the app works offline. Writes
  go to Appwrite (debounced 600 ms) when online.
- **No data migration needed.** When a user signs in for the first time,
  any local entries are pushed up to their Appwrite account.

## Limits to be aware of

- Magic-link emails come from Appwrite's transactional sender by default.
  For production you'll want to point Appwrite at your own SMTP / Resend /
  Postmark so links don't land in spam.
- Lose access to the email = lose the account. Appwrite's account recovery
  flow can be enabled if you need a fallback.
