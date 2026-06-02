/**
 * Deterministic guardrails. The LLM (or heuristic) PROPOSES; this ENFORCES. It
 * runs after reasoning and is the hard guarantee that your rules hold no matter
 * what the model does:
 *   1. pinned reserved nights are never exposed,
 *   2. the per-week evening reserve cap holds,
 *   3. per-tier weekly ceilings hold (by raising openness, not silent drops),
 *   4. notes can't leak event titles.
 * It also computes the "kept for deep work" week summaries.
 */

import type { Config } from "@/config";
import type { CalendarFetch } from "@/types/calendar";
import type { CandidateSlot, Lane, Slot, Snapshot, WeekSummary } from "@/types/snapshot";
import { addDays, clockToMin, dayCodeOf, localMinutes, weekStartOf } from "@/lib/time";

/** Interleave order so trimming/bumping never wipes a whole lane. */
const LANE_ORDER: Lane[] = ["weekend", "evening", "quick"];

/**
 * Pick up to `n` ids, round-robin across lanes (each lane internally ranked
 * most-precious-first), so every lane stays represented at every tier.
 */
function balancedPick(slots: CandidateSlot[], n: number): Set<string> {
  const buckets = new Map<Lane, CandidateSlot[]>(LANE_ORDER.map((l) => [l, []]));
  for (const s of [...slots].sort(byKeepPriority)) buckets.get(s.lane)!.push(s);
  const keep = new Set<string>();
  for (let added = true; keep.size < n && added; ) {
    added = false;
    for (const l of LANE_ORDER) {
      const next = buckets.get(l)!.find((s) => !keep.has(s.id));
      if (next && keep.size < n) keep.add(next.id), (added = true);
    }
  }
  return keep;
}

const groupByWeek = <T extends { date: string }>(items: T[]): Map<string, T[]> => {
  const m = new Map<string, T[]>();
  for (const it of items) {
    const k = weekStartOf(it.date);
    (m.get(k) ?? m.set(k, []).get(k)!).push(it);
  }
  return m;
};

/** Most-precious-last ordering, so we bump/drop the least precious first. */
const byKeepPriority = (a: CandidateSlot, b: CandidateSlot): number =>
  Number(b.preferred) - Number(a.preferred) || a.startISO.localeCompare(b.startISO);

export function applyGuardrails(
  candidates: CandidateSlot[],
  config: Config,
  fetch: CalendarFetch,
): { slots: Slot[]; weeks: WeekSummary[] } {
  const eveningStart = clockToMin(config.eveningWindow.start);
  const pinned = new Set(config.eveningReserve.pinnedReservedNights);
  const N = config.eveningReserve.minFreeEveningsPerWeek;

  // 1 ── Drop anything occupying a pinned reserved night.
  let slots = candidates.filter((s) => {
    const occupiesEvening = localMinutes(s.startISO) >= eveningStart;
    return !(occupiesEvening && pinned.has(dayCodeOf(s.date)));
  });

  const weeks: WeekSummary[] = [];

  // 2 ── Per-week evening reserve cap (weekday evenings only).
  for (const [weekStart, weekSlots] of groupByWeek(slots)) {
    const weekdayEvenings = weekSlots.filter(
      (s) => s.lane === "evening" && !pinned.has(dayCodeOf(s.date)),
    );
    const freeEvenings = new Set(weekdayEvenings.map((s) => s.date)).size;
    const exposedCap = Math.max(0, freeEvenings - N);

    const ranked = [...weekdayEvenings].sort(byKeepPriority);
    const dropIds = new Set(ranked.slice(exposedCap).map((s) => s.id));
    slots = slots.filter((s) => !dropIds.has(s.id));

    weeks.push({
      weekStart,
      eveningsKeptFree: freeEvenings - Math.min(exposedCap, freeEvenings),
    });
  }

  // 3 ── Per-tier weekly ceilings, lane-balanced so no lane is wiped.
  const ceilLow = config.priorityTiers[1].maxSlotsPerWeek;
  const ceilMed = config.priorityTiers[2].maxSlotsPerWeek;
  const ceilHigh = config.priorityTiers[3].maxSlotsPerWeek;
  const keep = new Set<string>();

  for (const [, weekSlots] of groupByWeek(slots)) {
    // High sees everything: trim the week to its ceiling, keeping lane balance.
    const survive = balancedPick(weekSlots, ceilHigh);
    const surviving = weekSlots.filter((s) => survive.has(s.id));
    surviving.forEach((s) => keep.add(s.id));

    // Medium sees openness <= 2: if too many, push the excess up to 3.
    const med = surviving.filter((s) => s.minOpenness <= 2);
    const medKeep = balancedPick(med, ceilMed);
    med.filter((s) => !medKeep.has(s.id)).forEach((s) => (s.minOpenness = 3));

    // Low sees openness 1: if too many, push the excess up to 2.
    const low = surviving.filter((s) => s.minOpenness === 1);
    const lowKeep = balancedPick(low, ceilLow);
    low.filter((s) => !lowKeep.has(s.id)).forEach((s) => (s.minOpenness = 2));
  }
  slots = slots.filter((s) => keep.has(s.id));

  // 4 ── Privacy scrub: a note must never contain an event title.
  const titles = fetch.events.map((e) => e.title.toLowerCase()).filter((t) => t.length >= 4);
  for (const s of slots) {
    if (s.note && titles.some((t) => s.note!.toLowerCase().includes(t))) {
      delete s.note;
    }
  }

  slots.sort((a, b) => a.startISO.localeCompare(b.startISO));
  weeks.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  return { slots, weeks };
}

export function buildSnapshot(
  slots: Slot[],
  weeks: WeekSummary[],
  config: Config,
  now: string,
): Snapshot {
  return {
    generatedAt: new Date().toISOString(),
    timezone: config.timezone,
    horizon: { fromISO: now, toISO: addDays(now, config.horizonDays) },
    weeks,
    slots,
  };
}
