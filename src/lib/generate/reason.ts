/**
 * The reasoning pass: calendar -> candidate slots.
 *
 * If ANTHROPIC_API_KEY is set, this calls Claude with a tool schema that forces
 * well-formed candidates. Otherwise it falls back to a deterministic heuristic
 * reasoner — good enough to build and judge the whole product against the mock
 * before spending a token. The two paths return the same CandidateSlot[] shape,
 * so swapping to the live model is invisible downstream.
 */

import type { Config } from "@/config";
import type { CalendarFetch, RawEvent } from "@/types/calendar";
import type { CandidateSlot, Lane, Openness } from "@/types/snapshot";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";
import {
  clockToMin,
  dayCodeOf,
  eachDate,
  isWeekend,
  localDate,
  localMinutes,
  toISO,
  weekdayLong,
} from "@/lib/time";

export interface ReasonResult {
  candidates: CandidateSlot[];
  source: "llm" | "heuristic";
}

/** Tool schema for the live model — kept here so prompt + schema evolve together. */
export const SLOT_TOOL = {
  name: "propose_slots",
  description: "Propose the social availability slots for the viewer.",
  input_schema: {
    type: "object",
    properties: {
      slots: {
        type: "array",
        items: {
          type: "object",
          properties: {
            lane: { type: "string", enum: ["quick", "evening", "weekend"] },
            date: { type: "string", description: "YYYY-MM-DD" },
            startISO: { type: "string" },
            endISO: { type: "string" },
            roughTime: { type: "string", description: "fuzzy, e.g. 'after 7ish'" },
            preferred: { type: "boolean" },
            minOpenness: { type: "integer", enum: [1, 2, 3] },
            note: { type: "string", description: "privacy-safe colour only" },
          },
          required: ["lane", "date", "startISO", "endISO", "roughTime", "preferred", "minOpenness"],
        },
      },
    },
    required: ["slots"],
  },
} as const;

export async function reason(
  fetch: CalendarFetch,
  config: Config,
  now: string,
): Promise<ReasonResult> {
  if (process.env.ANTHROPIC_API_KEY) {
    const candidates = await reasonWithLLM(fetch, config, now);
    return { candidates, source: "llm" };
  }
  return { candidates: heuristicReason(fetch, config, now), source: "heuristic" };
}

async function reasonWithLLM(
  fetch: CalendarFetch,
  config: Config,
  now: string,
): Promise<CandidateSlot[]> {
  // Dynamic import so the SDK is only needed on the live path.
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: [
      { type: "text", text: buildSystemPrompt(config), cache_control: { type: "ephemeral" } },
    ],
    tools: [SLOT_TOOL as never],
    tool_choice: { type: "tool", name: SLOT_TOOL.name },
    messages: [{ role: "user", content: buildUserPrompt(fetch, now) }],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("LLM did not return slots via the tool.");
  }
  const raw = (block.input as { slots: Omit<CandidateSlot, "id">[] }).slots;
  return raw.map((s) => ({ ...s, id: `${s.date}-${s.lane}-${localMinutes(s.startISO)}` }));
}

// ───────────────────────────── heuristic reasoner ──────────────────────────

type Interval = [number, number];

const NOTES = {
  afterBlock: "a natural breather after a long stretch",
  lunch: "an easy midday gap",
  daytime: "a relaxed window in the day",
  evening: "a calm evening, nothing booked after",
  weekendDay: "an open, unhurried part of the weekend",
  weekendEve: "a free weekend evening",
  soft: " (might still shift a little)",
};

function merge(intervals: Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const out: Interval[] = [];
  for (const [s, e] of sorted) {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  }
  return out;
}

function freeGaps(winStart: number, winEnd: number, busy: Interval[]): Interval[] {
  const gaps: Interval[] = [];
  let cursor = winStart;
  for (const [s, e] of busy) {
    if (e <= winStart || s >= winEnd) continue;
    const clampedStart = Math.max(s, winStart);
    if (clampedStart > cursor) gaps.push([cursor, clampedStart]);
    cursor = Math.max(cursor, Math.min(e, winEnd));
  }
  if (cursor < winEnd) gaps.push([cursor, winEnd]);
  return gaps;
}

interface DayShape {
  blockedAllDay: boolean;
  hardBusy: Interval[];
  hadSoftEvening: boolean;
  bigBlockEnds: number[];
  busyMinsInDay: number;
}

function shapeOf(events: RawEvent[], date: string, dayWin: Interval): DayShape {
  const todays = events.filter((e) => localDate(e.start) === date);
  let blockedAllDay = false;
  const hard: Interval[] = [];
  let hadSoftEvening = false;
  const bigBlockEnds: number[] = [];

  for (const e of todays) {
    const soft = e.status === "tentative" || e.transparency === "transparent";
    if (e.allDay) {
      if (!soft) blockedAllDay = true;
      continue;
    }
    const s = localMinutes(e.start);
    const en = localMinutes(e.end);
    if (soft) {
      if (en > clockToMin("18:00")) hadSoftEvening = true;
      continue;
    }
    hard.push([s, en]);
    if (en - s >= 90) bigBlockEnds.push(en);
  }

  const merged = merge(hard);
  const busyMinsInDay = merged
    .map(([s, e]) => Math.max(0, Math.min(e, dayWin[1]) - Math.max(s, dayWin[0])))
    .reduce((a, b) => a + b, 0);

  return { blockedAllDay, hardBusy: merged, hadSoftEvening, bigBlockEnds, busyMinsInDay };
}

