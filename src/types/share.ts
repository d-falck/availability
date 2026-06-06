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
  /** Offer window. Each edge is "Nw" (N weeks from now) or an ISO date.
   *  Default from "0w" (now) to "3w". */
  offerFrom?: string;
  offerTo?: string;
  /** How precisely to show times to the recipient. Default "rough". */
  precision?: "rough" | "exact";
  createdAt: string;
}

