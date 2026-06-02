/**
 * Connected Google accounts, persisted under DATA_DIR (the Fly volume), so they
 * survive deploys. Each account holds a refresh token (long-lived) and the set
 * of calendar ids the user chose to include in availability. Server-only.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dataPath } from "@/lib/paths";

export interface GoogleAccount {
  /** Stable id (the Google account email). */
  id: string;
  email: string;
  refreshToken: string;
  /** Calendar ids to include; empty until the user picks. */
  calendarIds: string[];
  connectedAt: string;
}

const FILE = "google-accounts.json";

export function listAccounts(): GoogleAccount[] {
  try {
    return JSON.parse(readFileSync(dataPath(FILE), "utf8")) as GoogleAccount[];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: GoogleAccount[]): void {
  writeFileSync(dataPath(FILE), JSON.stringify(accounts, null, 2));
}

/** Insert or update an account by email, preserving any chosen calendar ids. */
export function upsertAccount(acc: Omit<GoogleAccount, "connectedAt" | "calendarIds"> & {
  calendarIds?: string[];
}): void {
  const accounts = listAccounts();
  const existing = accounts.find((a) => a.id === acc.id);
  if (existing) {
    existing.refreshToken = acc.refreshToken || existing.refreshToken;
    existing.email = acc.email;
    if (acc.calendarIds) existing.calendarIds = acc.calendarIds;
  } else {
    accounts.push({ ...acc, calendarIds: acc.calendarIds ?? [], connectedAt: new Date().toISOString() });
  }
  writeAccounts(accounts);
}

export function setCalendarIds(accountId: string, calendarIds: string[]): void {
  const accounts = listAccounts();
  const acc = accounts.find((a) => a.id === accountId);
  if (acc) {
    acc.calendarIds = calendarIds;
    writeAccounts(accounts);
  }
}

export function removeAccount(accountId: string): void {
  writeAccounts(listAccounts().filter((a) => a.id !== accountId));
}
