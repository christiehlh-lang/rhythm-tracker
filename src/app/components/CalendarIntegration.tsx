import { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { useLocalStorage, STORAGE_KEYS, type CalendarEvent } from "../../store";
import { parseIcs } from "../../utils/ics";

type Status =
  | { kind: "idle" }
  | { kind: "busy"; message: string }
  | { kind: "ok"; message: string }
  | { kind: "error"; message: string };

export function CalendarIntegration() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>(STORAGE_KEYS.events, []);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    setStatus({ kind: "busy", message: "Reading file…" });
    try {
      let next: CalendarEvent[];
      if (name.endsWith(".ics") || file.type === "text/calendar") {
        const text = await file.text();
        const parsed = parseIcs(text);
        if (!parsed.length) throw new Error("No events found in ICS");
        next = parsed.map((p) => ({
          id: `ics-${p.uid}`,
          source: "ics" as const,
          title: p.title,
          start: p.start,
          end: p.end,
          allDay: p.allDay,
        }));
      } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
        setStatus({ kind: "busy", message: "Loading PDF parser…" });
        const { extractPdfEvents } = await import("../../utils/pdf");
        setStatus({ kind: "busy", message: "Extracting events from PDF…" });
        const extracted = await extractPdfEvents(file);
        if (!extracted.length) {
          throw new Error(
            "Couldn't find any dated entries in this PDF. Try a clearer schedule or use an ICS export.",
          );
        }
        next = extracted.map((p) => ({
          id: p.uid,
          source: "ics" as const, // bucket under same source for now
          title: p.title,
          start: p.start,
          end: p.end,
          allDay: p.allDay,
        }));
      } else {
        throw new Error("Unsupported file type — upload .ics or .pdf");
      }
      setEvents(next);
      setStatus({ kind: "ok", message: `Imported ${next.length} events from ${file.name}` });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    } finally {
      e.target.value = "";
    }
  };

  const clearAll = () => {
    setEvents([]);
    setStatus({ kind: "idle" });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Calendar Integration</h2>
        <p className="text-muted-foreground">
          Upload a calendar export to see your schedule alongside your rhythm
        </p>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-6">
        <div className="flex items-center gap-3">
          <Upload className="w-6 h-6 text-primary" />
          <h3 className="text-xl">Upload schedule</h3>
        </div>

        <p className="text-sm text-muted-foreground">
          Drop in a <code>.ics</code> file (exported from Apple Calendar, Google Calendar,
          Outlook, Notion, etc.) or a <code>.pdf</code> schedule. Everything is parsed locally —
          nothing leaves your device.
        </p>

        <label className="block">
          <input
            type="file"
            accept=".ics,.pdf,text/calendar,application/pdf"
            onChange={handleFile}
            className="block w-full text-sm file:mr-4 file:py-3 file:px-5 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
          />
        </label>

        <StatusLine status={status} />

        <div className="p-4 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground/80">A note on PDF extraction</p>
          <p>
            PDFs have no standard event format, so extraction is best-effort: we scan for dates
            (Jan 5, 2026 / 01/05/26 / 2026-01-05) and optional times on each line. Itineraries
            and printed schedules usually work; heavily designed layouts may miss entries. For
            full fidelity, export an .ics whenever possible.
          </p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center justify-between text-sm pt-4 border-t border-border">
            <span className="text-muted-foreground">
              {events.length} events stored — open the Calendar tab to view
            </span>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Clear all
            </button>
          </div>
        )}
      </div>
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
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{status.message}</span>
    </p>
  );
}
