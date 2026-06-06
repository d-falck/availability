/**
 * Human time descriptions for a free window. Goal: always unambiguous — either a
 * period word ("afternoon"), "all day", or an explicit bounded range
 * ("7:15–11pm", "11:30am–1pm"). Never an open-ended "from X" (which left readers
 * asking "until when?").
 */

import { clockToMin } from "./time";

// Fixed boundaries for *labelling* times of day (independent of availability hours).
const PERIODS = [
  { name: "morning", start: clockToMin("09:00"), end: clockToMin("12:00") },
  { name: "afternoon", start: clockToMin("12:00"), end: clockToMin("18:00") },
  { name: "evening", start: clockToMin("18:00"), end: clockToMin("23:00") },
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

const overlap = (s: number, e: number, p: { start: number; end: number }) =>
  Math.max(0, Math.min(e, p.end) - Math.max(s, p.start));

/**
 * Describe one continuous free window. A period word is only used when the
 * window substantially covers that period; partial windows get an explicit
 * range, so we never claim "morning and afternoon" for a 10am–1pm gap.
 */
export function describeWindow(startMin: number, endMin: number): string {
  const covered = PERIODS.map((p) => ({ p, frac: overlap(startMin, endMin, p) / (p.end - p.start) }))
    .filter((x) => x.frac >= 0.5);
  const names = covered.map((x) => x.p.name);

  if (covered.length === 3) return "all day";
  if (covered.length === 2) {
    if (names[0] === "afternoon" && names[1] === "evening") return "afternoon and evening";
    if (names[0] === "morning" && names[1] === "afternoon") return "daytime";
    return names.join(" and ");
  }
  // Single period: use the word only if it nearly fills it; otherwise be exact.
  if (covered.length === 1 && covered[0].frac >= 0.85) return covered[0].p.name;
  return fmtRange(startMin, endMin);
}
