// Drop-in replacement for useLocalStorage. Reads localStorage first for instant
// render, then reconciles with an Appwrite document whose $id == storage key.
// Writes go to localStorage immediately and to Appwrite (debounced).

import { useEffect, useRef, useState } from "react";
import { AppwriteException, Permission, Role } from "appwrite";
import {
  APPWRITE_COLLECTION_ID,
  APPWRITE_DATABASE_ID,
  databases,
} from "./appwrite";
import { useAuth } from "./auth";

const SYNCABLE = new Set([
  "rhythm.dailyEntries.v1",
  "rhythm.brainDumps.v1",
  "rhythm.tasks.v1",
  "rhythm.cycle.v1",
  "rhythm.calendarEvents.v1",
]);

// Appwrite document $id is restricted to [a-zA-Z0-9._-], max 36 chars.
// Hash the key (which already fits but uses dots; dots are allowed) into a
// per-user document id that includes the user id.
function docId(userId: string, key: string): string {
  const safeKey = key.replace(/[^a-zA-Z0-9._-]/g, "_");
  const id = `${userId}.${safeKey}`;
  return id.slice(0, 36);
}

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

async function readRemote<T>(userId: string, key: string): Promise<T | null> {
  try {
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      docId(userId, key),
    );
    // Stored as a JSON-encoded string in the `value` field.
    return JSON.parse((doc as unknown as { value: string }).value) as T;
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) return null;
    throw err;
  }
}

async function writeRemote<T>(userId: string, key: string, value: T): Promise<void> {
  const id = docId(userId, key);
  const payload = { value: JSON.stringify(value) };
  // Read/write restricted to the owning user via per-document permissions.
  const perms = [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
  try {
    await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_ID, id, payload);
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLECTION_ID,
        id,
        payload,
        perms,
      );
      return;
    }
    throw err;
  }
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
        const serverValue = await readRemote<T>(user.id, key);
        if (cancelled) return;
        const local = readLocal<T>(key, initial);
        if (serverValue !== null && !isEmpty(serverValue)) {
          setValue(serverValue);
          writeLocal(key, serverValue);
          lastPushed.current = JSON.stringify(serverValue);
        } else if (!isEmpty(local)) {
          await writeRemote(user.id, key, local);
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

  // Persist locally + debounced push to server on every change.
  useEffect(() => {
    writeLocal(key, value);
    if (!user || !SYNCABLE.has(key)) return;
    const serialized = JSON.stringify(value);
    if (serialized === lastPushed.current) return;

    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = setTimeout(async () => {
      try {
        await writeRemote(user.id, key, value);
        lastPushed.current = serialized;
      } catch {
        // retry on next change
      }
    }, 600);
  }, [key, value, user?.id]);

  return [value, setValue];
}
