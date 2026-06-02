/**
 * The Schedule is the deterministic GEOMETRY layer + event context the LLM brain
 * reasons over. It is SERVER-ONLY state (it contains real event titles) — it is
 * never sent to a recipient's browser; only the sanitized slots the brain
 * produces are. Free windows are the day's availability minus *confirmed timed*
 * events; all-day and tentative events are passed through as context (not hard
 * blocks) so the brain can reason about them (e.g. an unconfirmed all-day hold).
 */

export interface FreeWindow {
  startISO: string;
  endISO: string;
}

export interface ScheduleEvent {
  title: string;
  /** ISO start/end (local offset). For all-day, date at local midnight. */
  start: string;
  end: string;
  allDay: boolean;
  tentative: boolean;
  /** Whether it blocks time (opaque + confirmed) — these carve the free windows. */
  busy: boolean;
  attendees?: number;
  location?: string;
  description?: string;
}

export interface DaySchedule {
  /** "YYYY-MM-DD" */
  date: string;
  weekday: string;
  freeWindows: FreeWindow[];
  events: ScheduleEvent[];
}

export interface Schedule {
  generatedAt: string;
  timezone: string;
  horizon: { fromISO: string; toISO: string };
  days: DaySchedule[];
}
