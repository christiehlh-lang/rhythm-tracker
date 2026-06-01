import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota exceeded or storage disabled — surface silently
    }
  }, [key, value]);

  return [value, setValue];
}

export interface DailyEntry {
  date: string;
  energy: number;
  mood: number;
  productivity: number;
  flow: "heavy" | "medium" | "light" | "none";
  symptoms: string[];
  notes: string;
}

export interface DumpEntry {
  id: string;
  content: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  timeSpent: number;
}

export interface CycleSettings {
  cycleStart: string | null;
  cycleLength: number;
}

export interface CalendarEvent {
  id: string;
  source: "ics";
  title: string;
  start: string; // ISO
  end: string | null;
  allDay: boolean;
}

export const STORAGE_KEYS = {
  daily: "rhythm.dailyEntries.v1",
  dumps: "rhythm.brainDumps.v1",
  tasks: "rhythm.tasks.v1",
  cycle: "rhythm.cycle.v1",
  events: "rhythm.calendarEvents.v1",
} as const;
