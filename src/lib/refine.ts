/**
 * Stage 2 — refine. Resolves a share against the latest base snapshot into the
 * windows its recipient should see. Today this is a deterministic filter by the
 * event types each window suits; this is exactly the seam where an LLM pass
 * slots in to filter/order more tastefully, cached per (event types or custom
 * description + snapshot version). Output is read straight by the recipient page.
 */

import { config } from "@/config";
import type { Share } from "@/types/share";
import type { Slot, Snapshot } from "@/types/snapshot";

/** Map a freeform description onto standard event-type ids (LLM does this later). */
function typesFromDescription(desc: string): string[] {
  const d = desc.toLowerCase();
  const hit: string[] = [];
  const add = (...ids: string[]) => ids.forEach((id) => hit.includes(id) || hit.push(id));
  if (/\b(dinner|supper|drinks?|pub|bar|evening|night)\b/.test(d)) add("dinner", "drinks");
  if (/\b(lunch)\b/.test(d)) add("lunch");
  if (/\b(coffee|catch[- ]?up|chat|tea)\b/.test(d)) add("coffee");
  if (/\b(walk|stroll|park|outdoors?)\b/.test(d)) add("walk");
  if (/\b(weekend|saturday|sunday)\b/.test(d)) add("weekend");
  // Fall back to everything if nothing matched, so a vague note still shows times.
  return hit.length ? hit : config.eventTypes.map((t) => t.id);
}

/** All event-type ids a share is asking about (selected types + description). */
export function shareTypeIds(share: Share): string[] {
  const ids = new Set(share.typeIds);
  if (share.customDescription?.trim()) {
    typesFromDescription(share.customDescription).forEach((id) => ids.add(id));
  }
  return [...ids];
}

export function resolveShare(share: Share, snapshot: Snapshot): Slot[] {
  const want = new Set(shareTypeIds(share));
  return snapshot.slots
    .filter((s) => s.suits.some((id) => want.has(id)))
    .sort((a, b) => a.startISO.localeCompare(b.startISO));
}
