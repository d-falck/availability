/**
 * A share — a per-recipient availability page you compose on the private /me
 * page. It stores the *parameters* (which event types, notes, optional custom
 * description), not a frozen list of times, so the link stays up to date as
 * your calendar changes. Resolved against the latest snapshot at view time.
 */

export interface Share {
  id: string;
  /** For your reference (and an optional greeting); not required. */
  recipient?: string;
  /** Selected standard event-type ids. */
  typeIds: string[];
  /** Optional note per event type, shown subtly on the page. */
  typeNotes?: Record<string, string>;
  /** A general note shown at the top of the page. */
  note?: string;
  /** Freeform description, refined by the LLM (heuristic until a key is set). */
  customDescription?: string;
  createdAt: string;
}
