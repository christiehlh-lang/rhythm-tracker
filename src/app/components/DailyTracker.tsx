import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Circle, Clock, RotateCcw } from "lucide-react";
import { useLocalStorage, STORAGE_KEYS, type CheckIn, type DailyEntry } from "../../store";

const MOOD_LABELS = ["Low", "Calm", "Good", "Great", "Vibrant"];
const ENERGY_LABELS = ["Resting", "Low", "Steady", "High", "Peak"];
const PRODUCTIVITY_LABELS = ["Slow", "Gentle", "Flow", "Focused", "Intense"];
const FLOW_OPTIONS = ["none", "light", "medium", "heavy"] as const;

interface Draft {
  energy: number;
  mood: number;
  productivity: number;
  flow: (typeof FLOW_OPTIONS)[number];
  notes: string;
}

const EMPTY_DRAFT: Draft = {
  energy: 3,
  mood: 3,
  productivity: 3,
  flow: "none",
  notes: "",
};

export function DailyTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useLocalStorage<Record<string, DailyEntry>>(STORAGE_KEYS.daily, {});
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const dateKey = currentDate.toISOString().split("T")[0];
  const entry = entries[dateKey];
  const checkIns: CheckIn[] = entry?.checkIns ?? [];
  const latest = checkIns[checkIns.length - 1];

  // When the day changes, seed the draft from the latest check-in if any.
  useEffect(() => {
    if (latest) {
      setDraft({
        energy: latest.energy,
        mood: latest.mood,
        productivity: latest.productivity,
        flow: latest.flow,
        notes: "",
      });
    } else {
      setDraft(EMPTY_DRAFT);
    }
    setJustSaved(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const navigateDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  const submit = () => {
    const newCheckIn: CheckIn = {
      timestamp: new Date().toISOString(),
      energy: draft.energy,
      mood: draft.mood,
      productivity: draft.productivity,
      flow: draft.flow,
      notes: draft.notes.trim(),
    };
    const nextEntries: Record<string, DailyEntry> = {
      ...entries,
      [dateKey]: {
        date: dateKey,
        energy: draft.energy,
        mood: draft.mood,
        productivity: draft.productivity,
        flow: draft.flow,
        notes: draft.notes.trim(),
        symptoms: entry?.symptoms ?? [],
        checkIns: [...checkIns, newCheckIn],
      },
    };
    setEntries(nextEntries);
    setJustSaved(newCheckIn.timestamp);
    setDraft((d) => ({ ...d, notes: "" }));
  };

  const deleteCheckIn = (timestamp: string) => {
    const remaining = checkIns.filter((c) => c.timestamp !== timestamp);
    const last = remaining[remaining.length - 1];
    setEntries({
      ...entries,
      [dateKey]: last
        ? {
            ...entry!,
            energy: last.energy,
            mood: last.mood,
            productivity: last.productivity,
            flow: last.flow,
            notes: last.notes,
            checkIns: remaining,
          }
        : { ...(entry as DailyEntry), checkIns: [] },
    });
  };

  const isToday = dateKey === new Date().toISOString().split("T")[0];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateDay(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <h2 className="text-2xl">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h2>
          {checkIns.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {checkIns.length} check-in{checkIns.length === 1 ? "" : "s"} today
            </p>
          )}
        </div>
        <button
          onClick={() => navigateDay(1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {justSaved && (
        <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm">
              Check-in saved at{" "}
              {new Date(justSaved).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </p>
            <p className="text-xs text-muted-foreground">Come back any time to log how you're feeling.</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <TrackerSlider
          label="How's your energy?"
          value={draft.energy}
          onChange={(energy) => setDraft({ ...draft, energy })}
          labels={ENERGY_LABELS}
        />

        <TrackerSlider
          label="How are you feeling?"
          value={draft.mood}
          onChange={(mood) => setDraft({ ...draft, mood })}
          labels={MOOD_LABELS}
        />

        <TrackerSlider
          label="How's your focus?"
          value={draft.productivity}
          onChange={(productivity) => setDraft({ ...draft, productivity })}
          labels={PRODUCTIVITY_LABELS}
        />

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <label className="block mb-4">Flow today?</label>
          <div className="grid grid-cols-4 gap-2">
            {FLOW_OPTIONS.map((level) => {
              const selected = draft.flow === level;
              return (
                <button
                  key={level}
                  onClick={() => setDraft({ ...draft, flow: level })}
                  className={`relative px-3 py-3 rounded-xl transition-all ${
                    selected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted hover:bg-muted/70"
                  }`}
                >
                  {selected && (
                    <Check className="absolute top-1 right-1 w-3 h-3 opacity-80" />
                  )}
                  {level === "none" ? "None" : level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <label className="block mb-3">Notes for this check-in</label>
          <textarea
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            placeholder="What did you notice about yourself just now?"
            className="w-full h-24 p-4 rounded-xl bg-input-background border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={submit}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-all shadow-md"
        >
          <Check className="w-5 h-5" />
          {checkIns.length > 0 ? "Save another check-in" : "Save check-in"}
        </button>

        {!isToday && (
          <p className="text-center text-xs text-muted-foreground">
            You're editing a past day — submissions are timestamped to now.
          </p>
        )}
      </div>

      {checkIns.length > 0 && (
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Today's check-ins</h3>
            <button
              onClick={() => setDraft(EMPTY_DRAFT)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset form
            </button>
          </div>
          {[...checkIns].reverse().map((c) => (
            <div
              key={c.timestamp}
              className="bg-card border border-border rounded-xl p-4 flex items-start gap-3"
            >
              <Clock className="w-4 h-4 text-muted-foreground mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {new Date(c.timestamp).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Energy {c.energy}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary/30 text-foreground/80">
                    Mood {c.mood}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-accent/30 text-foreground/80">
                    Focus {c.productivity}
                  </span>
                  {c.flow !== "none" && (
                    <span className="px-2 py-0.5 rounded-full bg-muted">Flow: {c.flow}</span>
                  )}
                </div>
                {c.notes && (
                  <p className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">
                    {c.notes}
                  </p>
                )}
              </div>
              <button
                onClick={() => deleteCheckIn(c.timestamp)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TrackerSlider({
  label,
  value,
  onChange,
  labels,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  labels: string[];
}) {
  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
      <label className="block mb-4">{label}</label>
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          {labels.map((_, idx) => {
            const selected = value === idx + 1;
            return (
              <button
                key={idx}
                onClick={() => onChange(idx + 1)}
                className="relative group"
                aria-label={labels[idx]}
              >
                <Circle
                  className={`w-9 h-9 transition-all ${
                    selected
                      ? "fill-primary stroke-primary"
                      : "stroke-muted-foreground/60 hover:stroke-primary"
                  }`}
                  strokeWidth={2}
                />
                {selected && (
                  <Check className="absolute inset-0 m-auto w-4 h-4 text-primary-foreground" />
                )}
              </button>
            );
          })}
        </div>
        <div className="relative h-2 bg-muted rounded-full">
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: `${((value - 1) / (labels.length - 1)) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground/70 px-1">
          {labels.map((l, i) => (
            <span key={l} className={i + 1 === value ? "text-primary font-medium" : ""}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
