/**
 * The brain (Stage 2). Given the whole-horizon schedule (free windows + real
 * events) and a specific kind of meet-up, Claude proposes social availability
 * slots — reasoning over the events (all-day holds, deadlines, busy weeks,
 * energy) and the host's soft preferences. Output is validated against the free
 * windows downstream, so it can't collide with a confirmed meeting.
 *
 * The schedule + preferences block is prompt-cached, so multiple shares against
 * the same calendar reuse it cheaply.
 */

import type { Schedule } from "@/types/schedule";
import { dayMonth, localMinutes, minToClock, weekdayShort } from "@/lib/time";

export interface ProposedSlot {
  date: string;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  ifNeedBe: boolean;
}

export interface BrainContext {
  /** Labels + descriptions of the selected event types. */
  meetup: string;
  customDescription: string;
  preferences: string;
}

const SYSTEM = [
  "You help a single person share their social availability with a friend, for a",
  "specific kind of meet-up. You see their calendar over the next few weeks:",
  "each day's FREE windows (already computed — you must propose only inside them)",
  "and their actual EVENTS for context.",
  "",
  "Reason like a thoughtful assistant, across the whole horizon, not day by day:",
  "- Propose times that genuinely suit THIS meet-up (use its description).",
  "- Read the events: a brutal back-to-back day → keep that evening calm; a",
  "  deadline → keep the run-up light; a week that's already packed or full of",
  "  time off → don't pile more on.",
  "- All-day entries are often loose holds before a time is set — reason about",
  "  when they'll likely land and work around them rather than blocking the day.",
  "- Treat the host's preferences as strong soft guidance.",
  "- Mark ifNeedBe=true for times that are possible but not ideal (e.g. carving",
  "  out of a workday); false for comfortable, good options.",
  "- Quality over quantity, but don't be stingy. Never propose outside a free",
  "  window. Use HH:MM 24h, and keep each slot within a single day.",
].join("\n");

function formatSchedule(schedule: Schedule): string {
  const lines: string[] = [];
  for (const d of schedule.days) {
    if (!d.freeWindows.length && !d.events.length) continue;
    const free = d.freeWindows
      .map((w) => `${minToClock(localMinutes(w.startISO))}–${minToClock(localMinutes(w.endISO))}`)
      .join(", ");
    const events = d.events
      .map((e) => {
        const when = e.allDay
          ? "[all-day]"
          : `${minToClock(localMinutes(e.start))}–${minToClock(localMinutes(e.end))}`;
        const tags = [e.tentative ? "tentative" : "", e.busy ? "" : "non-blocking"]
          .filter(Boolean)
          .join(",");
        return `"${e.title}" ${when}${tags ? ` [${tags}]` : ""}`;
      })
      .join("; ");
    lines.push(
      `${weekdayShort(d.date)} ${dayMonth(d.date)} | free: ${free || "(none)"} | events: ${events || "(none)"}`,
    );
  }
  return lines.join("\n");
}

const TOOL = {
  name: "propose_slots",
  description: "Propose social availability slots for this meet-up.",
  input_schema: {
    type: "object",
    properties: {
      reasoning: {
        type: "string",
        description:
          "A brief, friendly explanation (2-4 sentences) of how you chose — what you " +
          "favoured, what you avoided and why. Shown to the host, not the recipient.",
      },
      slots: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "YYYY-MM-DD" },
            start: { type: "string", description: "HH:MM 24h, inside a free window" },
            end: { type: "string", description: "HH:MM 24h, inside the same free window" },
            ifNeedBe: { type: "boolean" },
          },
          required: ["date", "start", "end", "ifNeedBe"],
        },
      },
    },
    required: ["reasoning", "slots"],
  },
} as const;

export interface BrainResult {
  slots: ProposedSlot[];
  reasoning: string;
}

export async function proposeSlots(
  schedule: Schedule,
  context: BrainContext,
): Promise<BrainResult> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const cachedBlock = [
    "My preferences:",
    context.preferences || "(none)",
    "",
    "My schedule (free windows are where you may propose; events are context):",
    formatSchedule(schedule),
  ].join("\n");

  const ask = [
    `The meet-up: ${context.meetup}`,
    context.customDescription ? `Extra description: "${context.customDescription}"` : "",
    "",
    "Propose the slots via the tool.",
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3072,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as never],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: cachedBlock, cache_control: { type: "ephemeral" } },
          { type: "text", text: ask },
        ],
      },
    ],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") return { slots: [], reasoning: "" };
  const input = block.input as { slots?: ProposedSlot[]; reasoning?: string };
  return {
    slots: (input.slots ?? []).filter((s) => s.date && s.start && s.end),
    reasoning: input.reasoning ?? "",
  };
}
