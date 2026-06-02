/**
 * Human time descriptions for a free window. Goal: always unambiguous — either a
 * period word ("afternoon"), "all day", or an explicit bounded range
 * ("7:15–11pm", "11:30am–1pm"). Never an open-ended "from X" (which left readers
 * asking "until when?").
 */

import { config } from "@/config";
import { clockToMin } from "./time";

const DAY_START = clockToMin(config.dayWindow.start);
const NOON = 12 * 60;
const EV_START = clockToMin(config.eveningWindow.start);
const EV_END = clockToMin(config.eveningWindow.end);

const PERIODS = [
  { name: "morning", start: DAY_START, end: NOON },
  { name: "afternoon", start: NOON, end: EV_START },
  { name: "evening", start: EV_START, end: EV_END },
];

/** "9am", "1pm", "7:15pm" (minutes shown only when off the hour). */
export function fmtTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? "am" : "pm";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
}

/** Collapse a shared am/pm suffix: "1–2:30pm", "9–11am", else "11:30am–1pm". */
function fmtRange(a: number, b: number): string {
  const sameHalf = a < 12 * 60 === b < 12 * 60;
  if (!sameHalf) return `${fmtTime(a)}–${fmtTime(b)}`;
  return `${fmtTime(a).replace(/(am|pm)$/, "")}–${fmtTime(b)}`;
}

const near = (a: number, b: number, tol = 31) => Math.abs(a - b) <= tol;
const overlap = (s: number, e: number, p: { start: number; end: number }) =>
  Math.max(0, Math.min(e, p.end) - Math.max(s, p.start));

export function describeWindow(startMin: number, endMin: number): string {
  const covered = PERIODS.filter((p) => overlap(startMin, endMin, p) >= 60);

  if (covered.length >= 3) return "all day";
  if (covered.length === 2) return `${covered[0].name} and ${covered[1].name}`;
  if (covered.length === 1) {
    const p = covered[0];
    // Use the period word only when the window genuinely fills it; else be exact.
    if (near(startMin, p.start) && near(endMin, p.end)) return p.name;
  }
  return fmtRange(startMin, endMin);
}
