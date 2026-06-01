import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

interface User {
  id: string;
  username: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (username: string) => Promise<void>;
  signIn: (username: string) => Promise<void>;
  signOut: () => Promise<void>;
  supported: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function jsonPost(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(msg.error || "Request failed");
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signUp = async (username: string) => {
    const start = await jsonPost("/api/auth/register-start", { username });
    const attResp = await startRegistration({ optionsJSON: start.options });
    const finish = await jsonPost("/api/auth/register-finish", {
      userId: start.userId,
      username: start.username,
      response: attResp,
    });
    setUser(finish.user);
  };

  const signIn = async (username: string) => {
    const start = await jsonPost("/api/auth/login-start", { username });
    const authResp = await startAuthentication({ optionsJSON: start.options });
    const finish = await jsonPost("/api/auth/login-finish", {
      userId: start.userId,
      response: authResp,
    });
    setUser(finish.user);
  };

  const signOut = async () => {
    await jsonPost("/api/auth/logout", {});
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        supported: browserSupportsWebAuthn(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
