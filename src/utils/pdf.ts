// PDF text extraction wrapper that delegates the heuristic to pdf-parse.

import * as pdfjs from "pdfjs-dist";
// @ts-expect-error – Vite ?url import
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { eventsFromLines, type ExtractedEvent } from "./pdf-parse";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export type { ExtractedEvent };
export { eventsFromLines };

async function pdfToLines(file: File): Promise<string[]> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  const lines: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const rows = new Map<number, { x: number; text: string }[]>();
    for (const item of content.items as any[]) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const x = item.transform[4];
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y)!.push({ x, text: item.str });
    }
    const sortedYs = [...rows.keys()].sort((a, b) => b - a);
    for (const y of sortedYs) {
      const row = rows.get(y)!.sort((a, b) => a.x - b.x);
      const line = row.map((r) => r.text).join(" ").replace(/\s+/g, " ").trim();
      if (line) lines.push(line);
    }
  }
  return lines;
}

export async function extractPdfEvents(file: File): Promise<ExtractedEvent[]> {
  const lines = await pdfToLines(file);
  return eventsFromLines(lines);
}
