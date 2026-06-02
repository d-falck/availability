/**
 * Collapses resolved slots into one row per day for the chronological view.
 * Free windows that touch (e.g. an afternoon gap meeting the evening at the
 * internal 6pm seam) are merged first, then each block is described — so a
 * fully-free weekend day reads "all day", not "from 11:30am / evening".
 */

import type { Slot } from "@/types/snapshot";
import { localMinutes } from "./time";
import { describeWindow } from "./timefmt";

export interface DayView {
  date: string;
  /** Combined human time label for the day. */
  label: string;
  ifNeedBe: boolean;
  ids: string[];
}

type Interval = [number, number];

function mergeIntervals(intervals: Interval[]): Interval[] {
  const out: Interval[] = [];
  for (const [s, e] of [...intervals].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && s <= last[1] + 1) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

export function groupByDay(slots: Slot[]): DayView[] {
  const byDate = new Map<string, Slot[]>();
  for (const s of slots) (byDate.get(s.date) ?? byDate.set(s.date, []).get(s.date)!).push(s);

  const days: DayView[] = [];
  for (const [date, daySlots] of byDate) {
    const intervals = mergeIntervals(
      daySlots.map((s) => [localMinutes(s.startISO), localMinutes(s.endISO)] as Interval),
    );
    days.push({
      date,
      label: intervals.map(([s, e]) => describeWindow(s, e)).join(", "),
      ifNeedBe: daySlots.every((s) => s.ifNeedBe),
      ids: daySlots.map((s) => s.id),
    });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
