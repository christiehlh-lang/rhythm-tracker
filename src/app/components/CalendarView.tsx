import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useLocalStorage,
  STORAGE_KEYS,
  type DailyEntry,
  type CalendarEvent,
} from "../../store";

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [entries] = useLocalStorage<Record<string, DailyEntry>>(STORAGE_KEYS.daily, {});
  const [events] = useLocalStorage<CalendarEvent[]>(STORAGE_KEYS.events, []);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const eventsForDay = (day: number): CalendarEvent[] => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const key = d.toISOString().split("T")[0];
    return events.filter((e) => e.start.split("T")[0] === key);
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

  const navigateMonth = (offset: number) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate);
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const entryForDay = (day: number): { energy: number; hasNotes: boolean } | undefined => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const key = d.toISOString().split("T")[0];
    const e = entries[key];
    if (!e) return undefined;
    return { energy: e.energy, hasNotes: Boolean(e.notes?.trim()) };
  };

  const getEnergyColor = (energy: number) => {
    if (energy >= 4) return "bg-primary";
    if (energy >= 3) return "bg-secondary";
    return "bg-muted";
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl">
          {currentMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div className="grid grid-cols-7 gap-3 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const entry = entryForDay(day);
            const dayEvents = eventsForDay(day);
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`relative aspect-square rounded-xl p-1.5 transition-all hover:shadow-md ${
                  isToday ? "ring-2 ring-primary" : ""
                } ${day === selectedDay ? "ring-2 ring-accent" : ""} ${
                  entry ? getEnergyColor(entry.energy) : "bg-background hover:bg-muted"
                }`}
              >
                {dayEvents.length > 0 && (
                  <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center shadow-sm">
                    {dayEvents.length}
                  </span>
                )}
                <div className="flex flex-col items-center justify-center h-full gap-1">
                  <span
                    className={`text-sm ${
                      entry && entry.energy >= 3 ? "text-white" : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="w-full px-1">
                      <div className="h-1 rounded-full bg-accent/70" />
                    </div>
                  )}
                  {entry?.hasNotes && (
                    <span className="w-1 h-1 rounded-full bg-white/70" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {selectedDay !== null && (
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-sm font-medium mb-3">
              {new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth(),
                selectedDay,
              ).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </h3>
            {eventsForDay(selectedDay).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No events</p>
            ) : (
              <ul className="space-y-2">
                {eventsForDay(selectedDay).map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border"
                  >
                    <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0 bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{ev.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {ev.allDay
                          ? "All day"
                          : new Date(ev.start).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-x-6 gap-y-2 justify-center text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-primary" />
              <span className="text-muted-foreground">High energy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary" />
              <span className="text-muted-foreground">Steady</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-muted" />
              <span className="text-muted-foreground">Resting</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center">3</span>
              <span className="text-muted-foreground">Events that day</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
