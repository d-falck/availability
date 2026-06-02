/**
 * Human time descriptions for a single free window. Aims to be specific when
 * the data supports it ("from 7:15pm", "1–2pm") and fall back to a period word
 * only when the window genuinely fills that period ("afternoon").
 */

import { config } from "@/config";
import { clockToMin } from "./time";

const DAY_START = clockToMin(config.dayWindow.start);
const DAY_END = clockToMin(config.dayWindow.end); // also the afternoon/evening seam
const EV_END = clockToMin(config.eveningWindow.end);
const MORNING_END = 12 * 60;

interface Period {
  name: string;
  start: number;
  end: number;
}

function periodOf(startMin: number): Period {
  if (startMin < MORNING_END) return { name: "morning", start: DAY_START, end: MORNING_END };
  if (startMin < DAY_END) return { name: "afternoon", start: MORNING_END, end: DAY_END };
  return { name: "evening", start: DAY_END, end: EV_END };
}

/** "9am", "1pm", "7:15pm" (no minutes shown when on the hour). */
export function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
}

/** Collapse a shared am/pm suffix: "1–2:30pm", "9–11am", else "11am–2pm". */
function fmtRange(a: number, b: number): string {
  const sameHalf = a < 12 * 60 === b < 12 * 60;
  if (!sameHalf) return `${fmtTime(a)}–${fmtTime(b)}`;
  const left = fmtTime(a).replace(/(am|pm)$/, "");
  return `${left}–${fmtTime(b)}`;
}

export function describeWindow(startMin: number, endMin: number): string {
  const p = periodOf(startMin);
  const nearStart = startMin <= p.start + 30;
  const nearEnd = endMin >= p.end - 30;

  if (nearStart && nearEnd) return p.name; // fills the period
  if (nearEnd) return `from ${fmtTime(startMin)}`; // open-ended top
  if (nearStart) return `until ${fmtTime(endMin)}`; // open-ended start
  return fmtRange(startMin, endMin);
}
