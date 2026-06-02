/**
 * Calendar fetch. For now this just returns the mock calendar; in Phase 4 it
 * is replaced by a read-only Google Calendar fetch with the same shape, and
 * nothing downstream needs to change.
 */

import type { CalendarFetch } from "@/types/calendar";
import { mockCalendar } from "@/mock/calendar";

export async function fetchCalendar(): Promise<CalendarFetch> {
  return mockCalendar;
}
