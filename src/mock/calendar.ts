/**
 * Mock calendar — a deliberately messy, realistic 3 weeks so we can build and
 * tune the generation pipeline before wiring up Google. It mixes back-to-back
 * meeting mornings, deep-work blocks, recurring personal commitments, soft
 * tentative evenings, all-day events and weekend plans — exactly the texture
 * the LLM needs to reason well.
 *
 * Anchored to the current horizon (week of Mon 2026-06-01, all BST / +01:00).
 * Day offsets: 0 = Mon 1 Jun, 1 = Tue 2 Jun (today) ... 20 = Sun 21 Jun.
 * Re-anchoring later is a one-line change to ANCHOR.
 */

import type { CalendarFetch, RawEvent } from "@/types/calendar";

const ANCHOR_MONTH = "06";
const ANCHOR_FIRST_DOM = 1; // 2026-06-01 is the Monday of week 0
const ANCHOR_YEAR = "2026";
const OFFSET = "+01:00"; // BST throughout this horizon

const pad = (n: number) => String(n).padStart(2, "0");

/** Build a London-local ISO timestamp from a day offset + "HH:MM". */
function iso(dayOffset: number, time: string): string {
  const dom = ANCHOR_FIRST_DOM + dayOffset; // stays within June for 0..21
  return `${ANCHOR_YEAR}-${ANCHOR_MONTH}-${pad(dom)}T${time}:00${OFFSET}`;
}

let seq = 0;
function ev(
  dayOffset: number,
  startTime: string,
  endTime: string,
  e: Omit<RawEvent, "id" | "start" | "end">,
): RawEvent {
  return {
    id: `mock-${pad(seq++)}`,
    start: iso(dayOffset, startTime),
    end: iso(dayOffset, endTime),
    ...e,
  };
}

/** All-day event spanning a single day. */
function allDay(
  dayOffset: number,
  e: Omit<RawEvent, "id" | "start" | "end" | "allDay">,
): RawEvent {
  return {
    id: `mock-${pad(seq++)}`,
    start: iso(dayOffset, "00:00"),
    end: iso(dayOffset + 1, "00:00"),
    allDay: true,
    ...e,
  };
}

