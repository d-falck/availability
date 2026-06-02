/**
 * Code defaults. Runtime-editable preferences live in settings.ts (Settings
 * screen) and override the reserve/window/guidance values here.
 */

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/** "HH:MM" 24h local time. */
export type ClockTime = string;

/** A preset the host ticks when composing a share. `description` steers the LLM. */
export interface EventType {
  id: string;
  label: string;
  description: string;
}

export interface Config {
  timezone: "Europe/London";
  horizonDays: number;

  /** Overall availability window each day; the brain picks times within it. */
  dayWindow: { start: ClockTime; end: ClockTime };
  eveningWindow: { start: ClockTime; end: ClockTime };

  /** Soft reserve preference (rendered into the prompt, not hard-enforced). */
  eveningReserve: {
    minFreeEveningsPerWeek: number;
    pinnedReservedNights: DayCode[];
  };

  eventTypes: EventType[];

  owner: { name: string; contactEmail: string };
}

export const config: Config = {
  timezone: "Europe/London",
  horizonDays: 21,

  dayWindow: { start: "09:00", end: "18:00" },
  eveningWindow: { start: "18:00", end: "23:00" },

  eveningReserve: {
    minFreeEveningsPerWeek: 2,
    pinnedReservedNights: ["MON"],
  },

  eventTypes: [
    { id: "coffee", label: "Coffee", description: "a short daytime coffee or catch-up, ~30–60 min" },
    { id: "walk", label: "Walk", description: "a daytime or weekend walk, ~30–90 min" },
    { id: "lunch", label: "Lunch", description: "lunch around midday, ~1 hr" },
    { id: "dinner", label: "Dinner", description: "an evening dinner, ~2 hrs, ideally not on a heavy day" },
    { id: "drinks", label: "Drinks", description: "evening drinks, ~2–3 hrs, weekdays or weekend" },
    { id: "weekend", label: "Weekend meetup", description: "a longer, unhurried weekend meet-up" },
  ],

  owner: { name: "Damon", contactEmail: "damon.falck@gmail.com" },
};

export const eventTypeById = (id: string): EventType | undefined =>
  config.eventTypes.find((t) => t.id === id);
