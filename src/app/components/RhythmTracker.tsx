import { useState } from "react";
import { Droplets, Moon, Plus, Trash2 } from "lucide-react";
import { useLocalStorage, STORAGE_KEYS, type CycleSettings, type PeriodEntry } from "../../store";
import {
  averageCycleLength,
  moonPhase,
  normalizePeriods,
  phasesFor,
  todayCycleStatus,
} from "../../cycle";

export function RhythmTracker() {
  const [settings, setSettings] = useLocalStorage<CycleSettings>(STORAGE_KEYS.cycle, {
    periods: [],
    cycleLength: 28,
  });

  const periods = normalizePeriods(settings);
  const today = new Date();
  const status = todayCycleStatus(settings, today);
  const cycleLength = status?.cycleLength ?? averageCycleLength(periods, settings.cycleLength);
  const phases = phasesFor(cycleLength);
  const moon = moonPhase(today);

  const [newStart, setNewStart] = useState<string>(today.toISOString().slice(0, 10));

  const addPeriod = () => {
    if (!newStart) return;
    const id = crypto.randomUUID();
    const next: PeriodEntry[] = [...periods, { id, start: newStart }];
    setSettings({ ...settings, periods: next, cycleLength: averageCycleLength(next, cycleLength) });
  };

  const removePeriod = (id: string) => {
    const next = periods.filter((p) => p.id !== id);
    setSettings({ ...settings, periods: next, cycleLength: averageCycleLength(next, cycleLength) });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl">Your Rhythm</h2>
        <p className="text-muted-foreground">
          Track your cycle alongside the moon and plan around your energy
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card p-6 rounded-2xl shadow-sm border border-border">
          <PhaseWheel
            phases={phases}
            cycleLength={cycleLength}
            currentDay={status?.cycleDay ?? null}
          />
        </div>

        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
          <h3 className="text-lg">Today</h3>
          {status ? (
            <>
              <div>
                <p className="text-3xl font-light">Day {status.cycleDay}</p>
                <p className="text-sm text-muted-foreground">{status.phase.label}</p>
              </div>
              <div className="text-sm space-y-1 pt-2 border-t border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next period</span>
                  <span>
                    {status.daysUntilNext === 0
                      ? "today"
                      : `in ${status.daysUntilNext} day${status.daysUntilNext === 1 ? "" : "s"}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cycle length</span>
                  <span>{cycleLength} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Moon</span>
                  <span>
                    {moon.emoji} {moon.phase}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Log your first period below to start tracking.
            </p>
          )}
        </div>
      </div>

      {status && (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${status.phase.color}`} />
            <h3 className="text-lg">This week's forecast</h3>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed">{status.phase.forecast}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {status.phase.suggestions.map((s) => (
              <div
                key={s.kind}
                className="p-4 rounded-xl bg-background border border-border space-y-1"
              >
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.kind}</p>
                <p className="text-sm">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
        <div className="flex items-center gap-3">
          <Droplets className="w-5 h-5 text-destructive" />
          <h3 className="text-lg">Periods</h3>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="date"
            value={newStart}
            onChange={(e) => setNewStart(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={addPeriod}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add period
          </button>
        </div>

        {periods.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No periods logged yet.</p>
        ) : (
          <ul className="space-y-2">
            {[...periods].reverse().map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background border border-border group"
              >
                <div>
                  <p className="text-sm">
                    {new Date(`${p.start}T00:00:00`).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => removePeriod(p.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {periods.length >= 2 && (
          <p className="text-xs text-muted-foreground">
            Average cycle length learned from your data: <span className="text-foreground">{cycleLength} days</span>.
          </p>
        )}
      </div>

      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
        <p className="text-sm italic text-foreground/80 text-center">
          Your cycle is a rhythm, not a rule. Each phase is necessary, each one temporary.
        </p>
      </div>
    </div>
  );
}

function PhaseWheel({
  phases,
  cycleLength,
  currentDay,
}: {
  phases: ReturnType<typeof phasesFor>;
  cycleLength: number;
  currentDay: number | null;
}) {
  const size = 320;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 130;
  const stroke = 32;

  // Map phase day-range to angle (0deg at top, clockwise).
  const dayToAngle = (day: number) => ((day - 0.5) / cycleLength) * 360;

  const polar = (angleDeg: number, r: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arc = (startAngle: number, endAngle: number) => {
    const start = polar(startAngle, radius);
    const end = polar(endAngle, radius);
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const arcColor = (key: string) =>
    key === "menstrual"
      ? "#e07a7a"
      : key === "follicular"
        ? "#d4a59a"
        : key === "ovulatory"
          ? "#b8d4a8"
          : "#c5b8d6";

  const markerAngle = currentDay ? dayToAngle(currentDay) : 0;
  const marker = polar(markerAngle, radius);
  const phaseLabelRadius = radius + stroke / 2 + 18;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] h-auto">
        {phases.map((p) => {
          const startA = dayToAngle(p.startDay);
          const endA = dayToAngle(Math.min(p.endDay, cycleLength) + 1) - 0.5;
          return (
            <path
              key={p.key}
              d={arc(startA, endA)}
              fill="none"
              stroke={arcColor(p.key)}
              strokeWidth={stroke}
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        })}

        {phases.map((p) => {
          const mid = (dayToAngle(p.startDay) + dayToAngle(Math.min(p.endDay, cycleLength))) / 2;
          const pt = polar(mid, phaseLabelRadius);
          return (
            <text
              key={`label-${p.key}`}
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 11 }}
            >
              {p.shortLabel}
            </text>
          );
        })}

        {currentDay && (
          <>
            <circle cx={marker.x} cy={marker.y} r={12} fill="white" stroke="#545454" strokeWidth={2} />
            <circle cx={marker.x} cy={marker.y} r={5} fill="#545454" />
          </>
        )}

        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground"
          style={{ fontSize: 36, fontWeight: 300 }}
        >
          {currentDay ?? "—"}
        </text>
        <text
          x={cx}
          y={cy + 22}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-muted-foreground"
          style={{ fontSize: 12 }}
        >
          {currentDay ? `Day of ${cycleLength}` : "Log a period"}
        </text>
      </svg>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Moon className="w-3 h-3" /> Cycle phase wheel — marker shows today
      </p>
    </div>
  );
}
