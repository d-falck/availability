/**
 * Snapshot — the SANITIZED, public contract between the generation pipeline and
 * the viewer page. This is the ONLY data the viewer ever sees. There are
 * deliberately no event titles, descriptions, locations or attendees here:
 * everything is a derived, privacy-safe window.
 */

/** The two lanes from the design, plus weekend as its own visual lane. */
export type Lane = "quick" | "evening" | "weekend";

/**
 * Openness tier. A slot is shown to a viewer whose link tier is >= this value.
 *   1 = anyone (even a low-priority link sees it)
 *   2 = medium and high
 *   3 = high-priority links only (your most stretch-worthy time)
 */
export type Openness = 1 | 2 | 3;

/** Which view a given share link renders. */
export type PriorityTier = 1 | 2 | 3; // low | medium | high

export interface Slot {
  id: string;
  lane: Lane;
  /** Local date "YYYY-MM-DD" in the snapshot timezone. */
  date: string;
  /** Human, deliberately fuzzy: "after 7ish", "lunchtime", "Sat afternoon". */
  roughTime: string;
  /** Precise bounds, kept for sorting/grouping — not necessarily shown verbatim. */
  startISO: string;
  endISO: string;
  /** LLM-marked: rendered with a subtle accent as a gentle nudge. */
  preferred: boolean;
  minOpenness: Openness;
  /** Privacy-safe colour, e.g. "an easy gap between things". Never leaks titles. */
  note?: string;
}

export interface WeekSummary {
  /** Local date "YYYY-MM-DD" of the week's Monday. */
  weekStart: string;
  /** Powers the "kept for deep work" indicator. */
  eveningsKeptFree: number;
}

export interface Snapshot {
  /** ISO timestamp the snapshot was generated. */
  generatedAt: string;
  timezone: string;
  /** Inclusive first / exclusive last local dates covered. */
  horizon: { fromISO: string; toISO: string };
  weeks: WeekSummary[];
  slots: Slot[];
}

/**
 * A candidate slot as proposed by the LLM, BEFORE deterministic guardrails run.
 * Same shape as Slot but understood to be untrusted: the post-processor may
 * drop it (reserve cap, pinned night) or down-tier it before it becomes a Slot.
 */
export type CandidateSlot = Slot;
