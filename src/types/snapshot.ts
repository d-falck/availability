/**
 * Snapshot — the SANITIZED base produced by Stage 1 (rules). It holds every
 * candidate free window over the horizon, each tagged with which event types it
 * could suit (internal hint) and whether it's an "if need be". There are no
 * event titles/locations/attendees here: the snapshot is the privacy boundary,
 * and it's what the refine step and recipient pages read.
 */

/** Internal lane — drives reserve rules and suit-tagging, never shown to viewers. */
export type Lane = "quick" | "evening" | "weekend";

export interface Slot {
  id: string;
  /** Local date "YYYY-MM-DD". */
  date: string;
  /** Real free-window bounds, so the view can be specific ("from 7:15pm"). */
  startISO: string;
  endISO: string;
  lane: Lane;
  /** A time you'd rather not give up — surfaced as "if need be". */
  ifNeedBe: boolean;
  /** Standard event-type ids this window could suit (e.g. ["coffee","walk"]). */
  suits: string[];
}

export interface Snapshot {
  generatedAt: string;
  timezone: string;
  horizon: { fromISO: string; toISO: string };
  slots: Slot[];
}

/** A candidate from Stage 1 before guardrails — same shape, understood untrusted. */
export type CandidateSlot = Slot;
