// Pure heuristic line-parser for date/title/time extraction.
// No pdfjs, no Vite-specific imports — safe to run under tsx/node for tests.

export interface ExtractedEvent {
  uid: string;
  title: string;
  start: string; // ISO
  end: null;
  allDay: boolean;
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const DATE_PATTERNS: RegExp[] = [
  /\b(\d{4})-(\d{2})-(\d{2})\b/,
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:[,\s]+(\d{2,4}))?\b/i,
  /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*(\d{2,4})?\b/i,
];

const TIME_RE = /\b(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)?\b/;

function normalizeYear(y: number): number {
  if (y < 100) return y + (y >= 70 ? 1900 : 2000);
  return y;
}

function tryParseDate(line: string, fallbackYear: number): { date: Date; matchEnd: number } | null {
  for (const re of DATE_PATTERNS) {
    const m = re.exec(line);
    if (!m) continue;
    let year: number, month: number, day: number;
    if (re === DATE_PATTERNS[0]) {
      year = Number(m[1]);
      month = Number(m[2]) - 1;
      day = Number(m[3]);
    } else if (re === DATE_PATTERNS[1]) {
      month = Number(m[1]) - 1;
      day = Number(m[2]);
      year = normalizeYear(Number(m[3]));
    } else if (re === DATE_PATTERNS[2]) {
      month = MONTHS[m[1].toLowerCase()];
      day = Number(m[2]);
      year = m[3] ? normalizeYear(Number(m[3])) : fallbackYear;
    } else {
      day = Number(m[1]);
      month = MONTHS[m[2].toLowerCase()];
      year = m[3] ? normalizeYear(Number(m[3])) : fallbackYear;
    }
    if (Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(year)) continue;
    const d = new Date(year, month, day);
    if (Number.isNaN(d.getTime())) continue;
    return { date: d, matchEnd: m.index + m[0].length };
  }
  return null;
}

function applyTime(base: Date, line: string, from: number): { date: Date; allDay: boolean } {
  const slice = line.slice(from);
  const m = TIME_RE.exec(slice);
  if (!m) return { date: base, allDay: true };
  let hours = Number(m[1]);
  const minutes = Number(m[2]);
  const meridiem = m[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return { date: d, allDay: false };
}

function extractTitle(line: string, afterDateIdx: number): string {
  const rest = line.slice(afterDateIdx).replace(TIME_RE, "").replace(/[\s\-–—|:•]+/, " ").trim();
  return rest || line.trim();
}

export function eventsFromLines(lines: string[], fallbackYear = new Date().getFullYear()): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const parsed = tryParseDate(line, fallbackYear);
    if (!parsed) continue;
    const withTime = applyTime(parsed.date, line, parsed.matchEnd);
    const title = extractTitle(line, parsed.matchEnd);
    if (!title || title.length < 2) continue;
    const startIso = withTime.date.toISOString();
    const dedupe = `${startIso}|${title.slice(0, 80)}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    events.push({
      uid: `pdf-${events.length}-${startIso}`,
      title,
      start: startIso,
      end: null,
      allDay: withTime.allDay,
    });
  }
  return events;
}
