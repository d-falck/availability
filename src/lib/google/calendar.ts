/**
 * Read-only Google Calendar access over the REST API. Lists calendars (for the
 * picker on /me) and fetches events across every connected account's chosen
 * calendars, mapping them into the internal RawEvent shape.
 */

import { config } from "@/config";
import type { CalendarFetch, RawEvent } from "@/types/calendar";
import { addDays, todayInTz } from "@/lib/time";
import { loadSettings } from "@/lib/settings";
import { accessTokenFromRefresh } from "./oauth";
import { listAccounts, type GoogleAccount } from "./store";

export interface CalendarInfo {
  id: string;
  summary: string;
  primary: boolean;
}

async function api<T>(path: string, accessToken: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`https://www.googleapis.com/calendar/v3/${path}`);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Calendar API ${path}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export async function listCalendars(accessToken: string): Promise<CalendarInfo[]> {
  const data = await api<{ items: { id: string; summary: string; primary?: boolean }[] }>(
    "users/me/calendarList",
    accessToken,
    { minAccessRole: "reader", maxResults: "250" },
  );
  return data.items.map((c) => ({ id: c.id, summary: c.summary, primary: !!c.primary }));
}

interface GEvent {
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  transparency?: string;
  attendees?: unknown[];
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  recurringEventId?: string;
}

function toRawEvent(e: GEvent, calId: string): RawEvent | null {
  if (e.status === "cancelled") return null;
  const allDay = !!e.start.date;
  const start = e.start.dateTime ?? `${e.start.date}T00:00:00+00:00`;
  const end = e.end.dateTime ?? `${e.end.date}T00:00:00+00:00`;
  return {
    id: `${calId}:${start}`,
    source: "personal",
    title: e.summary ?? "(busy)",
    description: e.description,
    location: e.location,
    start,
    end,
    allDay,
    attendeeCount: e.attendees?.length,
    status: e.status === "tentative" ? "tentative" : "confirmed",
    transparency: e.transparency === "transparent" ? "transparent" : "opaque",
    recurring: !!e.recurringEventId,
  };
}

async function fetchAccountEvents(
  account: GoogleAccount,
  timeMin: string,
  timeMax: string,
): Promise<RawEvent[]> {
  const accessToken = await accessTokenFromRefresh(account.refreshToken);
  const all: RawEvent[] = [];
  for (const calId of account.calendarIds) {
    const data = await api<{ items: GEvent[] }>(
      `calendars/${encodeURIComponent(calId)}/events`,
      accessToken,
      {
        timeMin,
        timeMax,
        singleEvents: "true",
        orderBy: "startTime",
        maxResults: "2500",
      },
    );
    for (const e of data.items) {
      const r = toRawEvent(e, calId);
      if (r) all.push(r);
    }
  }
  return all;
}

/** Merge all connected accounts' chosen calendars, or null if none are set up. */
export async function fetchGoogleCalendar(): Promise<CalendarFetch | null> {
  const accounts = listAccounts().filter((a) => a.calendarIds.length);
  if (!accounts.length) return null;

  const horizonDays = loadSettings().horizonDays;
  const today = todayInTz(config.timezone);
  const timeMin = new Date(`${today}T00:00:00Z`).toISOString();
  const timeMax = new Date(addDays(today, horizonDays + 1) + "T00:00:00Z").toISOString();

  const events = (
    await Promise.all(accounts.map((a) => fetchAccountEvents(a, timeMin, timeMax)))
  ).flat();

  return {
    fromISO: today,
    toISO: addDays(today, horizonDays),
    timezone: config.timezone,
    events,
    source: "google",
  };
}
