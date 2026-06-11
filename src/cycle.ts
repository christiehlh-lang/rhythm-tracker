// Cycle math + phase definitions. Pure functions — easy to test.

import type { CycleSettings, PeriodEntry } from "./store";

export type Phase = "menstrual" | "follicular" | "ovulatory" | "luteal";

export interface PhaseInfo {
  key: Phase;
  label: string;
  shortLabel: string;
  startDay: number;
  endDay: number;
  color: string; // tailwind class
  forecast: string;
  suggestions: { kind: string; text: string }[];
}

export function phasesFor(cycleLength: number): PhaseInfo[] {
  // Standard model: menstrual 1-5, follicular 6-13, ovulatory 14-17,
  // luteal 18-end. Scale luteal to the user's actual cycle length.
  return [
    {
      key: "menstrual",
      label: "Menstrual phase",
      shortLabel: "Menstrual",
      startDay: 1,
      endDay: 5,
      color: "bg-destructive/60",
      forecast:
        "A natural low. Energy is at its quietest — honour it. Gentle movement, warm food, slow mornings, and time to journal will pay dividends later this cycle.",
      suggestions: [
        { kind: "Do", text: "Reflect, plan, set intentions. Avoid big decisions if you can." },
        { kind: "Move", text: "Walking, slow yoga, stretching. Skip the HIIT class." },
        { kind: "Eat", text: "Iron-rich foods, warm soups, ginger and cinnamon teas." },
      ],
    },
    {
      key: "follicular",
      label: "Follicular phase",
      shortLabel: "Follicular",
      startDay: 6,
      endDay: 13,
      color: "bg-primary/60",
      forecast:
        "Energy is climbing. A good week to start new things, learn, network, take on bigger ideas. Creativity tends to peak — capture sparks before ovulation.",
      suggestions: [
        { kind: "Do", text: "Brainstorm, try new things, start projects, take a class." },
        { kind: "Move", text: "Cardio, strength training, dance. Push a bit further than usual." },
        { kind: "Eat", text: "Fermented foods, leafy greens, lean protein to support estrogen." },
      ],
    },
    {
      key: "ovulatory",
      label: "Ovulatory phase",
      shortLabel: "Ovulatory",
      startDay: 14,
      endDay: 17,
      color: "bg-accent/60",
      forecast:
        "Peak energy, communication and confidence. Schedule the things that need charisma — presentations, hard conversations, social events.",
      suggestions: [
        { kind: "Do", text: "Big meetings, hard conversations, social events, presentations." },
        { kind: "Move", text: "High-intensity training, group classes, anything that needs power." },
        { kind: "Eat", text: "Antioxidants, berries, cruciferous veg to balance estrogen." },
      ],
    },
    {
      key: "luteal",
      label: "Luteal phase",
      shortLabel: "Luteal",
      startDay: 18,
      endDay: Math.max(19, cycleLength),
      color: "bg-secondary/60",
      forecast:
        "Wind-down phase. Sharper focus for detailed work, but energy starts to dip toward the end. Magnesium-rich foods, more sleep, fewer late nights.",
      suggestions: [
        { kind: "Do", text: "Detail-oriented tasks, finishing touches, decluttering, admin." },
        { kind: "Move", text: "Pilates, longer walks, swimming. Drop intensity in week 2." },
        { kind: "Eat", text: "Magnesium (almonds, leafy greens, dark chocolate), complex carbs." },
      ],
    },
  ];
}

export function normalizePeriods(settings: CycleSettings | undefined | null): PeriodEntry[] {
  if (!settings) return [];
  const list = settings.periods ?? [];
  // Migrate legacy single-cycleStart into the periods list if absent.
  if (!list.length && settings.cycleStart) {
    return [{ id: "legacy", start: settings.cycleStart.slice(0, 10) }];
  }
  return [...list].sort((a, b) => a.start.localeCompare(b.start));
}

export function averageCycleLength(periods: PeriodEntry[], fallback: number): number {
  if (periods.length < 2) return fallback;
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1].start);
    const b = new Date(sorted[i].start);
    const days = Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 18 && days <= 45) gaps.push(days); // sanity-filter outliers
  }
  if (!gaps.length) return fallback;
  return Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length);
}

export interface TodayCycle {
  cycleDay: number; // 1-based
  phase: PhaseInfo;
  nextPeriodOn: Date;
  daysUntilNext: number;
  cycleLength: number;
}

export function todayCycleStatus(
  settings: CycleSettings | undefined | null,
  today: Date = new Date(),
): TodayCycle | null {
  const periods = normalizePeriods(settings);
  if (!periods.length) return null;
  const cycleLength = averageCycleLength(periods, settings?.cycleLength ?? 28);

  const last = periods[periods.length - 1];
  const lastStart = new Date(`${last.start}T00:00:00`);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((today.getTime() - lastStart.getTime()) / dayMs);
  if (diffDays < 0) return null;

  const cycleDay = (diffDays % cycleLength) + 1;
  const phases = phasesFor(cycleLength);
  const phase =
    phases.find((p) => cycleDay >= p.startDay && cycleDay <= p.endDay) ?? phases[phases.length - 1];

  const cyclesElapsed = Math.floor(diffDays / cycleLength) + 1;
  const nextPeriodOn = new Date(lastStart);
  nextPeriodOn.setDate(nextPeriodOn.getDate() + cyclesElapsed * cycleLength);
  const daysUntilNext = Math.max(
    0,
    Math.ceil((nextPeriodOn.getTime() - today.getTime()) / dayMs),
  );

  return { cycleDay, phase, nextPeriodOn, daysUntilNext, cycleLength };
}

export function moonPhase(date: Date): { phase: string; emoji: string } {
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
  const synodic = 29.53059;
  const diff = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
  return phases[Math.floor(((diff % synodic) / synodic) * 8)];
}

export function phaseForDate(
  settings: CycleSettings | undefined | null,
  date: Date,
): { phase: PhaseInfo; cycleDay: number; cycleLength: number } | null {
  const periods = normalizePeriods(settings);
  if (!periods.length) return null;
  const cycleLength = averageCycleLength(periods, settings?.cycleLength ?? 28);

  // Find the most recent period start on or before `date`.
  const past = periods
    .map((p) => new Date(`${p.start}T00:00:00`))
    .filter((d) => d.getTime() <= date.getTime())
    .sort((a, b) => b.getTime() - a.getTime());
  if (!past.length) return null;

  const anchor = past[0];
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((date.getTime() - anchor.getTime()) / dayMs);
  const cycleDay = (diffDays % cycleLength) + 1;
  const phases = phasesFor(cycleLength);
  const phase =
    phases.find((p) => cycleDay >= p.startDay && cycleDay <= p.endDay) ?? phases[phases.length - 1];
  return { phase, cycleDay, cycleLength };
}

export function isWithinPeriod(periods: PeriodEntry[], date: Date): boolean {
  const iso = date.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  for (const p of periods) {
    if (p.start > iso) continue;
    // With an end date: standard range check.
    if (p.end) {
      if (iso <= p.end) return true;
      continue;
    }
    // No end date and it's the most-recent (active) period — treat every
    // day from start up to today as still bleeding.
    if (iso <= todayStr) return true;
  }
  return false;
}

export function activePeriod(periods: PeriodEntry[]): PeriodEntry | null {
  // The most recent period with no end date is considered active.
  const sorted = [...periods].sort((a, b) => b.start.localeCompare(a.start));
  return sorted.find((p) => !p.end) ?? null;
}
