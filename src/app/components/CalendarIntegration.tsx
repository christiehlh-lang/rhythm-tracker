import { useState } from "react";
import { Upload, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import {
  useLocalStorage,
  STORAGE_KEYS,
  type CalendarEvent,
  type NotionConfig,
} from "../../store";
import { parseIcs } from "../../utils/ics";
import {
  fetchGoogleEvents,
  getGoogleClientId,
  requestGoogleToken,
} from "../../utils/google";

type Status =
  | { kind: "idle" }
  | { kind: "busy"; message: string }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function CalendarIntegration() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>(STORAGE_KEYS.events, []);
  const [notion, setNotion] = useLocalStorage<NotionConfig>(STORAGE_KEYS.notion, {
    token: "",
    databaseId: "",
  });

  const counts = {
    ics: events.filter((e) => e.source === "ics").length,
    google: events.filter((e) => e.source === "google").length,
    notion: events.filter((e) => e.source === "notion").length,
  };

  const replaceSource = (source: CalendarEvent["source"], next: CalendarEvent[]) => {
    setEvents((prev) => [...prev.filter((e) => e.source !== source), ...next]);
  };

  const clearSource = (source: CalendarEvent["source"]) => {
    setEvents((prev) => prev.filter((e) => e.source !== source));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Calendar Integration</h2>
        <p className="text-muted-foreground">
          Connect your schedule to see how it aligns with your rhythm
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IcsCard
          count={counts.ics}
          onImport={(parsed) =>
            replaceSource(
              "ics",
              parsed.map((p) => ({
                id: `ics-${p.uid}`,
                source: "ics",
                title: p.title,
                start: p.start,
                end: p.end,
                allDay: p.allDay,
              })),
            )
          }
          onClear={() => clearSource("ics")}
        />

        <GoogleCard
          count={counts.google}
          onImport={(items) => replaceSource("google", items)}
          onClear={() => clearSource("google")}
        />

        <NotionCard
          config={notion}
          onChange={setNotion}
          count={counts.notion}
          onClear={() => clearSource("notion")}
        />

        <SummaryCard total={events.length} />
      </div>
    </div>
  );
}

function Card(props: { children: React.ReactNode }) {
  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
      {props.children}
    </div>
  );
}

function StatusLine({ status }: { status: Status }) {
  if (status.kind === "idle") return null;
  const tone =
    status.kind === "error"
      ? "text-destructive"
      : status.kind === "ok"
        ? "text-primary"
        : "text-muted-foreground";
  const Icon = status.kind === "error" ? AlertCircle : status.kind === "ok" ? CheckCircle2 : null;
  return (
    <p className={`flex items-center gap-2 text-sm ${tone}`}>
      {Icon && <Icon className="w-4 h-4" />}
      <span>{status.message}</span>
    </p>
  );
}

