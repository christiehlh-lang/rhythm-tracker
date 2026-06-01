// Minimal RFC 5545 ICS parser — VEVENT blocks with SUMMARY/DTSTART/DTEND.
// Handles line unfolding and both DATE and DATE-TIME forms.

export interface ParsedEvent {
  uid: string;
  title: string;
  start: string; // ISO
  end: string | null; // ISO or null
  allDay: boolean;
}

function unfold(text: string): string[] {
  const raw = text.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parseIcsDate(value: string): { iso: string; allDay: boolean } {
  // 20250131 | 20250131T140000 | 20250131T140000Z
  const allDay = !value.includes("T");
  if (allDay) {
    const y = value.slice(0, 4);
    const m = value.slice(4, 6);
    const d = value.slice(6, 8);
    return { iso: new Date(`${y}-${m}-${d}T00:00:00`).toISOString(), allDay: true };
  }
  const y = value.slice(0, 4);
  const m = value.slice(4, 6);
  const d = value.slice(6, 8);
  const hh = value.slice(9, 11);
  const mm = value.slice(11, 13);
  const ss = value.slice(13, 15) || "00";
  const z = value.endsWith("Z") ? "Z" : "";
  return { iso: new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}${z}`).toISOString(), allDay: false };
}

export function parseIcs(text: string): ParsedEvent[] {
  const lines = unfold(text);
  const events: ParsedEvent[] = [];
  let cur: Partial<ParsedEvent> & { _start?: string; _end?: string; _allDay?: boolean } | null = null;

  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      cur = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (cur && cur._start) {
        events.push({
          uid: cur.uid || crypto.randomUUID(),
          title: cur.title || "(untitled)",
          start: cur._start,
          end: cur._end ?? null,
          allDay: cur._allDay ?? false,
        });
      }
      cur = null;
      continue;
    }
    if (!cur) continue;

    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const left = line.slice(0, colon);
    const value = line.slice(colon + 1);
    const name = left.split(";")[0];

    if (name === "UID") cur.uid = value;
    else if (name === "SUMMARY") cur.title = value.replace(/\\,/g, ",").replace(/\\n/gi, "\n");
    else if (name === "DTSTART") {
      const { iso, allDay } = parseIcsDate(value);
      cur._start = iso;
      cur._allDay = allDay;
    } else if (name === "DTEND") {
      cur._end = parseIcsDate(value).iso;
    }
  }
  return events;
}
