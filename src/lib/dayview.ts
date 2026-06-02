/**
 * Collapses resolved slots into one row per day for the chronological view:
 * same-day windows are combined ("afternoon / evening", "1–2pm / from 7pm") and
 * a day is marked "if need be" only when every window that day is one you'd
 * rather not give up.
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

export function groupByDay(slots: Slot[]): DayView[] {
  const byDate = new Map<string, Slot[]>();
  for (const s of slots) (byDate.get(s.date) ?? byDate.set(s.date, []).get(s.date)!).push(s);

  const days: DayView[] = [];
  for (const [date, daySlots] of byDate) {
    const ordered = [...daySlots].sort((a, b) => a.startISO.localeCompare(b.startISO));
    const labels: string[] = [];
    for (const s of ordered) {
      const label = describeWindow(localMinutes(s.startISO), localMinutes(s.endISO));
      if (!labels.includes(label)) labels.push(label);
    }
    days.push({
      date,
      label: labels.join(" / "),
      ifNeedBe: ordered.every((s) => s.ifNeedBe),
      ids: ordered.map((s) => s.id),
    });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
