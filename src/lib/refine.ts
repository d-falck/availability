/**
 * Stage 2 — refine. Resolves a share against the latest snapshot into the
 * windows its recipient should see.
 *
 * resolveShare() is synchronous and reads the refine cache, so recipient pages
 * stay instant: a warm cache yields the LLM-curated set, a cold cache falls back
 * to the deterministic type filter. warmShare() runs the (cached) LLM pass in
 * the background — at generation time and when a share is created/edited.
 */

import { config } from "@/config";
import type { Share } from "@/types/share";
import type { Slot, Snapshot } from "@/types/snapshot";
import { loadSettings } from "@/lib/settings";
import { getCached, putCached, refineKey } from "@/lib/refinecache";
import { llmRefine, type RefineCandidate } from "@/lib/llm/refine";
import { describeWindow } from "@/lib/timefmt";
import { dayMonth, localMinutes, weekdayShort } from "@/lib/time";

/** Map a freeform description onto standard event-type ids (LLM refines further). */
function typesFromDescription(desc: string): string[] {
  const d = desc.toLowerCase();
  const hit: string[] = [];
  const add = (...ids: string[]) => ids.forEach((id) => hit.includes(id) || hit.push(id));
  if (/\b(dinner|supper|drinks?|pub|bar|evening|night)\b/.test(d)) add("dinner", "drinks");
  if (/\b(lunch)\b/.test(d)) add("lunch");
  if (/\b(coffee|catch[- ]?up|chat|tea)\b/.test(d)) add("coffee");
  if (/\b(walk|stroll|park|outdoors?)\b/.test(d)) add("walk");
  if (/\b(weekend|saturday|sunday)\b/.test(d)) add("weekend");
  return hit.length ? hit : config.eventTypes.map((t) => t.id);
}

export function shareTypeIds(share: Share): string[] {
  const ids = new Set(share.typeIds);
  if (share.customDescription?.trim()) {
    typesFromDescription(share.customDescription).forEach((id) => ids.add(id));
  }
  return [...ids];
}

/** The deterministically-matched candidate windows for a share, chronological. */
export function shareCandidates(share: Share, snapshot: Snapshot): Slot[] {
  const want = new Set(shareTypeIds(share));
  return snapshot.slots
    .filter((s) => s.suits.some((id) => want.has(id)))
    .sort((a, b) => a.startISO.localeCompare(b.startISO));
}

const fingerprint = (cands: Slot[]): string =>
  cands.map((c) => c.id + (c.ifNeedBe ? "!" : "")).sort().join(",");

const keyFor = (share: Share, cands: Slot[], guidance: string): string =>
  refineKey({
    typeIds: shareTypeIds(share),
    customDescription: share.customDescription ?? "",
    guidance,
    candidateFingerprint: fingerprint(cands),
  });

export function resolveShare(share: Share, snapshot: Snapshot): Slot[] {
  const cands = shareCandidates(share, snapshot);
  const guidance = loadSettings().guidance;
  const cached = getCached(keyFor(share, cands, guidance));
  if (!cached) return cands; // deterministic fallback (no key, or not yet warmed)

  const decisions = new Map(cached.keep.map((k) => [k.id, k.ifNeedBe]));
  return cands
    .filter((c) => decisions.has(c.id))
    .map((c) => ({ ...c, ifNeedBe: decisions.get(c.id)! }));
}

const toCandidate = (s: Slot): RefineCandidate => ({
  id: s.id,
  day: `${weekdayShort(s.date)} ${dayMonth(s.date)}`,
  time: describeWindow(localMinutes(s.startISO), localMinutes(s.endISO)),
  lane: s.lane,
  ifNeedBe: s.ifNeedBe,
});

/** Run the (cached) LLM refine for a share. No-op without an API key. */
export async function warmShare(share: Share, snapshot: Snapshot, guidance: string): Promise<void> {
  const cands = shareCandidates(share, snapshot);
  const key = keyFor(share, cands, guidance);
  if (getCached(key)) return;

  const result = await llmRefine(cands.map(toCandidate), {
    typeLabels: share.typeIds.map((id) => config.eventTypes.find((t) => t.id === id)?.label ?? id),
    customDescription: share.customDescription ?? "",
    guidance,
  });
  if (result) putCached(key, result);
}
