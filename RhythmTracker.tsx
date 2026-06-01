import { useState } from "react";
import { Moon, ChevronLeft, ChevronRight, Droplets } from "lucide-react";

export function RhythmTracker() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycleStart, setCycleStart] = useState<Date | null>(null);
  const [cycleLength, setCycleLength] = useState(28);

  const navigateMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const getMoonPhase = (date: Date): { phase: string; emoji: string } => {
    const phases = [
      { phase: "New Moon", emoji: "🌑" },
      { phase: "Waxing Crescent", emoji: "🌒" },
      { phase: "First Quarter", emoji: "🌓" },
      { phase: "Waxing Gibbous", emoji: "🌔" },
      { phase: "Full Moon", emoji: "🌕" },
      { phase: "Waning Gibbous", emoji: "🌖" },
      { phase: "Last Quarter", emoji: "🌗" },
      { phase: "Waning Crescent", emoji: "🌘" },
    ];

    const knownNewMoon = new Date("2000-01-06");
    const synodicMonth = 29.53059;

    const diff = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const phaseIndex = Math.floor(((diff % synodicMonth) / synodicMonth) * 8);

    return phases[phaseIndex];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getCyclePhase = (date: Date): string | null => {
    if (!cycleStart) return null;

    const diffTime = date.getTime() - cycleStart.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return null;

    const cycleDay = (diffDays % cycleLength) + 1;

    if (cycleDay <= 5) return "menstrual";
    if (cycleDay <= 13) return "follicular";
    if (cycleDay <= 17) return "ovulatory";
    return "luteal";
  };

  const getPhaseColor = (phase: string | null) => {
    switch (phase) {
      case "menstrual":
        return "bg-destructive/60";
      case "follicular":
        return "bg-primary/60";
      case "ovulatory":
        return "bg-accent/60";
      case "luteal":
        return "bg-secondary/60";
      default:
        return "bg-background";
    }
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const currentMoonPhase = getMoonPhase(new Date());

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Your Rhythm</h2>
        <p className="text-muted-foreground">
          Track your cycle alongside the moon's phases
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Moon className="w-6 h-6 text-primary" />
            <h3 className="text-xl">Moon Phase</h3>
          </div>
          <div className="text-center space-y-4">
            <div className="text-6xl">{currentMoonPhase.emoji}</div>
            <div>
              <p className="text-lg">{currentMoonPhase.phase}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Droplets className="w-6 h-6 text-destructive" />
            <h3 className="text-xl">Cycle Settings</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                First day of last cycle
              </label>
              <input
                type="date"
                value={cycleStart?.toISOString().split("T")[0] || ""}
                onChange={(e) => setCycleStart(e.target.value ? new Date(e.target.value) : null)}
                className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Average cycle length (days)
              </label>
              <input
                type="number"
                value={cycleLength}
                onChange={(e) => setCycleLength(parseInt(e.target.value) || 28)}
                min="20"
                max="40"
                className="w-full px-4 py-2 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h3 className="text-xl">
            {currentDate.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const cyclePhase = getCyclePhase(date);
            const moonPhase = getMoonPhase(date);
            const isToday =
              day === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={day}
                className={`aspect-square rounded-xl p-2 transition-all ${
                  isToday ? "ring-2 ring-primary" : ""
                } ${cyclePhase ? getPhaseColor(cyclePhase) : "bg-background border border-border"}`}
              >
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  <span className="text-sm">{day}</span>
                  <span className="text-xs">{moonPhase.emoji}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-border space-y-3">
          <h4 className="text-sm font-medium mb-3">Cycle Phases</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/60" />
              <span className="text-muted-foreground">Menstrual (Days 1-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary/60" />
              <span className="text-muted-foreground">Follicular (Days 6-13)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-accent/60" />
              <span className="text-muted-foreground">Ovulatory (Days 14-17)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary/60" />
              <span className="text-muted-foreground">Luteal (Days 18-28)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
        <p className="text-sm italic text-foreground/80 text-center">
          Your cycle is a rhythm, not a rule. The moon reminds us that everything moves in phases—
          each one necessary, each one temporary.
        </p>
      </div>
    </div>
  );
}