function roughTime(lane: Lane, date: string, startMin: number): string {
  if (lane === "evening") {
    if (startMin >= clockToMin("19:00")) return "after 7ish";
    if (startMin >= clockToMin("18:30")) return "from about half six";
    return "early evening";
  }
  const partOfDay =
    startMin < clockToMin("11:30")
      ? "morning"
      : startMin <= clockToMin("14:00")
        ? "lunchtime"
        : startMin < clockToMin("16:00")
          ? "afternoon"
          : "late afternoon";
  if (lane === "weekend") {
    const tod =
      startMin < clockToMin("12:00")
        ? "morning"
        : startMin < clockToMin("17:00")
          ? "afternoon"
          : "evening";
    return `${weekdayLong(date)} ${tod}`;
  }
  return partOfDay === "lunchtime" ? "around lunchtime" : `${partOfDay}`;
}

export function heuristicReason(
  fetch: CalendarFetch,
  config: Config,
  now: string,
): CandidateSlot[] {
  const dayWin: Interval = [clockToMin(config.dayWindow.start), clockToMin(config.dayWindow.end)];
  const evWin: Interval = [
    clockToMin(config.eveningWindow.start),
    clockToMin(config.eveningWindow.end),
  ];
  const { quickMinMins, quickMaxMins, eveningMinMins } = config.durations;
  const horizonEnd = localDate(fetch.toISO);
  const out: CandidateSlot[] = [];

  for (const date of eachDate(`${now}T00:00:00`, `${horizonEnd}T00:00:00`)) {
    const shape = shapeOf(fetch.events, date, dayWin);
    if (shape.blockedAllDay) continue;
    const weekend = isWeekend(date);

    const mk = (
      lane: Lane,
      startMin: number,
      durMin: number,
      preferred: boolean,
      openness: Openness,
      note: string,
    ): CandidateSlot => ({
      id: `${date}-${lane}-${startMin}`,
      lane,
      date,
      startISO: toISO(date, startMin),
      endISO: toISO(date, startMin + durMin),
      roughTime: roughTime(lane, date, startMin),
      preferred,
      minOpenness: openness,
      note,
    });

    if (weekend) {
      // Weekend: one nice daytime block + (prime) evening if free.
      const dayGaps = freeGaps(dayWin[0], dayWin[1], shape.hardBusy).filter(
        ([s, e]) => e - s >= 120,
      );
      if (dayGaps.length) {
        const [s] = dayGaps.sort((a, b) => b[1] - b[0] - (a[1] - a[0]))[0];
        const start = Math.max(s, clockToMin("11:00"));
        out.push(mk("weekend", start, 180, true, 2, NOTES.weekendDay));
      }
      const evGaps = freeGaps(evWin[0], evWin[1], shape.hardBusy).filter(
        ([s, e]) => e - s >= eveningMinMins,
      );
      if (evGaps.length) {
        out.push(mk("weekend", evGaps[0][0], eveningMinMins, true, 3, NOTES.weekendEve));
      }
      continue;
    }

    // ── Weekday quick (coffee/walk): one tasteful daytime window per day. ──
    const isLunch = (s: number) => s >= clockToMin("11:30") && s <= clockToMin("14:00");
    const afterBlockAt = (s: number) => shape.bigBlockEnds.some((b) => Math.abs(b - s) <= 15);
    const qGaps = freeGaps(dayWin[0], dayWin[1], shape.hardBusy)
      .filter(([s, e]) => e - s >= quickMinMins)
      // Prefer a breather right after a long block, then a lunchtime gap, then size.
      .sort((a, b) => qScore(b) - qScore(a));
    function qScore([s, e]: Interval): number {
      return (afterBlockAt(s) ? 1e6 : 0) + (isLunch(s) ? 5e5 : 0) + (e - s);
    }
    const best = qGaps[0];
    if (best) {
      const [s, e] = best;
      const afterBlock = afterBlockAt(s);
      const note = afterBlock ? NOTES.afterBlock : isLunch(s) ? NOTES.lunch : NOTES.daytime;
      out.push(mk("quick", s, Math.min(quickMaxMins, e - s), afterBlock, 1, note));
    }

    // ── Weekday evening (dinner/drinks): skip on brutal days, give calm. ──
    const heavyDay = shape.busyMinsInDay >= 4 * 60;
    if (!heavyDay) {
      const eGaps = freeGaps(evWin[0], evWin[1], shape.hardBusy).filter(
        ([s, e]) => e - s >= eveningMinMins,
      );
      if (eGaps.length) {
        const start = Math.max(eGaps[0][0], clockToMin("18:30"));
        const note = NOTES.evening + (shape.hadSoftEvening ? NOTES.soft : "");
        out.push(mk("evening", start, eveningMinMins, false, 2, note));
      }
    }
  }

  return out;
}
