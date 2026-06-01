import { useState } from "react";
import { ChevronLeft, ChevronRight, Circle } from "lucide-react";

interface DailyEntry {
  date: string;
  energy: number;
  mood: number;
  productivity: number;
  flow: "heavy" | "medium" | "light" | "none";
  symptoms: string[];
  notes: string;
}

const MOOD_LABELS = ["Low", "Calm", "Good", "Great", "Vibrant"];
const ENERGY_LABELS = ["Resting", "Low", "Steady", "High", "Peak"];
const PRODUCTIVITY_LABELS = ["Slow", "Gentle", "Flow", "Focused", "Intense"];

export function DailyTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<Record<string, DailyEntry>>({});

  const dateKey = currentDate.toISOString().split("T")[0];
  const entry = entries[dateKey] || {
    date: dateKey,
    energy: 3,
    mood: 3,
    productivity: 3,
    flow: "none" as const,
    symptoms: [],
    notes: "",
  };

  const updateEntry = (updates: Partial<DailyEntry>) => {
    setEntries({
      ...entries,
      [dateKey]: { ...entry, ...updates },
    });
  };

  const navigateDay = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + offset);
    setCurrentDate(newDate);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateDay(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </h2>
        <button
          onClick={() => navigateDay(1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-8">
        <TrackerSlider
          label="How's your energy?"
          value={entry.energy}
          onChange={(energy) => updateEntry({ energy })}
          labels={ENERGY_LABELS}
        />

        <TrackerSlider
          label="How are you feeling?"
          value={entry.mood}
          onChange={(mood) => updateEntry({ mood })}
          labels={MOOD_LABELS}
        />

        <TrackerSlider
          label="How's your focus?"
          value={entry.productivity}
          onChange={(productivity) => updateEntry({ productivity })}
          labels={PRODUCTIVITY_LABELS}
        />

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <label className="block mb-4">Flow today?</label>
          <div className="flex gap-3">
            {(["none", "light", "medium", "heavy"] as const).map((level) => (
              <button
                key={level}
                onClick={() => updateEntry({ flow: level })}
                className={`px-6 py-3 rounded-xl transition-all ${
                  entry.flow === level
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted hover:bg-muted/70"
                }`}
              >
                {level === "none" ? "None" : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <label className="block mb-3">Notes for today</label>
          <textarea
            value={entry.notes}
            onChange={(e) => updateEntry({ notes: e.target.value })}
            placeholder="What did you notice about yourself today?"
            className="w-full h-24 p-4 rounded-xl bg-input-background border border-border resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
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
          {labels.map((_, idx) => (
            <button
              key={idx}
              onClick={() => onChange(idx + 1)}
              className="relative group"
            >
              <Circle
                className={`w-8 h-8 transition-all ${
                  value === idx + 1
                    ? "fill-primary stroke-primary"
                    : "stroke-muted-foreground hover:stroke-primary"
                }`}
                strokeWidth={2}
              />
            </button>
          ))}
        </div>
        <div className="relative h-2 bg-muted rounded-full">
          <div
            className="absolute h-full bg-primary rounded-full transition-all"
            style={{ width: `${((value - 1) / (labels.length - 1)) * 100}%` }}
          />
        </div>
        <p className="text-center text-sm text-muted-foreground">{labels[value - 1]}</p>
      </div>
    </div>
  );
}
