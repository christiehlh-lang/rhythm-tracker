import { useState } from "react";
import { Circle, KeyRound, UserPlus } from "lucide-react";
import { useAuth } from "../../auth";

export function SignIn() {
  const { signIn, signUp, supported } = useAuth();
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "signup") await signUp(username);
      else await signIn(username);
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
          <p className="text-muted-foreground text-sm">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </p>
        </div>

        {!supported ? (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm">
            Passkeys aren't supported in this browser. Try a recent version of Chrome, Safari, or
            Firefox on a device with biometric unlock.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 bg-card p-8 rounded-2xl border border-border shadow-sm">
            <label className="block">
              <span className="block text-sm text-muted-foreground mb-2">Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="how should we call you?"
                autoComplete="username webauthn"
                required
                minLength={2}
                maxLength={64}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={busy || !username.trim()}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {mode === "signup" ? <UserPlus className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
              {busy
                ? "Working…"
                : mode === "signup"
                  ? "Create passkey"
                  : "Sign in with passkey"}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </form>
        )}

        <p className="text-xs text-center text-muted-foreground">
          Your check-ins, brain dumps, and cycle data are stored privately and only readable when
          you're signed in.
        </p>
      </div>
    </div>
  );
}
