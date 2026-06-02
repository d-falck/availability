/**
 * File-backed store for shares (data/shares.json). Single-user and self-hosted,
 * so a JSON file is plenty; swap for SQLite if this ever grows. Server-only.
 */

import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Share } from "@/types/share";

const DIR = resolve(process.cwd(), "data");
const PATH = resolve(DIR, "shares.json");

function readAll(): Share[] {
  try {
    return JSON.parse(readFileSync(PATH, "utf8")) as Share[];
  } catch {
    return [];
  }
}

function writeAll(shares: Share[]): void {
  mkdirSync(DIR, { recursive: true });
  writeFileSync(PATH, JSON.stringify(shares, null, 2));
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

export function deleteShare(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}
