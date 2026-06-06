/**
 * Code constants. Everything the host actually tunes (availability hours,
 * guidance, event types) lives in settings.ts and is edited from the Settings
 * screen.
 */

export type DayCode = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

/** A preset the host ticks when composing a share. `description` steers the LLM. */
export interface EventType {
  id: string;
  label: string;
  description: string;
}

export interface Config {
  timezone: "Europe/London";
  horizonDays: number;
  owner: { name: string; contactEmail: string };
}

export const config: Config = {
  timezone: "Europe/London",
  horizonDays: 21,
  owner: { name: "Damon", contactEmail: "damon.falck@gmail.com" },
};

export const DEFAULT_EVENT_TYPES: EventType[] = [
  { id: "coffee", label: "Coffee or walk", description: "a short daytime coffee, catch-up or walk, ~30–60 min" },
  { id: "lunch", label: "Lunch", description: "lunch around midday, ~1 hr" },
  { id: "dinner", label: "Dinner or drinks", description: "an evening dinner or drinks, ~2–3 hrs, ideally not on a heavy day" },
  { id: "weekend", label: "Weekend meetup", description: "a longer, unhurried weekend meet-up" },
];

/** Seed guidance — captures the old reserve/all-day defaults as editable prose. */
export const DEFAULT_GUIDANCE = [
  "Keep at least 2 evenings a week free for late work, ideally including Monday.",
  "Prefer weekends for longer, unhurried meet-ups.",
  "On heavy back-to-back days, keep that evening calm.",
  "All-day entries are often loose holds before a time is fixed — reason about when they'll likely land rather than blocking the whole day.",
].join(" ");
