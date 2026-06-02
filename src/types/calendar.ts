/**
 * Raw calendar event — the PRIVATE, full-detail shape the generation pipeline
 * works with. This crosses into the LLM (titles/descriptions included, which is
 * how it reasons intelligently) but MUST NEVER reach the viewer page. The
 * sanitized `Snapshot` is the only thing that crosses the privacy boundary.
 */

export type CalendarSource = "work" | "personal";

export type EventStatus = "confirmed" | "tentative";

/** Google's "show me as" — opaque = busy, transparent = free/non-blocking. */
export type Transparency = "opaque" | "transparent";

export interface RawEvent {
  id: string;
  source: CalendarSource;
  title: string;
  description?: string;
  /** ISO 8601 with timezone offset, e.g. "2026-06-08T09:30:00+01:00". */
  start: string;
  /** ISO 8601 with timezone offset. */
  end: string;
  /** All-day events have date-only semantics; treat as soft context, not a hard block. */
  allDay?: boolean;
  location?: string;
  attendeeCount?: number;
  status?: EventStatus;
  transparency?: Transparency;
  recurring?: boolean;
}

/** A fetched calendar window — what the generator receives before reasoning. */
export interface CalendarFetch {
  /** Inclusive ISO date of the first day fetched. */
  fromISO: string;
  /** Exclusive ISO date one past the last day fetched. */
  toISO: string;
  timezone: string;
  events: RawEvent[];
  /** Where the events came from — drives the reference "now" in generation. */
  source: "mock" | "google";
}
