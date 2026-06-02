/**
 * Deterministic guardrails on the Stage 1 candidates. The rules PROPOSE; this
 * ENFORCES the hard guarantees no matter what:
 *   1. pinned reserved nights are never exposed,
 *   2. the per-week evening reserve cap holds (keep N evenings clear for work).
 */

import type { Config } from "@/config";
import type { CandidateSlot, Slot, Snapshot } from "@/types/snapshot";
import { addDays, clockToMin, dayCodeOf, localMinutes, weekStartOf } from "@/lib/time";

const groupByWeek = (slots: CandidateSlot[]): Map<string, CandidateSlot[]> => {
  const m = new Map<string, CandidateSlot[]>();
  for (const s of slots) {
    const k = weekStartOf(s.date);
    (m.get(k) ?? m.set(k, []).get(k)!).push(s);
  }
  return m;
};

export function applyGuardrails(candidates: CandidateSlot[], config: Config): Slot[] {
  const eveningStart = clockToMin(config.eveningWindow.start);
  const pinned = new Set(config.eveningReserve.pinnedReservedNights);
  const N = config.eveningReserve.minFreeEveningsPerWeek;

  // 1 ── Drop anything occupying a pinned reserved night.
  let slots = candidates.filter((s) => {
    const occupiesEvening = localMinutes(s.startISO) >= eveningStart;
    return !(occupiesEvening && pinned.has(dayCodeOf(s.date)));
  });

  // 2 ── Per-week evening reserve cap (weekday evenings only).
  for (const [, weekSlots] of groupByWeek(slots)) {
    const weekdayEvenings = weekSlots.filter(
      (s) => s.lane === "evening" && !pinned.has(dayCodeOf(s.date)),
    );
    const freeEvenings = new Set(weekdayEvenings.map((s) => s.date)).size;
    const exposedCap = Math.max(0, freeEvenings - N);
    // Keep the earliest `exposedCap` evenings, drop the rest to honour the reserve.
    const dropIds = new Set(
      [...weekdayEvenings].sort((a, b) => a.startISO.localeCompare(b.startISO)).slice(exposedCap).map((s) => s.id),
    );
    slots = slots.filter((s) => !dropIds.has(s.id));
  }

  slots.sort((a, b) => a.startISO.localeCompare(b.startISO));
  return slots;
}

export function buildSnapshot(slots: Slot[], config: Config, now: string): Snapshot {
  return {
    generatedAt: new Date().toISOString(),
    timezone: config.timezone,
    horizon: { fromISO: now, toISO: addDays(now, config.horizonDays) },
    slots,
  };
}
