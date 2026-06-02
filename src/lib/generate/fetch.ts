/**
 * Calendar source. Uses connected Google accounts when available; otherwise
 * falls back to the mock calendar so the app is fully runnable before any
 * Google setup.
 */

import type { CalendarFetch } from "@/types/calendar";
import { mockCalendar } from "@/mock/calendar";
import { fetchGoogleCalendar } from "@/lib/google/calendar";

export async function fetchCalendar(): Promise<CalendarFetch> {
  const google = await fetchGoogleCalendar();
  return google ?? mockCalendar;
}
