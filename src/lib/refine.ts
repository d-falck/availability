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
import { getCached, putCached, refineKey } from "@/lib/refinecache";
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

/** Keep only slots that sit inside a free window for their day. */
function validate(proposed: ProposedSlot[], schedule: Schedule): Slot[] {
  const byDate = new Map(schedule.days.map((d) => [d.date, d]));
  const out: Slot[] = [];
  for (const p of proposed) {
    const day = byDate.get(p.date);
    if (!day) continue;
    const s = clockToMin(p.start);
    const e = clockToMin(p.end);
    if (!(e > s)) continue;
    const fits = day.freeWindows.some(
      (w) => s >= localMinutes(w.startISO) - 1 && e <= localMinutes(w.endISO) + 1,
    );
    if (!fits) continue;
    out.push({
      id: `${p.date}-${s}`,
      date: p.date,
      startISO: toISO(p.date, s),
      endISO: toISO(p.date, e),
      ifNeedBe: !!p.ifNeedBe,
    });
  }
  return out.sort((a, b) => a.startISO.localeCompare(b.startISO));
}

export async function resolveShare(share: Share, schedule: Schedule): Promise<Slot[]> {
  const preferences = buildPreferences(loadSettings());
  const key = keyFor(share, schedule, preferences);

  const cached = getCached(key);
  if (cached) return cached;

  const proposed = await proposeSlots(schedule, {
    meetup: meetupText(share),
    customDescription: share.customDescription ?? "",
    preferences,
  });
  const slots = validate(proposed, schedule);
  putCached(key, slots);
  return slots;
}

/** Ensure a share's result is cached (no-op if already warm). */
export async function warmShare(share: Share, schedule: Schedule): Promise<void> {
  await resolveShare(share, schedule);
}
