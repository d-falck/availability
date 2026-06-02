/** Resolve a share-link token to a priority tier (or null if unknown). */

import { config } from "@/config";
import type { PriorityTier } from "@/types/snapshot";

const WORD_TIER: Record<string, PriorityTier> = { high: 3, medium: 2, low: 1 };

export function tierForToken(token: string): PriorityTier | null {
  return config.links[token] ?? WORD_TIER[token.toLowerCase()] ?? null;
}
