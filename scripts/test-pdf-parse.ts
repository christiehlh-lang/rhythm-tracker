import { eventsFromLines } from "../src/utils/pdf-parse";

interface Case {
  label: string;
  lines: string[];
  expectAtLeast: number;
  fallbackYear?: number;
  check?: (events: ReturnType<typeof eventsFromLines>) => string | null;
}

const cases: Case[] = [
  {
    label: "ISO dates",
    lines: ["2026-01-05 10:00 AM Team standup", "2026-01-06 Dentist appointment"],
    expectAtLeast: 2,
  },
  {
    label: "Slash US dates",
    lines: ["01/05/2026 9:30 Sprint planning", "1/6/26 3:00pm Coffee with Sam"],
    expectAtLeast: 2,
  },
  {
    label: "Named month, full",
    lines: ["January 5, 2026 – Kickoff dinner", "February 12 2026 Yoga class 7:00 PM"],
    expectAtLeast: 2,
  },
  {
    label: "Named month, abbreviated, no year (uses fallback)",
    lines: ["Jan 5 9:00 AM Coffee", "Feb 12 Yoga"],
    expectAtLeast: 2,
    fallbackYear: 2026,
    check: (events) => {
      const years = new Set(events.map((e) => new Date(e.start).getFullYear()));
      return years.size === 1 && years.has(2026) ? null : `expected fallback year 2026, got ${[...years]}`;
    },
  },
  {
    label: "Day-first European",
    lines: ["5 Jan 2026 Kickoff", "12 February 2026 Standup 14:30"],
    expectAtLeast: 2,
  },
  {
    label: "AM/PM time normalization",
    lines: ["Jan 5, 2026 12:30 AM Late call", "Jan 5, 2026 12:30 PM Lunch", "Jan 5, 2026 11:30 pm Wrap-up"],
    expectAtLeast: 3,
    check: (events) => {
      const hours = events.map((e) => new Date(e.start).getHours()).sort((a, b) => a - b);
      return hours.join(",") === "0,12,23" ? null : `expected hours [0,12,23], got [${hours}]`;
    },
  },
  {
    label: "All-day when no time present",
    lines: ["Jan 5, 2026 Birthday"],
    expectAtLeast: 1,
    check: (events) => (events[0].allDay ? null : "expected allDay=true"),
  },
  {
    label: "Lines without dates are skipped",
    lines: ["Welcome to your schedule", "Page 1 of 4", "Confidential"],
    expectAtLeast: 0,
    check: (events) => (events.length === 0 ? null : `expected 0 events, got ${events.length}`),
  },
  {
    label: "Duplicates collapse",
    lines: ["Jan 5, 2026 9:00 AM Standup", "Jan 5, 2026 9:00 AM Standup"],
    expectAtLeast: 1,
    check: (events) => (events.length === 1 ? null : `expected dedupe to 1, got ${events.length}`),
  },
  {
    label: "Real-world itinerary line",
    lines: ["Mon, Jan 5, 2026  09:00 AM  Flight UA 437 to SFO  Terminal 2"],
    expectAtLeast: 1,
  },
];

let pass = 0;
let fail = 0;
for (const c of cases) {
  const events = eventsFromLines(c.lines, c.fallbackYear);
  const issues: string[] = [];
  if (events.length < c.expectAtLeast) {
    issues.push(`expected >=${c.expectAtLeast} events, got ${events.length}`);
  }
  const checkResult = c.check?.(events);
  if (checkResult) issues.push(checkResult);

  if (issues.length === 0) {
    pass++;
    console.log(`PASS  ${c.label}  (${events.length} events)`);
    for (const ev of events) console.log(`        → ${ev.start}  ${ev.allDay ? "[all-day] " : ""}${ev.title}`);
  } else {
    fail++;
    console.log(`FAIL  ${c.label}`);
    for (const i of issues) console.log(`        ! ${i}`);
    for (const ev of events) console.log(`        → ${ev.start}  ${ev.title}`);
  }
}

console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
