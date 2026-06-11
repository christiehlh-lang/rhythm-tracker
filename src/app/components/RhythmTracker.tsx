import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Droplets,
  Moon,
  Pencil,
  Plus,
  Save,
  Square,
  Trash2,
  X,
} from "lucide-react";
import { useLocalStorage, STORAGE_KEYS, type CycleSettings, type PeriodEntry } from "../../store";
import {
  activePeriod,
  averageCycleLength,
  isWithinPeriod,
  moonPhase,
  normalizePeriods,
  phaseForDate,
  phasesFor,
  todayCycleStatus,
} from "../../cycle";

const ARC_COLORS: Record<string, string> = {
  menstrual: "#e07a7a",
  follicular: "#d4a59a",
  ovulatory: "#b8d4a8",
  luteal: "#c5b8d6",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RhythmTracker() {
  const [settings, setSettings] = useLocalStorage<CycleSettings>(STORAGE_KEYS.cycle, {
    periods: [],
    cycleLength: 28,
  });

  const periods = normalizePeriods(settings);
  const active = activePeriod(periods);
  const today = new Date();
  const status = todayCycleStatus(settings, today);
  const cycleLength = status?.cycleLength ?? averageCycleLength(periods, settings.cycleLength);
  const phases = phasesFor(cycleLength);
  const moon = moonPhase(today);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const persist = (next: PeriodEntry[]) => {
    setSettings({
      ...settings,
      periods: next,
      cycleLength: averageCycleLength(next, cycleLength),
    });
  };

  const startPeriodToday = () => {
    if (active) return; // safety
    const id = crypto.randomUUID();
    persist([...periods, { id, start: todayIso() }]);
  };

  const endActivePeriod = () => {
    if (!active) return;
    const end = todayIso();
    const next = periods.map((p) => (p.id === active.id ? { ...p, end } : p));
    persist(next);
  };

  const updatePeriod = (id: string, patch: Partial<PeriodEntry>) => {
    const next = periods.map((p) => (p.id === id ? { ...p, ...patch } : p));
    persist(next);
  };

  const removePeriod = (id: string) => {
    persist(periods.filter((p) => p.id !== id));
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

              <div className="pt-2">
                {active ? (
                  <button
                    onClick={endActivePeriod}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive/15 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                  >
                    <Square className="w-3.5 h-3.5" /> End period today
                  </button>
                ) : (
                  <button
                    onClick={startPeriodToday}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm"
                  >
                    <Droplets className="w-3.5 h-3.5" /> Start period today
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground italic">
                Log your first period to start tracking your cycle.
              </p>
              <button
                onClick={startPeriodToday}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-colors text-sm"
              >
                <Droplets className="w-3.5 h-3.5" /> Start period today
              </button>
            </div>
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

      <PhaseCalendar
        month={calendarMonth}
        setMonth={setCalendarMonth}
        settings={settings}
        periods={periods}
      />

      <Periods
        periods={periods}
        cycleLength={cycleLength}
        active={active}
        onUpdate={updatePeriod}
        onRemove={removePeriod}
      />

      <div className="bg-primary/10 p-6 rounded-2xl border border-primary/20">
        <p className="text-sm italic text-foreground/80 text-center">
          Your cycle is a rhythm, not a rule. Each phase is necessary, each one temporary.
        </p>
      </div>
    </div>
  );
}

function Periods({
  periods,
  cycleLength,
  active,
  onUpdate,
  onRemove,
}: {
  periods: PeriodEntry[];
  cycleLength: number;
  active: PeriodEntry | null;
  onUpdate: (id: string, patch: Partial<PeriodEntry>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
      <div className="flex items-center gap-3">
        <Droplets className="w-5 h-5 text-destructive" />
        <h3 className="text-lg">Periods</h3>
      </div>

      {periods.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">No periods logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {[...periods].reverse().map((p) => (
            <PeriodRow
              key={p.id}
              entry={p}
              isActive={active?.id === p.id}
              onUpdate={(patch) => onUpdate(p.id, patch)}
              onRemove={() => onRemove(p.id)}
            />
          ))}
        </ul>
      )}

      {periods.length >= 2 && (
        <p className="text-xs text-muted-foreground">
          Average cycle length learned from your data:{" "}
          <span className="text-foreground">{cycleLength} days</span>.
        </p>
      )}
    </div>
  );
}

