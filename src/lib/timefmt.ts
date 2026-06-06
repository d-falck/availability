/**
 * Human time descriptions for a free window.
 *
 * "rough" (default) is natural and deliberately loose — a period word
 * ("afternoon"), "all day", or a soft anchor with no end ("from 7:30pm",
 * "around lunchtime") — leaving the exact end up to the people meeting.
 * "exact" gives the precise bounded range ("7:30–10:30pm").
 */

import { clockToMin } from "./time";

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

/** A loose phrase anchored on the start of a partial window — no end time. */
function roughPhrase(startMin: number): string {
  if (startMin < clockToMin("11:00")) return "morning";
  if (startMin < clockToMin("14:00")) return "around lunchtime";
  if (startMin < clockToMin("16:30")) return "afternoon";
  if (startMin < clockToMin("18:15")) return "late afternoon";
  // Evening: keep the useful start anchor, drop the end.
  return startMin <= clockToMin("18:30") ? "evening" : `from ${fmtTime(startMin)}`;
}

export function describeWindow(startMin: number, endMin: number, exact = false): string {
  if (exact) return fmtRange(startMin, endMin);

  const covered = PERIODS.map((p) => ({ p, frac: overlap(startMin, endMin, p) / (p.end - p.start) }))
    .filter((x) => x.frac >= 0.5);
  const names = covered.map((x) => x.p.name);

  if (covered.length === 3) return "all day";
  if (covered.length === 2) {
    if (names[0] === "afternoon" && names[1] === "evening") return "afternoon and evening";
    if (names[0] === "morning" && names[1] === "afternoon") return "daytime";
    return names.join(" and ");
  }
  // Fills a single period -> the period word; otherwise a loose start phrase.
  if (covered.length === 1 && covered[0].frac >= 0.85) return covered[0].p.name;
  return roughPhrase(startMin);
}
