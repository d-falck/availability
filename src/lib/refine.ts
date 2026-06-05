/**
 * Resolve a share into the windows its recipient sees. The brain (LLM) proposes
 * slots over the whole horizon; we validate each against the geometry's free
 * windows (so nothing collides with a confirmed event) and cache the result.
 *
 * resolveShare is async and cache-first: a warm cache returns instantly; a cold
 * cache calls the brain and caches. warmShare pre-populates the cache at
 * generation time and on share create/edit.
 */

import { config, eventTypeById } from "@/config";
import type { Share } from "@/types/share";
import type { Slot } from "@/types/snapshot";
import type { Schedule } from "@/types/schedule";
import { loadSettings } from "@/lib/settings";
import { buildPreferences } from "@/lib/prefs";
import { proposeSlots, type ProposedSlot } from "@/lib/llm/brain";
import { cachedAt, getCached, putCached, refineKey, removeCached } from "@/lib/refinecache";
import { groupByDay } from "@/lib/dayview";
import { clockToMin, localMinutes, toISO } from "@/lib/time";

function meetupText(share: Share): string {
  const parts = share.typeIds.map((id) => {
    const t = eventTypeById(id);
    return t ? `${t.label} (${t.description})` : id;
  });
  return parts.join("; ") || "(see description)";
}

function scheduleFingerprint(schedule: Schedule): string {
  return schedule.days
    .map((d) => {
      const free = d.freeWindows.map((w) => w.startISO.slice(11, 16) + w.endISO.slice(11, 16)).join("|");
      const ev = d.events.map((e) => `${e.title}@${e.start}${e.allDay ? "A" : ""}${e.tentative ? "T" : ""}${e.busy ? "B" : ""}`).join("|");
      return `${d.date}:${free}:${ev}`;
    })
    .join("//");
}

function keyFor(share: Share, schedule: Schedule, preferences: string): string {
  return refineKey({
    typeIds: share.typeIds,
    customDescription: share.customDescription ?? "",
    preferences,
    scheduleFingerprint: scheduleFingerprint(schedule),
  });
}

const MIN_SLOT_MINS = 20;

/**
 * Keep each proposal, clipped to the free window it overlaps most (so minor
 * boundary overruns survive instead of being dropped). Anything that doesn't
 * overlap a real free window on a known day is discarded.
 */
function validate(proposed: ProposedSlot[], schedule: Schedule): Slot[] {
  const byDate = new Map(schedule.days.map((d) => [d.date, d]));
  const out: Slot[] = [];
  for (const p of proposed) {
    const day = byDate.get(p.date);
    if (!day) continue;
    const s = clockToMin(p.start);
    const e = clockToMin(p.end);
    if (!(e > s)) continue;

    let best: { s: number; e: number } | null = null;
    for (const w of day.freeWindows) {
      const cs = Math.max(s, localMinutes(w.startISO));
      const ce = Math.min(e, localMinutes(w.endISO));
      if (ce - cs >= MIN_SLOT_MINS && (!best || ce - cs > best.e - best.s)) best = { s: cs, e: ce };
    }
    if (!best) continue;
    out.push({
      id: `${p.date}-${best.s}`,
      date: p.date,
      startISO: toISO(p.date, best.s),
      endISO: toISO(p.date, best.e),
      ifNeedBe: !!p.ifNeedBe,
    });
  }
  return out.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export async function resolveShare(share: Share, schedule: Schedule): Promise<Slot[]> {
  const preferences = buildPreferences(loadSettings());
  const key = keyFor(share, schedule, preferences);

  const cached = getCached(key);
  if (cached) return cached.slots;

  const { slots: proposed, reasoning } = await proposeSlots(schedule, {
    meetup: meetupText(share),
    customDescription: share.customDescription ?? "",
    preferences,
  });
  const slots = validate(proposed, schedule);
  putCached(key, { slots, reasoning });
  return slots;
}

/** Ensure a share's result is cached (no-op if already warm). */
export async function warmShare(share: Share, schedule: Schedule): Promise<void> {
  await resolveShare(share, schedule);
}

/** When a share's currently-shown result was computed (ms epoch), or null. */
export function shareUpdatedAt(share: Share, schedule: Schedule): number | null {
  return cachedAt(keyFor(share, schedule, buildPreferences(loadSettings())));
}

/** Force a fresh brain pass for a share (ignores the cache). */
export async function refreshShare(share: Share, schedule: Schedule): Promise<void> {
  removeCached(keyFor(share, schedule, buildPreferences(loadSettings())));
  await resolveShare(share, schedule);
}

/** The brain's reasoning + chosen days for a share, for the "Why?" view. */
export async function explainShare(
  share: Share,
  schedule: Schedule,
): Promise<{ reasoning: string; days: ReturnType<typeof groupByDay> }> {
  await resolveShare(share, schedule); // warm if cold
  const cached = getCached(keyFor(share, schedule, buildPreferences(loadSettings())));
  return { reasoning: cached?.reasoning ?? "", days: groupByDay(cached?.slots ?? []) };
}

/** Deeper diagnostics — re-runs the brain (bypassing cache) to show the raw call. */
export async function debugShare(share: Share, schedule: Schedule) {
  const preferences = buildPreferences(loadSettings());
  const meetup = meetupText(share);
  const { slots: proposed, reasoning } = await proposeSlots(schedule, {
    meetup,
    customDescription: share.customDescription ?? "",
    preferences,
  });
  const slots = validate(proposed, schedule);
  return {
    share,
    meetup,
    preferences,
    schedule: {
      generatedAt: schedule.generatedAt,
      horizon: schedule.horizon,
      days: schedule.days.length,
      totalFreeWindows: schedule.days.reduce((n, d) => n + d.freeWindows.length, 0),
      sample: schedule.days.slice(0, 7).map((d) => ({
        date: d.date,
        free: d.freeWindows.map((w) => `${w.startISO.slice(11, 16)}-${w.endISO.slice(11, 16)}`),
        events: d.events.map((e) => e.title),
      })),
    },
    reasoning,
    proposedByBrain: proposed,
    keptAfterValidation: slots,
  };
}
