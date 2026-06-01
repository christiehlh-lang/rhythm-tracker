import { useEffect, useState } from "react";
import { Circle, Mail } from "lucide-react";
import { useAuth } from "../../auth";

export function SignIn() {
  const { sendMagicLink, completeMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The magic-link email redirects to /auth/callback?userId=…&secret=… —
  // intercept that on load and exchange for a session.
  useEffect(() => {
    if (window.location.pathname !== "/auth/callback") return;
    const params = new URLSearchParams(window.location.search);
    const userId = params.get("userId");
    const secret = params.get("secret");
    if (!userId || !secret) return;
    setBusy(true);
    completeMagicLink(userId, secret)
      .then(() => {
        window.history.replaceState({}, "", "/");
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setBusy(false));
  }, [completeMagicLink]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
            <Circle className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl">Your Rhythm</h1>
          <p className="text-muted-foreground text-sm">Sign in with a magic link</p>
        </div>

        {sent ? (
          <div className="bg-card p-8 rounded-2xl border border-border shadow-sm text-center space-y-3">
            <Mail className="w-8 h-8 mx-auto text-primary" />
            <p>Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              We sent a sign-in link to <span className="text-foreground">{email}</span>. Click it
              on this device to continue.
            </p>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-4 bg-card p-8 rounded-2xl border border-border shadow-sm"
          >
            <label className="block">
              <span className="block text-sm text-muted-foreground mb-2">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              <Mail className="w-4 h-4" />
              {busy ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-muted-foreground">
          No password. We email a one-time link that signs you in. Your data is private to your
          account.
        </p>
      </div>
    </div>
  );
}
