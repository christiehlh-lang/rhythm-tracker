// POST /api/extract-events
// Body: { text: string, filename?: string, today?: string }
// Returns: { events: { title, start, end, allDay }[] }
//
// Uses Claude Haiku to parse a tabular schedule PDF (extracted to plain text
// client-side) into a list of shifts. Designed for cases the line-by-line
// regex heuristic can't handle — multi-shift days, DD/MM dates, year-in-
// header layouts, etc.

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { requireUser } from "./_lib/session.js";

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You extract calendar events from messy schedule text (rosters, itineraries, syllabi, etc.) that was pulled out of a PDF.

Output ONLY valid JSON in this exact shape:
{
  "events": [
    {
      "title": "string — short, e.g. 'AV 06:00-09:00 (Nurse)'",
      "start": "ISO 8601 datetime in local time, e.g. 2026-05-11T06:00:00",
      "end": "ISO 8601 datetime or null",
      "allDay": false
    }
  ]
}

Rules:
- Be exhaustive: every shift / event in the source should appear once. Multi-shift days produce one event per shift.
- If a date appears as DD/MM only, use the year from the header range (or the user-supplied year hint).
- 24-hour times. 00:00-00:00 means "all day" → set allDay=true, start=date+T00:00:00, end=null.
- Skip rows that are clearly labels like "Day Off" / "DO" — don't emit events for them.
- Sort events by start ascending.
- Never invent times or dates. If you can't determine a date/time confidently, skip the row.
- Output JSON only, no prose, no markdown fences.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const userId = await requireUser(req, res);
  if (!userId) return;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "ANTHROPIC_API_KEY not set" });

  const text = String(req.body?.text || "");
  if (!text.trim()) return res.status(400).json({ error: "text required" });
  if (text.length > 200_000) return res.status(413).json({ error: "PDF too large" });

  const filename = String(req.body?.filename || "");
  const today = String(req.body?.today || new Date().toISOString().slice(0, 10));

  const client = new Anthropic({ apiKey });

  let response;
  try {
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Today's date is ${today}. Filename: ${filename || "(none)"}.\n\nSchedule text:\n\n${text}`,
        },
      ],
    });
  } catch (err) {
    console.error("anthropic error", err);
    return res.status(502).json({ error: (err as Error).message });
  }

  const block = response.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") return res.json({ events: [] });

  // Defensive: strip any code fence the model might still emit.
  const raw = block.text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "");
  try {
    const parsed = JSON.parse(raw) as { events?: unknown };
    if (!Array.isArray(parsed.events)) return res.json({ events: [] });
    const events = parsed.events
      .map((e: any) => {
        if (!e || typeof e.title !== "string" || typeof e.start !== "string") return null;
        const start = new Date(e.start).toISOString();
        const end = e.end ? new Date(e.end).toISOString() : null;
        return {
          title: e.title,
          start,
          end,
          allDay: Boolean(e.allDay),
        };
      })
      .filter(Boolean);
    res.json({ events });
  } catch (err) {
    console.error("parse error", err, raw.slice(0, 500));
    res.status(502).json({ error: "model returned invalid JSON" });
  }
}
