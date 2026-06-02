/**
 * Single source of truth for all tunables. Edit this file to reshape how your
 * availability is computed and which event types the private page offers.
 */

import type { Lane } from "@/types/snapshot";

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/** "HH:MM" 24h local time. */
export type ClockTime = string;

/** Coarse time-of-day band an event type prefers. */
export type TimeBand = "day" | "midday" | "evening";

export interface EventType {
  id: string;
  label: string;
  /** Internal lanes whose windows can suit this type. */
  lanes: Lane[];
  /** Time-of-day bands this type wants a window to overlap. */
  bands: TimeBand[];
  /** Minimum overlap (mins) with a band for a window to count. */
  minMins: number;
}

export interface Config {
  timezone: "Europe/London";
  horizonDays: number;

  dayWindow: { start: ClockTime; end: ClockTime };
  eveningWindow: { start: ClockTime; end: ClockTime };

  durations: {
    quickMinMins: number;
    quickMaxMins: number;
    eveningMinMins: number;
  };

  eveningReserve: {
    /** Never expose more than (free evenings in week − this) evening windows. */
    minFreeEveningsPerWeek: number;
    /** Weeknights always reserved — never offered. */
    pinnedReservedNights: DayCode[];
  };

  /** Standard event types offered on the private page. */
  eventTypes: EventType[];

  /** Who the pages are for and where "suggest these" replies go. */
  owner: { name: string; contactEmail: string };
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
  },

  eventTypes: [
    { id: "coffee", label: "Coffee", lanes: ["quick", "weekend"], bands: ["day"], minMins: 30 },
    { id: "walk", label: "Walk", lanes: ["quick", "weekend"], bands: ["day"], minMins: 30 },
    { id: "lunch", label: "Lunch", lanes: ["quick", "weekend"], bands: ["midday"], minMins: 45 },
    { id: "dinner", label: "Dinner", lanes: ["evening", "weekend"], bands: ["evening"], minMins: 90 },
    { id: "drinks", label: "Drinks", lanes: ["evening", "weekend"], bands: ["evening"], minMins: 90 },
    { id: "weekend", label: "Weekend meetup", lanes: ["weekend"], bands: ["day", "evening"], minMins: 60 },
  ],

  owner: { name: "Damon", contactEmail: "damon.falck@gmail.com" },
};

export const eventTypeById = (id: string): EventType | undefined =>
  config.eventTypes.find((t) => t.id === id);
