// Google Calendar via Google Identity Services token client (browser-only OAuth).
// Requires VITE_GOOGLE_CLIENT_ID. No client secret — uses the implicit/token flow
// with read-only Calendar scope.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

declare global {
  interface Window {
    google?: any;
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(s);
  });
  return gisPromise;
}

export function getGoogleClientId(): string | null {
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || null;
}

export async function requestGoogleToken(): Promise<string> {
  const clientId = getGoogleClientId();
  if (!clientId) throw new Error("VITE_GOOGLE_CLIENT_ID is not set");
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new Error(resp.error || "Authorization failed"));
      },
    });
    client.requestAccessToken();
  });
}

export interface GoogleEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export async function fetchGoogleEvents(
  token: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<GoogleEvent[]> {
  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", rangeStart.toISOString());
  url.searchParams.set("timeMax", rangeEnd.toISOString());
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Google Calendar API ${res.status}`);
  const json = await res.json();
  return json.items || [];
}
