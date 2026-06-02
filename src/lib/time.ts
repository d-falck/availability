/**
 * Lightweight local-time helpers. We work in wall-clock terms read directly
 * from the ISO strings (Google and our mock both return timestamps with the
 * local offset baked in, e.g. "2026-06-08T19:30:00+01:00"), so the substring
 * before the offset IS the Europe/London wall time. This keeps us DST-safe
 * without a heavyweight tz dependency for the snapshot layer.
 */

import type { DayCode } from "@/config";

const DAY_CODES: DayCode[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** "2026-06-08T19:30:00+01:00" -> "2026-06-08" */
export const localDate = (iso: string): string => iso.slice(0, 10);

/** "2026-06-08T19:30:00+01:00" -> 1170 (minutes since local midnight) */
export const localMinutes = (iso: string): number => {
  const h = Number(iso.slice(11, 13));
  const m = Number(iso.slice(14, 16));
  return h * 60 + m;
};

/** "09:30" -> 570 */
export const clockToMin = (clock: string): number => {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
};

/** 570 -> "09:30" */
export const minToClock = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/** Weekday code for a "YYYY-MM-DD" date, computed in UTC for determinism. */
export const dayCodeOf = (date: string): DayCode =>
  DAY_CODES[new Date(`${date}T00:00:00Z`).getUTCDay()];

export const isWeekend = (date: string): boolean => {
  const d = dayCodeOf(date);
  return d === "SAT" || d === "SUN";
};

/** Add `n` days to a "YYYY-MM-DD" date, returning a "YYYY-MM-DD" date. */
export const addDays = (date: string, n: number): string => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Monday (ISO week start) for the week containing `date`. */
export const weekStartOf = (date: string): string => {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun..6=Sat
  const backToMonday = (dow + 6) % 7;
  return addDays(date, -backToMonday);
};

/** Inclusive-from, exclusive-to list of "YYYY-MM-DD" dates. */
export const eachDate = (fromISO: string, toISO: string): string[] => {
  const out: string[] = [];
  for (let d = localDate(fromISO); d < localDate(toISO); d = addDays(d, 1)) {
    out.push(d);
  }
  return out;
};

/** Build a local ISO timestamp (BST offset for our horizon) from date + minutes. */
export const toISO = (date: string, min: number): string =>
  `${date}T${minToClock(min)}:00+01:00`;

const WEEKDAY_LONG: Record<DayCode, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export const weekdayLong = (date: string): string => WEEKDAY_LONG[dayCodeOf(date)];

/** "Tue" style short label. */
export const weekdayShort = (date: string): string =>
  WEEKDAY_LONG[dayCodeOf(date)].slice(0, 3);

/** Today's date "YYYY-MM-DD" in the given IANA timezone. */
export const todayInTz = (tz: string): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());

/** "8 Jun" style short label. */
export const dayMonth = (date: string): string => {
  const d = new Date(`${date}T00:00:00Z`);
  const month = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${d.getUTCDate()} ${month}`;
};