const events: RawEvent[] = [
  // ── Recurring scaffolding across all three weeks ──────────────────────────
  ...[0, 1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18].flatMap((d) => [
    ev(d, "09:30", "09:45", {
      source: "work",
      title: "Standup",
      attendeeCount: 8,
      status: "confirmed",
      transparency: "opaque",
      recurring: true,
    }),
  ]),
  // Gym, Tue & Thu evenings — a real but soft personal commitment.
  ...[1, 3, 8, 10, 15, 17].map((d) =>
    ev(d, "18:15", "19:15", {
      source: "personal",
      title: "Gym",
      status: "confirmed",
      transparency: "opaque",
      recurring: true,
    }),
  ),

  // ── Week 0 (Mon 1 – Sun 7 Jun) ────────────────────────────────────────────
  // Mon: heavy planning day.
  ev(0, "10:00", "12:00", {
    source: "work",
    title: "Quarter planning",
    description: "Roadmap lock-in with leads",
    attendeeCount: 12,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(0, "14:00", "16:00", {
    source: "work",
    title: "Design reviews",
    attendeeCount: 6,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(0, "20:00", "22:30", {
    source: "personal",
    title: "Late work — ship the release",
    description: "Heads-down, do not disturb",
    status: "confirmed",
    transparency: "opaque",
  }),

  // Tue (today): back-to-back morning, clearer afternoon.
  ev(1, "10:00", "10:45", {
    source: "work",
    title: "1:1 with Priya",
    attendeeCount: 2,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(1, "11:00", "12:30", {
    source: "work",
    title: "Vendor sync",
    attendeeCount: 5,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(1, "19:30", "22:00", {
    source: "personal",
    title: "Dinner with Sam",
    location: "Soho",
    status: "confirmed",
    transparency: "opaque",
  }),

  // Wed: deep work morning, open afternoon — good "pop out" candidate.
  ev(2, "09:00", "12:00", {
    source: "work",
    title: "Deep work — API refactor",
    description: "Focus block",
    status: "confirmed",
    transparency: "opaque",
  }),

  // Thu: scattered, soft tentative evening drinks.
  ev(3, "13:00", "14:00", {
    source: "work",
    title: "Hiring panel debrief",
    attendeeCount: 4,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(3, "20:00", "21:30", {
    source: "personal",
    title: "Drinks? (maybe)",
    description: "Not confirmed yet",
    status: "tentative",
    transparency: "transparent",
  }),

  // Fri: demo then wind down.
  ev(4, "11:00", "12:00", {
    source: "work",
    title: "Sprint demo",
    attendeeCount: 10,
    status: "confirmed",
    transparency: "opaque",
  }),

  // Weekend 0: parkrun + lazy Sunday.
  ev(5, "09:00", "10:00", {
    source: "personal",
    title: "Parkrun",
    location: "Victoria Park",
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(6, "13:00", "15:00", {
    source: "personal",
    title: "Family lunch",
    status: "confirmed",
    transparency: "opaque",
  }),

  // ── Week 1 (Mon 8 – Sun 14 Jun) ───────────────────────────────────────────
  ev(7, "10:00", "11:30", {
    source: "work",
    title: "All-hands",
    attendeeCount: 40,
    status: "confirmed",
    transparency: "opaque",
  }),
  // Tue: brutal back-to-back day.
  ev(8, "10:00", "11:00", {
    source: "work",
    title: "Roadmap review",
    attendeeCount: 7,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(8, "11:00", "12:00", {
    source: "work",
    title: "Customer call",
    attendeeCount: 5,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(8, "12:00", "13:00", {
    source: "work",
    title: "Architecture sync",
    attendeeCount: 6,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(8, "14:00", "15:30", {
    source: "work",
    title: "Incident retro",
    attendeeCount: 9,
    status: "confirmed",
    transparency: "opaque",
  }),
  // Wed: soft maybe-evening + open day.
  ev(10, "16:00", "17:00", {
    source: "work",
    title: "1:1 with manager",
    attendeeCount: 2,
    status: "confirmed",
    transparency: "opaque",
  }),
  // Fri afternoon off.
  allDay(11, {
    source: "personal",
    title: "Annual leave (afternoon)",
    description: "Taking the afternoon",
    status: "confirmed",
    transparency: "transparent",
  }),
  // Weekend 1: Alex's birthday all day Sat.
  allDay(12, {
    source: "personal",
    title: "Alex's birthday weekend",
    location: "Brighton",
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(13, "11:00", "13:00", {
    source: "personal",
    title: "Brunch",
    location: "Brighton",
    status: "confirmed",
    transparency: "opaque",
  }),

  // ── Week 2 (Mon 15 – Sun 21 Jun) ──────────────────────────────────────────
  ev(14, "10:00", "12:00", {
    source: "work",
    title: "Quarter planning",
    attendeeCount: 12,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(15, "10:30", "11:30", {
    source: "work",
    title: "Design crit",
    attendeeCount: 5,
    status: "confirmed",
    transparency: "opaque",
  }),
  // Wed light, Thu open evening (gym only), Fri demo.
  ev(18, "11:00", "12:00", {
    source: "work",
    title: "Sprint demo",
    attendeeCount: 10,
    status: "confirmed",
    transparency: "opaque",
  }),
  ev(18, "15:00", "15:30", {
    source: "work",
    title: "1:1 with Priya",
    attendeeCount: 2,
    status: "confirmed",
    transparency: "opaque",
  }),
  // Weekend 2: wide open — prime weekend meetup territory.
  ev(19, "10:00", "11:00", {
    source: "personal",
    title: "Parkrun",
    location: "Victoria Park",
    status: "confirmed",
    transparency: "opaque",
  }),
];

/** The mock fetch spanning the full anchored horizon (Mon 1 – Sun 21 Jun). */
export const mockCalendar: CalendarFetch = {
  fromISO: `${ANCHOR_YEAR}-${ANCHOR_MONTH}-01`,
  toISO: `${ANCHOR_YEAR}-${ANCHOR_MONTH}-22`,
  timezone: "Europe/London",
  events,
};