function PeriodRow({
  entry,
  isActive,
  onUpdate,
  onRemove,
}: {
  entry: PeriodEntry;
  isActive: boolean;
  onUpdate: (patch: Partial<PeriodEntry>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(entry.start);
  const [draftEnd, setDraftEnd] = useState(entry.end ?? "");

  const save = () => {
    if (!draftStart) return;
    const patch: Partial<PeriodEntry> = { start: draftStart };
    patch.end = draftEnd || undefined;
    onUpdate(patch);
    setEditing(false);
  };

  const cancel = () => {
    setDraftStart(entry.start);
    setDraftEnd(entry.end ?? "");
    setEditing(false);
  };

  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  if (editing) {
    return (
      <li className="bg-background border border-primary/40 rounded-xl p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-muted-foreground">Start</label>
          <input
            type="date"
            value={draftStart}
            onChange={(e) => setDraftStart(e.target.value)}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <label className="text-xs text-muted-foreground ml-2">End</label>
          <input
            type="date"
            value={draftEnd}
            min={draftStart}
            onChange={(e) => setDraftEnd(e.target.value)}
            className="px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {draftEnd && (
            <button
              onClick={() => setDraftEnd("")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              type="button"
            >
              clear
            </button>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={cancel}
            className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
          <button
            onClick={save}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 flex items-center gap-1"
          >
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between p-3 rounded-lg bg-background border border-border group">
      <div className="min-w-0">
        <p className="text-sm truncate">
          {fmt(entry.start)}
          {entry.end ? ` → ${fmt(entry.end)}` : ""}
        </p>
        {isActive && (
          <p className="text-xs text-destructive mt-0.5">In progress — end it from the Today panel</p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <button
          onClick={() => setEditing(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onRemove}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Remove"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </li>
  );
}

function PhaseCalendar({
  month,
  setMonth,
  settings,
  periods,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  settings: CycleSettings;
  periods: PeriodEntry[];
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const lastDay = new Date(year, m + 1, 0);
  const startingDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const todayIsoStr = todayIso();

  const navigate = (offset: number) => {
    const next = new Date(month);
    next.setMonth(next.getMonth() + offset);
    setMonth(next);
  };

  const colorFor = (date: Date): { fill: string; ring: boolean; muted: boolean } => {
    const info = phaseForDate(settings, date);
    if (!info) return { fill: "transparent", ring: false, muted: true };
    const fill = ARC_COLORS[info.phase.key];
    const period = isWithinPeriod(periods, date);
    return { fill, ring: period, muted: false };
  };

  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <button
          onClick={() => navigate(1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const date = new Date(year, m, day);
          const iso = date.toISOString().slice(0, 10);
          const { fill, ring, muted } = colorFor(date);
          const isToday = iso === todayIsoStr;
          return (
            <div
              key={day}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs relative ${
                muted ? "bg-background border border-border text-muted-foreground" : ""
              }`}
              style={muted ? undefined : { backgroundColor: fill, color: "#fff", opacity: 0.95 }}
              title={iso}
            >
              <span>{day}</span>
              {ring && (
                <span
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 2px rgba(0,0,0,0.35)" }}
                />
              )}
              {isToday && (
                <span
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground"
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Legend color={ARC_COLORS.menstrual} label="Menstrual" />
        <Legend color={ARC_COLORS.follicular} label="Follicular" />
        <Legend color={ARC_COLORS.ovulatory} label="Ovulatory" />
        <Legend color={ARC_COLORS.luteal} label="Luteal" />
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded border-2 border-foreground/60 bg-transparent" /> Period day
        </span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
      {label}
    </span>
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
              stroke={ARC_COLORS[p.key]}
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
