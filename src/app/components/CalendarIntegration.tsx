import { useState } from "react";
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Pencil,
  Calendar as CalendarIcon,
  Clock,
  Save,
  X,
  Plus,
} from "lucide-react";
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
        setStatus({ kind: "busy", message: "Reading PDF…" });
        const { extractPdfText, extractPdfEvents } = await import("../../utils/pdf");
        const text = await extractPdfText(file);

        let extracted: { title: string; start: string; end: string | null; allDay: boolean }[] = [];
        setStatus({ kind: "busy", message: "Extracting shifts with AI…" });
        try {
          const res = await fetch("/api/extract-events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              text,
              filename: file.name,
              today: new Date().toISOString().slice(0, 10),
            }),
          });
          if (res.ok) {
            const data = await res.json();
            extracted = (data.events ?? []).map((e: any, i: number) => ({
              title: e.title,
              start: e.start,
              end: e.end ?? null,
              allDay: Boolean(e.allDay),
              uid: `pdf-ai-${i}-${e.start}`,
            })) as any;
          }
        } catch {
          // fall through to heuristic
        }

        // Fallback: line-by-line heuristic if AI not configured or returned nothing.
        if (!extracted.length) {
          setStatus({ kind: "busy", message: "Falling back to local extractor…" });
          const heur = await extractPdfEvents(file);
          extracted = heur.map((h) => ({
            title: h.title,
            start: h.start,
            end: h.end,
            allDay: h.allDay,
            uid: h.uid,
          })) as any;
        }

        if (!extracted.length) {
          throw new Error(
            "Couldn't find any events in this PDF. Try an ICS export or add events manually below.",
          );
        }
        next = extracted.map((p: any, i) => ({
          id: p.uid ?? `pdf-${i}-${p.start}`,
          source: "ics" as const,
          title: p.title,
          start: p.start,
          end: p.end,
          allDay: p.allDay,
        }));
      } else {
        throw new Error("Unsupported file type — upload .ics or .pdf");
      }
      // Merge rather than replace — preserves anything the user has manually
      // added or edited from a previous import.
      setEvents((prev) => mergeById(prev, next));
      setStatus({
        kind: "ok",
        message: `Imported ${next.length} events from ${file.name}. Review and edit below.`,
      });
    } catch (err) {
      setStatus({ kind: "error", message: (err as Error).message });
    } finally {
      e.target.value = "";
    }
  };

  const updateEvent = (id: string, patch: Partial<CalendarEvent>) => {
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAll = () => {
    if (!confirm("Remove all imported events? This can't be undone.")) return;
    setEvents([]);
    setStatus({ kind: "idle" });
  };

  const addBlank = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    setEvents((prev) => [
      ...prev,
      {
        id: `manual-${crypto.randomUUID()}`,
        source: "ics",
        title: "New event",
        start: now.toISOString(),
        end: null,
        allDay: false,
      },
    ]);
  };

  const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Calendar Integration</h2>
        <p className="text-muted-foreground">
          Upload a calendar export to see your schedule alongside your rhythm
        </p>
      </div>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-primary" />
          <h3 className="text-lg">Upload schedule</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Drop in a <code>.ics</code> file or a <code>.pdf</code> schedule (rosters, itineraries).
          PDFs are read locally and the text is sent to an AI extractor that pulls out the shifts
          for you to review and edit before they hit your calendar. New imports merge with
          existing events.
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
      </div>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <h3 className="text-lg">Imported events ({events.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={addBlank}
              className="px-3 py-1.5 rounded-lg bg-muted text-sm hover:bg-muted/70 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
            {events.length > 0 && (
              <button
                onClick={clearAll}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear all
              </button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center">
            No events yet. Upload a file above, or add one manually.
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((ev) => (
              <EventRow
                key={ev.id}
                event={ev}
                onChange={(patch) => updateEvent(ev.id, patch)}
                onDelete={() => deleteEvent(ev.id)}
              />
            ))}
          </ul>
        )}

        <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          Edits and additions sync to your Calendar tab automatically.
        </div>
      </div>
    </div>
  );
}

function EventRow({
  event,
  onChange,
  onDelete,
}: {
  event: CalendarEvent;
  onChange: (patch: Partial<CalendarEvent>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: event.title,
    date: event.start.slice(0, 10),
    time: event.allDay ? "" : event.start.slice(11, 16),
    allDay: event.allDay,
  });

  const save = () => {
    const base = draft.allDay
      ? `${draft.date}T00:00:00`
      : `${draft.date}T${draft.time || "09:00"}:00`;
    const start = new Date(base).toISOString();
    onChange({ title: draft.title.trim() || "(untitled)", start, allDay: draft.allDay });
    setEditing(false);
  };

  const cancel = () => {
    setDraft({
      title: event.title,
      date: event.start.slice(0, 10),
      time: event.allDay ? "" : event.start.slice(11, 16),
      allDay: event.allDay,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <li className="bg-background border border-primary/40 rounded-xl p-3 space-y-2">
        <input
          type="text"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Event title"
          className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {!draft.allDay && (
            <input
              type="time"
              value={draft.time}
              onChange={(e) => setDraft({ ...draft, time: e.target.value })}
              className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.allDay}
              onChange={(e) => setDraft({ ...draft, allDay: e.target.checked })}
            />
            All day
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={cancel}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            onClick={save}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </li>
    );
  }

  const date = new Date(event.start);
  return (
    <li className="bg-background border border-border rounded-xl p-3 flex items-center gap-3 group">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center text-primary flex-shrink-0">
        <span className="text-[10px] uppercase tracking-wider">
          {date.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-sm font-medium leading-none">{date.getDate()}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{event.title}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {event.allDay
            ? "All day"
            : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Edit"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
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

function mergeById(existing: CalendarEvent[], incoming: CalendarEvent[]): CalendarEvent[] {
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const e of incoming) byId.set(e.id, e);
  return [...byId.values()];
}
