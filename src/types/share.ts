/**
 * A share — a per-recipient availability page you compose on the private page.
 * It stores the *parameters* (event types, optional description, optional
 * follow-up steer), not a frozen list of times, so the link stays up to date as
 * your calendar changes. Resolved against the latest schedule at view time.
 */

export interface Share {
  id: string;
  /** For your reference (and an optional greeting); not required. */
  recipient?: string;
  /** Selected standard event-type ids. */
  typeIds: string[];
  /** Freeform description, used by the brain. */
  customDescription?: string;
  /** A follow-up steer added later (from the Why panel); folded into the brain
   *  context on every refresh, e.g. "lean earlier in the week" or "no Mondays". */
  followUp?: string;
  createdAt: string;
}
