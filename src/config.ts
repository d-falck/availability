/**
 * Single source of truth for all tunables. Edit this file to reshape how your
 * availability is computed and displayed. Nothing user-facing is hard-coded
 * elsewhere.
 */

import type { PriorityTier } from "@/types/snapshot";

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/** "HH:MM" 24h local time. */
export type ClockTime = string;

export interface TierView {
  /** Soft ceiling on slots shown per week for this tier. */
  maxSlotsPerWeek: number;
  /** Whether prime weekend time (Sat eve, Sun) can be offered to this tier. */
  allowPrimeWeekend: boolean;
  /** Friendly label shown nowhere private — used in viewer copy if desired. */
  label: string;
}

export interface Config {
  timezone: "Europe/London";
  horizonDays: number;

  /** Daytime "pop out of work" window. */
  dayWindow: { start: ClockTime; end: ClockTime };
  /** Evening dinner/drinks window. */
  eveningWindow: { start: ClockTime; end: ClockTime };

  durations: {
    quickMinMins: number;
    quickMaxMins: number;
    eveningMinMins: number;
  };

  eveningReserve: {
    /** Never expose more than (free evenings in week − this) evening slots. */
    minFreeEveningsPerWeek: number;
    /** Weeknights that are ALWAYS reserved — never offered, hard guardrail. */
    pinnedReservedNights: DayCode[];
    /** Whether reserved evenings are hidden entirely or shown greyed-out. */
    reservedDisplay: "hidden" | "greyed";
  };

  preferences: {
    /** Bias "preferred" marking toward Saturday/Sunday. */
    favorWeekends: boolean;
    /** Rough number of weekday-evening slots to aim to surface per week. */
    preferredWeekdayEveningGaps: number;
    /** Free-text steer handed to the LLM verbatim — your personal scheduling taste. */
    freeformGuidance: string;
  };

  /** Keyed by PriorityTier (1 = low, 2 = medium, 3 = high). */
  priorityTiers: Record<PriorityTier, TierView>;
}

export const config: Config = {
  timezone: "Europe/London",
  horizonDays: 21,

  dayWindow: { start: "09:00", end: "18:00" },
  eveningWindow: { start: "18:00", end: "23:00" },

  durations: {
    quickMinMins: 30,
    quickMaxMins: 60,
    eveningMinMins: 120,
  },

  eveningReserve: {
    minFreeEveningsPerWeek: 2,
    pinnedReservedNights: ["MON"],
    reservedDisplay: "hidden",
  },

  preferences: {
    favorWeekends: true,
    preferredWeekdayEveningGaps: 1,
    freeformGuidance: [
      "I like to keep evenings calm when I have a heavy meeting day.",
      "Weekends are the nicest time for a proper walk or a long meal.",
      "Don't suggest squeezing a coffee into a back-to-back morning.",
      "A gap right after a big block is great for getting some air.",
    ].join(" "),
  },

  priorityTiers: {
    3: { label: "high", maxSlotsPerWeek: 6, allowPrimeWeekend: true },
    2: { label: "medium", maxSlotsPerWeek: 4, allowPrimeWeekend: false },
    1: { label: "low", maxSlotsPerWeek: 2, allowPrimeWeekend: false },
  },
};
