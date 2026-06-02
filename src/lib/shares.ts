/**
 * File-backed store for shares (data/shares.json). Single-user and self-hosted,
 * so a JSON file is plenty; swap for SQLite if this ever grows. Server-only.
 */

import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dataPath } from "./paths";
import type { Share } from "@/types/share";

function readAll(): Share[] {
  try {
    return JSON.parse(readFileSync(dataPath("shares.json"), "utf8")) as Share[];
  } catch {
    return [];
  }
}

function writeAll(shares: Share[]): void {
  writeFileSync(dataPath("shares.json"), JSON.stringify(shares, null, 2));
}

export function listShares(): Share[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getShare(id: string): Share | undefined {
  return readAll().find((s) => s.id === id);
}

export function createShare(input: Omit<Share, "id" | "createdAt">): Share {
  const share: Share = {
    ...input,
    id: randomBytes(6).toString("base64url"),
    createdAt: new Date().toISOString(),
  };
  writeAll([...readAll(), share]);
  return share;
}

export function updateShare(
  id: string,
  patch: Partial<Omit<Share, "id" | "createdAt">>,
): Share | undefined {
  const all = readAll();
  const share = all.find((s) => s.id === id);
  if (!share) return undefined;
  Object.assign(share, patch);
  writeAll(all);
  return share;
}

export function deleteShare(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
