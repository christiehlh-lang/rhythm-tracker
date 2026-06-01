// Drop-in replacement for useLocalStorage that also syncs with the server
// when the user is signed in. Reads localStorage first for instant render,
// then reconciles with /api/state/<key>:
//   - server has a value          → use server, overwrite local
//   - server empty, local has data → push local to server
// Writes go to localStorage immediately and to the server (debounced).

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth";

const SYNCABLE = new Set([
  "rhythm.dailyEntries.v1",
  "rhythm.brainDumps.v1",
  "rhythm.tasks.v1",
  "rhythm.cycle.v1",
  "rhythm.calendarEvents.v1",
]);

function readLocal<T>(key: string, initial: T): T {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  } catch {
    return initial;
  }
}

function writeLocal<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota
  }
}

function isEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v as object).length === 0;
  return false;
}

export function useSyncedStorage<T>(
  key: string,
  initial: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(() => readLocal(key, initial));
  const lastPushed = useRef<string>("");
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reconcile with server when sign-in state changes.
  useEffect(() => {
    if (!user || !SYNCABLE.has(key)) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/state/${encodeURIComponent(key)}`, {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const serverValue = data.value as T | null;
        const local = readLocal<T>(key, initial);
        if (serverValue !== null && !isEmpty(serverValue)) {
          setValue(serverValue);
          writeLocal(key, serverValue);
          lastPushed.current = JSON.stringify(serverValue);
        } else if (!isEmpty(local)) {
          await fetch(`/api/state/${encodeURIComponent(key)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(local),
          });
          lastPushed.current = JSON.stringify(local);
        }
      } catch {
        // offline: silently fall back to local-only
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, key]);

  // Persist locally and (debounced) push to server on every change.
  useEffect(() => {
    writeLocal(key, value);
    if (!user || !SYNCABLE.has(key)) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastPushed.current) return;

    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/state/${encodeURIComponent(key)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: serialized,
        });
        lastPushed.current = serialized;
      } catch {
        // retry on next change
      }
    }, 600);
  }, [key, value, user?.id]);

  return [value, setValue];
}
