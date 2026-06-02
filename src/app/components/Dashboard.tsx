import { Circle, Brain, Timer, Moon, TrendingUp, Calendar, Link as LinkIcon, ChevronRight } from "lucide-react";
import { useLocalStorage, STORAGE_KEYS, type DailyEntry } from "../../store";
import type { Tab } from "../App";

interface Props {
  onNavigate: (tab: Tab) => void;
}

export function Dashboard({ onNavigate }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const currentPhase = getMoonPhase(new Date());
  const todayKey = new Date().toISOString().split("T")[0];

  const [entries] = useLocalStorage<Record<string, DailyEntry>>(STORAGE_KEYS.daily, {});
  const todayEntry = entries[todayKey];
  const checkInCount = (todayEntry as DailyEntry & { checkIns?: unknown[] })?.checkIns?.length ?? (todayEntry ? 1 : 0);

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
        <Card
          onClick={() => onNavigate("today")}
          icon={<Circle className="w-6 h-6 text-primary" />}
          iconBg="bg-primary/20"
          title="Today's Check-in"
          subtitle={
            checkInCount > 0
              ? `${checkInCount} check-in${checkInCount === 1 ? "" : "s"} today — log another`
              : "Take a moment to notice how you're feeling right now"
          }
          status={
            todayEntry ? (
              <div className="flex items-center gap-3 text-sm">
                <Pill label="Energy" value={todayEntry.energy} />
                <Pill label="Mood" value={todayEntry.mood} />
                <Pill label="Focus" value={todayEntry.productivity} />
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">No check-in yet</span>
            )
          }
        />

        <Card
          onClick={() => onNavigate("rhythm")}
          icon={<Moon className="w-6 h-6 text-accent" />}
          iconBg="bg-accent/30"
          title="Your Rhythm"
          subtitle="Track your cycle and see how it aligns with the moon"
          status={<span className="text-sm text-muted-foreground">Current moon: {currentPhase}</span>}
        />

        <Card
          onClick={() => onNavigate("brain-dump")}
          icon={<Brain className="w-6 h-6 text-secondary" />}
          iconBg="bg-secondary/30"
          title="Brain Dump"
          subtitle="Empty your mind onto the page — no structure needed"
          status={<span className="text-sm text-muted-foreground">Free-form thoughts and ideas</span>}
        />

        <Card
          onClick={() => onNavigate("tasks")}
          icon={<Timer className="w-6 h-6 text-chart-3" />}
          iconBg="bg-chart-3/30"
          title="Tasks & Focus"
          subtitle="Time-box your work around your natural energy"
          status={<span className="text-sm text-muted-foreground">Flexible task timer</span>}
        />

        <Card
          onClick={() => onNavigate("calendar")}
          icon={<Calendar className="w-6 h-6 text-primary" />}
          iconBg="bg-primary/20"
          title="Calendar"
          subtitle="See your schedule alongside your rhythm"
          status={<span className="text-sm text-muted-foreground">Energy and events together</span>}
        />

        <Card
          onClick={() => onNavigate("integrations")}
          icon={<LinkIcon className="w-6 h-6 text-accent" />}
          iconBg="bg-accent/30"
          title="Connect"
          subtitle="Upload ICS or PDF schedules"
          status={<span className="text-sm text-muted-foreground">Import events</span>}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <button
          onClick={() => onNavigate("insights")}
          className="bg-card p-8 rounded-2xl shadow-sm border border-border text-left hover:shadow-md hover:border-primary/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3>This Week's Pattern</h3>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
        </button>

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

function Card({
  onClick,
  icon,
  iconBg,
  title,
  subtitle,
  status,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  status: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-card p-8 rounded-2xl shadow-sm border border-border text-left hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <h3 className="text-xl">{title}</h3>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      {status}
    </button>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
      {label} {value}/5
    </span>
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
