import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ID } from "appwrite";
import { account } from "./appwrite";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  // Sends a magic-URL email. Returns when the email is dispatched, not when the
  // user clicks the link.
  sendMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Called from the magic-URL landing page to exchange ?userId & ?secret for a session.
  completeMagicLink: (userId: string, secret: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(raw: { $id: string; email: string; name: string }): User {
  return { id: raw.$id, email: raw.email, name: raw.name };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const me = await account.get();
      setUser(toUser(me));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sendMagicLink = useCallback(async (email: string) => {
    const redirect = `${window.location.origin}/auth/callback`;
    await account.createMagicURLToken(ID.unique(), email, redirect);
  }, []);

  const completeMagicLink = useCallback(
    async (userId: string, secret: string) => {
      await account.createSession(userId, secret);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession("current");
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, sendMagicLink, completeMagicLink, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
