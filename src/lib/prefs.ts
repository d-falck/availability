/**
 * Renders the host's settings into a natural-language preferences block for the
 * brain. These are soft preferences (the LLM weighs them), not hard rules.
 */

import type { Settings } from "./settings";

export function buildPreferences(s: Settings): string {
  const nights = s.pinnedReservedNights.length
    ? `, ideally including ${s.pinnedReservedNights.join(", ")}`
    : "";
  const lines = [
    `My day generally runs ${s.dayWindow.start}–${s.eveningWindow.end}.`,
    s.minFreeEveningsPerWeek > 0 &&
      `Try to keep at least ${s.minFreeEveningsPerWeek} evening(s) each week free for late work${nights}.`,
    s.allDayHandling === "ignore"
      ? "All-day events are often loose holds before a time is fixed — reason about when they'll likely land and still propose times around them."
      : "All-day events usually mean I'm unavailable that day, but use judgement if one looks like a loose hold.",
    s.guidance.trim(),
  ].filter(Boolean);
  return lines.join("\n");
}
