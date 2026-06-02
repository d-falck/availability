/**
 * Cache for the Stage 2 LLM refine pass, persisted under DATA_DIR. Keyed by a
 * fingerprint of the inputs (candidate windows + event types + description +
 * guidance), so a calendar change that doesn't affect a given share's options
 * is a cache hit and costs no tokens. Pruned to the most recent entries.
 */

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dataPath } from "./paths";

export interface RefineResult {
  /** Window ids to show, with the final "if need be" decision. */
  keep: { id: string; ifNeedBe: boolean }[];
}

type CacheFile = Record<string, { result: RefineResult; at: number }>;
const MAX_ENTRIES = 60;

export function refineKey(parts: {
  typeIds: string[];
  customDescription: string;
  guidance: string;
  candidateFingerprint: string;
}): string {
  const basis = JSON.stringify({
    t: [...parts.typeIds].sort(),
    d: parts.customDescription,
    g: parts.guidance,
    c: parts.candidateFingerprint,
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

export function getCached(key: string): RefineResult | null {
  return read()[key]?.result ?? null;
}

export function putCached(key: string, result: RefineResult): void {
  const cache = read();
  cache[key] = { result, at: Date.now() };
  const keys = Object.keys(cache).sort((a, b) => cache[b].at - cache[a].at);
  const pruned: CacheFile = {};
  for (const k of keys.slice(0, MAX_ENTRIES)) pruned[k] = cache[k];
  writeFileSync(dataPath("refine-cache.json"), JSON.stringify(pruned, null, 2));
}
