/**
 * Prompt construction for the LLM reasoning pass. The system block is stable
 * (rules + guidance) so it caches well across regenerations; the user block
 * carries the volatile calendar. The model returns candidate slots via a tool
 * schema (see reason.ts) so we never parse free-form JSON.
 */

import type { Config } from "@/config";
import type { CalendarFetch } from "@/types/calendar";

export function buildSystemPrompt(config: Config): string {
  const c = config;
  return [
    "You are a thoughtful scheduling assistant for a single person. You read",
    "their work and personal calendar and propose a small set of *social*",
    "availability slots — for coffee, a walk, dinner or drinks — that a friend",
    "could pick from. You are NOT booking anything; you are shaping options.",
    "",
    "Reason like a considerate human, not a gap-finder:",
    "- Don't suggest a coffee wedged into a back-to-back meeting morning.",
    "- A gap right after a long, heavy block is a GREAT time to get some air.",
    "- Treat tentative or 'maybe' events as soft — the time may still work, but",
    "  mark it less confidently.",
    "- All-day informational events are context, not always hard blocks.",
    "- Protect the person's energy: a brutal meeting day should yield calmer",
    "  evening suggestions, or none.",
    "",
    "Lanes:",
    "- quick: 30–60 min daytime coffee/walk.",
    "- evening: 2–3 hr weekday dinner/drinks.",
    "- weekend: Saturday/Sunday meetups, the nicest time for something longer.",
    "",
    "Each slot gets an openness 1–3 (how much they'd stretch for someone):",
    "1 = anyone, 2 = medium, 3 = only for high-priority people (prime weekend",
    "and the best evenings).",
    "",
    "Hard preferences:",
    `- Day window ${c.dayWindow.start}–${c.dayWindow.end}; evening window ${c.eveningWindow.start}–${c.eveningWindow.end}.`,
    `- Keep at least ${c.eveningReserve.minFreeEveningsPerWeek} evenings per week clear for late work.`,
    `- These weeknights are always reserved, never offer them: ${c.eveningReserve.pinnedReservedNights.join(", ") || "none"}.`,
    c.preferences.favorWeekends ? "- Favour weekends for the nicest meetups." : "",
    "",
    "Personal guidance (verbatim from the user):",
    c.preferences.freeformGuidance,
    "",
    "Give fuzzy, human rough times ('after 7ish', 'around lunchtime', 'Sat",
    "afternoon'). Never leak event titles, locations or attendees in notes —",
    "notes must be privacy-safe colour only ('an easy gap between things').",
    "Hard caps are re-enforced by code afterwards, but respect them anyway.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildUserPrompt(fetch: CalendarFetch, now: string): string {
  const lines = fetch.events
    .filter((e) => e.end >= now)
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((e) => {
      const bits = [
        `${e.start} → ${e.end}`,
        e.allDay ? "[all-day]" : "",
        `${e.source}`,
        e.status === "tentative" ? "[tentative]" : "",
        e.transparency === "transparent" ? "[free/soft]" : "",
        `"${e.title}"`,
        e.attendeeCount ? `(${e.attendeeCount} ppl)` : "",
        e.location ? `@ ${e.location}` : "",
        e.description ? `— ${e.description}` : "",
      ].filter(Boolean);
      return "- " + bits.join(" ");
    });

  return [
    `Timezone: ${fetch.timezone}. "Now" is ${now}; only propose slots after it.`,
    `Horizon: through ${fetch.toISO}.`,
    "",
    "My calendar (work + personal, full detail — keep it private):",
    ...lines,
    "",
    "Propose the social availability slots via the provided tool.",
  ].join("\n");
}
