/**
 * Renders resolved availability as a plain-text list, for when you'd rather
 * paste the times to someone than send a link.
 */

import type { Slot } from "@/types/snapshot";
import { groupByDay } from "./dayview";
import { dayMonth, weekdayShort } from "./time";

export function toText(slots: Slot[], opts?: { note?: string }): string {
  const days = groupByDay(slots);
  const lines = days.map((d) => {
    const when = `${weekdayShort(d.date)} ${dayMonth(d.date)}`;
    const tail = d.ifNeedBe ? `${d.label} (if need be)` : d.label;
    return `${when} — ${tail}`;
  });
  const body = lines.length ? lines.join("\n") : "Nothing free in this window right now.";
  return opts?.note ? `${opts.note}\n\n${body}` : body;
}
