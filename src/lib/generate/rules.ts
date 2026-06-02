/**
 * Stage 1 — deterministic rules. Reads the calendar and produces candidate free
 * windows over the horizon, each with its real bounds, an "if need be" flag, and
 * the standard event types it could suit. No LLM here; the intelligence/taste is
 * layered on in Stage 2 (refine.ts). Reserve rules are enforced in guardrails.
 */

import type { Config, EventType, TimeBand } from "@/config";
import type { CalendarFetch, RawEvent } from "@/types/calendar";
import type { CandidateSlot, Lane } from "@/types/snapshot";
import { clockToMin, eachDate, isWeekend, localDate, localMinutes, toISO } from "@/lib/time";

type Interval = [number, number];

const merge = (intervals: Interval[]): Interval[] => {
  const out: Interval[] = [];
  for (const [s, e] of [...intervals].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
};

const freeGaps = (winStart: number, winEnd: number, busy: Interval[]): Interval[] => {
  const gaps: Interval[] = [];
  let cursor = winStart;
  for (const [s, e] of busy) {
    if (e <= winStart || s >= winEnd) continue;
    const clamped = Math.max(s, winStart);
    if (clamped > cursor) gaps.push([cursor, clamped]);
    cursor = Math.max(cursor, Math.min(e, winEnd));
  }
  if (cursor < winEnd) gaps.push([cursor, winEnd]);
  return gaps;
};

const overlap = (a: Interval, b: Interval): number =>
  Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));

interface DayShape {
  blockedAllDay: boolean;
  hardBusy: Interval[];
  bigBlockEnds: number[];
  busyMinsInDay: number;
}

function shapeOf(
  events: RawEvent[],
  date: string,
  dayWin: Interval,
  allDayBusy: boolean,
): DayShape {
  const todays = events.filter((e) => localDate(e.start) === date);
  let blockedAllDay = false;
  const hard: Interval[] = [];
  const bigBlockEnds: number[] = [];

  for (const e of todays) {
    const soft = e.status === "tentative" || e.transparency === "transparent";
    if (e.allDay) {
      if (!soft && allDayBusy) blockedAllDay = true;
      continue;
    }
    if (soft) continue;
    const s = localMinutes(e.start);
    const en = localMinutes(e.end);
    hard.push([s, en]);
    if (en - s >= 90) bigBlockEnds.push(en);
  }

  const merged = merge(hard);
  const busyMinsInDay = merged
    .map((iv) => overlap(iv, dayWin))
    .reduce((a, b) => a + b, 0);
  return { blockedAllDay, hardBusy: merged, bigBlockEnds, busyMinsInDay };
}

/** Which standard event types a window (lane + bounds) could suit. */
function suitsFor(lane: Lane, win: Interval, config: Config): string[] {
  const bands: Record<TimeBand, Interval> = {
    day: [clockToMin(config.dayWindow.start), clockToMin(config.dayWindow.end)],
    midday: [clockToMin("11:30"), clockToMin("14:00")],
    evening: [clockToMin(config.eveningWindow.start), clockToMin(config.eveningWindow.end)],
  };
  const fits = (t: EventType) =>
    t.lanes.includes(lane) && t.bands.some((b) => overlap(win, bands[b]) >= t.minMins);
  return config.eventTypes.filter(fits).map((t) => t.id);
}

export function generateCandidates(
  fetch: CalendarFetch,
  config: Config,
  now: string,
  allDayBusy = true,
): CandidateSlot[] {
  const dayWin: Interval = [clockToMin(config.dayWindow.start), clockToMin(config.dayWindow.end)];
  const evWin: Interval = [
    clockToMin(config.eveningWindow.start),
    clockToMin(config.eveningWindow.end),
  ];
  const { quickMinMins, eveningMinMins } = config.durations;
  const out: CandidateSlot[] = [];

  const push = (date: string, lane: Lane, win: Interval, ifNeedBe: boolean) => {
    const suits = suitsFor(lane, win, config);
    if (!suits.length) return;
    out.push({
      id: `${date}-${lane}-${win[0]}`,
      date,
      lane,
      startISO: toISO(date, win[0]),
      endISO: toISO(date, win[1]),
      ifNeedBe,
      suits,
    });
  };

  for (const date of eachDate(`${now}T00:00:00`, `${localDate(fetch.toISO)}T00:00:00`)) {
    const shape = shapeOf(fetch.events, date, dayWin, allDayBusy);
    if (shape.blockedAllDay) continue;
    const weekend = isWeekend(date);

    if (weekend) {
      const dayGaps = freeGaps(dayWin[0], dayWin[1], shape.hardBusy).filter(
        ([s, e]) => e - s >= 120,
      );
      if (dayGaps.length) {
        const best = dayGaps.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
        push(date, "weekend", [Math.max(best[0], clockToMin("10:00")), best[1]], false);
      }
      const evGaps = freeGaps(evWin[0], evWin[1], shape.hardBusy).filter(
        ([s, e]) => e - s >= eveningMinMins,
      );
      if (evGaps.length) push(date, "weekend", evGaps[0], false);
      continue;
    }

    // Weekday daytime: the single best gap (a breather after a big block, else lunch, else largest).
    const isLunch = (s: number) => s >= clockToMin("11:30") && s <= clockToMin("14:00");
    const afterBlock = (s: number) => shape.bigBlockEnds.some((b) => Math.abs(b - s) <= 15);
    const qScore = ([s, e]: Interval) =>
      (afterBlock(s) ? 1e6 : 0) + (isLunch(s) ? 5e5 : 0) + (e - s);
    const qGaps = freeGaps(dayWin[0], dayWin[1], shape.hardBusy)
      .filter(([s, e]) => e - s >= quickMinMins)
      .sort((a, b) => qScore(b) - qScore(a));
    if (qGaps.length) {
      const best = qGaps[0];
      // A generic mid-work pop-out is "if need be"; a breather after a heavy block isn't.
      push(date, "quick", best, !afterBlock(best[0]));
    }

    // Weekday evening: skip brutal days (keep them calm); the rest is dinner/drinks.
    const heavyDay = shape.busyMinsInDay >= 4 * 60;
    if (!heavyDay) {
      const eGaps = freeGaps(evWin[0], evWin[1], shape.hardBusy).filter(
        ([s, e]) => e - s >= eveningMinMins,
      );
      if (eGaps.length) push(date, "evening", eGaps[0], false);
    }
  }

  return out;
}
