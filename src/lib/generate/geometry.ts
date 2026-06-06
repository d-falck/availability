/**
 * Geometry (deterministic): turn a calendar fetch into per-day free windows +
 * event context. Free windows are the daily availability span minus *confirmed
 * timed* events; all-day and tentative events do NOT carve free time — they're
 * passed through as context so the brain can reason about them. This is the
 * exact, reliable layer the LLM is bad at (time arithmetic) — and the precise
 * windows Mode A booking will reuse.
 */

import type { Config } from "@/config";
import type { Settings } from "@/lib/settings";
import type { CalendarFetch, RawEvent } from "@/types/calendar";
import type { DaySchedule, Schedule, ScheduleEvent } from "@/types/schedule";
import { clockToMin, eachDate, localDate, localMinutes, toISO, weekdayLong } from "@/lib/time";

type Interval = [number, number];
const MIN_FREE_MINS = 20;

const merge = (intervals: Interval[]): Interval[] => {
  const out: Interval[] = [];
  for (const [s, e] of [...intervals].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
};

function freeWithin(span: Interval, busy: Interval[]): Interval[] {
  const out: Interval[] = [];
  let cursor = span[0];
  for (const [s, e] of merge(busy)) {
    if (e <= span[0] || s >= span[1]) continue;
    if (s > cursor) out.push([cursor, Math.min(s, span[1])]);
    cursor = Math.max(cursor, Math.min(e, span[1]));
  }
  if (cursor < span[1]) out.push([cursor, span[1]]);
  return out.filter(([s, e]) => e - s >= MIN_FREE_MINS);
}

const isBusy = (e: RawEvent): boolean =>
  !e.allDay && e.status !== "tentative" && e.transparency !== "transparent";

function toScheduleEvent(e: RawEvent): ScheduleEvent {
  return {
    title: e.title,
    start: e.start,
    end: e.end,
    allDay: !!e.allDay,
    tentative: e.status === "tentative",
    busy: isBusy(e),
    attendees: e.attendeeCount,
    location: e.location,
    description: e.description,
  };
}

export function buildSchedule(
  fetch: CalendarFetch,
  config: Config,
  settings: Settings,
  now: string,
): Schedule {
  const span: Interval = [clockToMin(settings.availableFrom), clockToMin(settings.availableTo)];
  const horizonEnd = localDate(fetch.toISO);
  const days: DaySchedule[] = [];

  for (const date of eachDate(`${now}T00:00:00`, `${horizonEnd}T00:00:00`)) {
    const dayEvents = fetch.events.filter((e) => localDate(e.start) === date);
    const busy: Interval[] = dayEvents
      .filter(isBusy)
      .map((e) => [
        Math.max(localMinutes(e.start), span[0]),
        Math.min(localMinutes(e.end), span[1]),
      ] as Interval)
      .filter(([s, e]) => e > s);

    days.push({
      date,
      weekday: weekdayLong(date),
      freeWindows: freeWithin(span, busy).map(([s, e]) => ({
        startISO: toISO(date, s),
        endISO: toISO(date, e),
      })),
      events: dayEvents.map(toScheduleEvent),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    timezone: config.timezone,
    horizon: { fromISO: now, toISO: `${horizonEnd}` },
    days,
  };
}