function IcsCard({
  count,
  onImport,
  onClear,
}: {
  count: number;
  onImport: (parsed: ReturnType<typeof parseIcs>) => void;
  onClear: () => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus({ kind: "busy", message: "Parsing…" });
    try {
      const text = await file.text();
      const parsed = parseIcs(text);
      if (!parsed.length) throw new Error("No events found in file");
      onImport(parsed);
      setStatus({ kind: "ok", message: `Imported ${parsed.length} events` });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    } finally {
      e.target.value = "";
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <Upload className="w-5 h-5 text-primary" />
        <h3 className="text-xl">ICS Upload</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Export a .ics file from any calendar (Apple, Outlook, Google) and drop it in. Parsed
        locally — nothing leaves your device.
      </p>
      <label className="block">
        <input
          type="file"
          accept=".ics,text/calendar"
          onChange={handleFile}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
      </label>
      <StatusLine status={status} />
      <SourceFooter count={count} onClear={onClear} label="ICS events" />
    </Card>
  );
}

function GoogleCard({
  count,
  onImport,
  onClear,
}: {
  count: number;
  onImport: (events: CalendarEvent[]) => void;
  onClear: () => void;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const clientId = getGoogleClientId();

  const connect = async () => {
    setStatus({ kind: "busy", message: "Waiting for Google sign-in…" });
    try {
      const token = await requestGoogleToken();
      setStatus({ kind: "busy", message: "Fetching events…" });
      const start = new Date();
      start.setMonth(start.getMonth() - 1);
      const end = new Date();
      end.setMonth(end.getMonth() + 3);
      const items = await fetchGoogleEvents(token, start, end);
      const mapped: CalendarEvent[] = items
        .map((i) => {
          const startIso = i.start.dateTime || (i.start.date ? `${i.start.date}T00:00:00` : null);
          const endIso = i.end?.dateTime || (i.end?.date ? `${i.end.date}T00:00:00` : null);
          if (!startIso) return null;
          return {
            id: `google-${i.id}`,
            source: "google" as const,
            title: i.summary || "(untitled)",
            start: new Date(startIso).toISOString(),
            end: endIso ? new Date(endIso).toISOString() : null,
            allDay: !i.start.dateTime,
          };
        })
        .filter((x): x is CalendarEvent => x !== null);
      onImport(mapped);
      setStatus({ kind: "ok", message: `Imported ${mapped.length} events` });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-3">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="text-xl">Google Calendar</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Read-only sync of your primary calendar via Google OAuth. Token is stored in this browser
        only.
      </p>
      {!clientId ? (
        <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
          <p className="font-medium">Setup required</p>
          <p className="text-muted-foreground">
            Set <code>VITE_GOOGLE_CLIENT_ID</code> at build time. Create an OAuth client in Google
            Cloud Console (type: Web), add this origin to authorized origins, and rebuild.
          </p>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={status.kind === "busy"}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all text-sm"
        >
          Connect Google Calendar
        </button>
      )}
      <StatusLine status={status} />
      <SourceFooter count={count} onClear={onClear} label="Google events" />
    </Card>
  );
}

function NotionCard({
  config,
  onChange,
  count,
  onClear,
}: {
  config: NotionConfig;
  onChange: (next: NotionConfig) => void;
  count: number;
  onClear: () => void;
}) {
  const [status] = useState<Status>({ kind: "idle" });

  return (
    <Card>
      <div className="flex items-center gap-3">
        <CalendarIcon className="w-5 h-5 text-primary" />
        <h3 className="text-xl">Notion</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Save your Notion integration token and a database ID. Storing them here readies the
        connection — fetching live requires a server proxy (see note below).
      </p>
      <div className="space-y-2">
        <input
          type="password"
          placeholder="Notion integration token (secret_…)"
          value={config.token}
          onChange={(e) => onChange({ ...config, token: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="text"
          placeholder="Database ID"
          value={config.databaseId}
          onChange={(e) => onChange({ ...config, databaseId: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
        <p className="font-medium flex items-center gap-2">
          <AlertCircle className="w-3 h-3" /> Backend proxy needed
        </p>
        <p className="text-muted-foreground">
          Notion's API doesn't allow browser requests (no CORS). Credentials are saved locally;
          live import will activate once a serverless proxy at <code>/api/notion</code> is
          deployed.
        </p>
      </div>
      <StatusLine status={status} />
      <SourceFooter count={count} onClear={onClear} label="Notion events" />
    </Card>
  );
}

function SourceFooter({
  count,
  onClear,
  label,
}: {
  count: number;
  onClear: () => void;
  label: string;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
      <span className="text-muted-foreground">
        {count} {label} stored
      </span>
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="w-3 h-3" />
        Clear
      </button>
    </div>
  );
}

function SummaryCard({ total }: { total: number }) {
  return (
    <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20 flex flex-col justify-center">
      <p className="text-sm text-foreground/80">
        {total === 0
          ? "No events imported yet. Connect a source to overlay your schedule on the calendar view."
          : `${total} events ready. Switch to the Calendar tab to see them alongside your energy and mood.`}
      </p>
    </div>
  );
}
