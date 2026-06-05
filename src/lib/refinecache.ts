/**
 * Cache for the brain's per-share output, persisted under DATA_DIR. Keyed by a
 * fingerprint of the inputs (schedule content + event types + description +
 * preferences), so a calendar change that doesn't affect a share's options is a
 * cache hit and costs no tokens. Pruned to the most recent entries.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dataPath } from "./paths";
import type { Slot } from "@/types/snapshot";

export interface CachedRefine {
  slots: Slot[];
  reasoning: string;
}

type CacheFile = Record<string, CachedRefine & { at: number }>;
const MAX_ENTRIES = 60;

export function refineKey(parts: {
  typeIds: string[];
  customDescription: string;
  preferences: string;
  scheduleFingerprint: string;
}): string {
  const basis = JSON.stringify({
    t: [...parts.typeIds].sort(),
    d: parts.customDescription,
    p: parts.preferences,
    s: parts.scheduleFingerprint,
  });
  return createHash("sha256").update(basis).digest("hex").slice(0, 24);
}

function read(): CacheFile {
  try {
    return JSON.parse(readFileSync(dataPath("refine-cache.json"), "utf8")) as CacheFile;
  } catch {
    return {};
  }
}

export function getCached(key: string): CachedRefine | null {
  const hit = read()[key];
  return hit ? { slots: hit.slots, reasoning: hit.reasoning } : null;
}

/** When this entry was last computed (ms epoch), or null if absent. */
export function cachedAt(key: string): number | null {
  return read()[key]?.at ?? null;
}

export function removeCached(key: string): void {
  const cache = read();
  delete cache[key];
  writeFileSync(dataPath("refine-cache.json"), JSON.stringify(cache, null, 2));
}

export function putCached(key: string, value: CachedRefine): void {
  const cache = read();
  cache[key] = { ...value, at: Date.now() };
  const keys = Object.keys(cache).sort((a, b) => cache[b].at - cache[a].at);
  const pruned: CacheFile = {};
  for (const k of keys.slice(0, MAX_ENTRIES)) pruned[k] = cache[k];
  writeFileSync(dataPath("refine-cache.json"), JSON.stringify(pruned, null, 2));
}
