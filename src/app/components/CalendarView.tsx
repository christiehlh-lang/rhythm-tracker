import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

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

  const mockEntries: Record<number, { energy: number; hasNotes: boolean }> = {
    5: { energy: 3, hasNotes: true },
    8: { energy: 4, hasNotes: false },
    12: { energy: 5, hasNotes: true },
    15: { energy: 2, hasNotes: true },
    18: { energy: 3, hasNotes: false },
    22: { energy: 4, hasNotes: true },
    25: { energy: 3, hasNotes: false },
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
            const entry = mockEntries[day];
            const isToday =
              day === new Date().getDate() &&
              currentMonth.getMonth() === new Date().getMonth() &&
              currentMonth.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={day}
                className={`aspect-square rounded-xl p-2 transition-all hover:shadow-md ${
                  isToday ? "ring-2 ring-primary" : ""
                } ${entry ? getEnergyColor(entry.energy) : "bg-background hover:bg-muted"}`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span
                    className={`text-sm ${
                      entry && entry.energy >= 3 ? "text-white" : "text-foreground"
                    }`}
                  >
                    {day}
                  </span>
                  {entry?.hasNotes && (
                    <span className="w-1 h-1 rounded-full bg-white/70 mt-1" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex items-center gap-6 justify-center text-sm">
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
          </div>
        </div>
      </div>
    </div>
  );
}
