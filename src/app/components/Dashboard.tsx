import { Circle, Calendar, Brain, Timer, Moon, TrendingUp } from "lucide-react";
import { useLocalStorage, STORAGE_KEYS, type DailyEntry } from "../../store";

export function Dashboard() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const currentPhase = getMoonPhase(new Date());

  const [entries] = useLocalStorage<Record<string, DailyEntry>>(STORAGE_KEYS.daily, {});
  const weekEntries = Array.from({ length: 7 })
    .map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return entries[d.toISOString().split("T")[0]];
    })
    .filter(Boolean) as DailyEntry[];
  const avg = (key: "energy" | "mood") =>
    weekEntries.length
      ? Math.round(weekEntries.reduce((s, e) => s + e[key], 0) / weekEntries.length)
      : 0;
  const avgEnergy = avg("energy");
  const avgMood = avg("mood");

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2 mb-12">
        <h1 className="text-4xl">Welcome back</h1>
        <p className="text-muted-foreground">{today}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Circle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl">Today's Check-in</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Take a moment to notice how you're feeling right now
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary">•</span>
            <span className="text-muted-foreground">Energy, mood, and focus tracking</span>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/30 flex items-center justify-center">
              <Moon className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl">Your Rhythm</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Track your cycle and see how it aligns with the moon
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-accent">•</span>
            <span className="text-muted-foreground">Current moon: {currentPhase}</span>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-secondary/30 flex items-center justify-center">
              <Brain className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-xl">Brain Dump</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Empty your mind onto the page—no structure needed
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-secondary">•</span>
            <span className="text-muted-foreground">Free-form thoughts and ideas</span>
          </div>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-chart-3/30 flex items-center justify-center">
              <Timer className="w-6 h-6 text-chart-3" />
            </div>
            <h3 className="text-xl">Tasks & Focus</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Time-box your work around your natural energy
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-chart-3">•</span>
            <span className="text-muted-foreground">Flexible task timer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-4 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3>This Week's Pattern</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Energy</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-6 rounded-sm ${i <= avgEnergy ? "bg-primary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Mood</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-6 rounded-sm ${i <= avgMood ? "bg-secondary" : "bg-muted"}`}
                  />
                ))}
              </div>
            </div>
            {weekEntries.length === 0 && (
              <p className="text-xs text-muted-foreground italic pt-2">
                No check-ins yet this week.
              </p>
            )}
          </div>
        </div>

        <div className="bg-primary/10 p-8 rounded-2xl border border-primary/20">
          <p className="text-sm italic text-foreground/80">
            "Your rhythm is yours alone. Some days you'll flow, some days you'll rest. Both are
            exactly what you need."
          </p>
        </div>
      </div>
    </div>
  );
}

function getMoonPhase(date: Date): string {
  const phases = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];

  const knownNewMoon = new Date("2000-01-06");
  const synodicMonth = 29.53059;

  const diff = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  const phase = ((diff % synodicMonth) / synodicMonth) * 8;

  return phases[Math.floor(phase)];
}
