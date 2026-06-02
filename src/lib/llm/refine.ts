/**
 * The Stage 2 LLM refine call. Given the rule-generated candidate windows for a
 * share, Claude curates them for the specific kind of meet-up and the host's
 * guidance: which to show, in what light ("if need be"), dropping awkward ones.
 * It only sees sanitized windows — no event titles — so nothing private leaks.
 *
 * Returns null when no ANTHROPIC_API_KEY is set, so callers fall back to the
 * deterministic result.
 */

import type { RefineResult } from "@/lib/refinecache";

export interface RefineCandidate {
  id: string;
  /** Human day label, e.g. "Sat 6 Jun". */
  day: string;
  /** Human time label, e.g. "all day", "7:15–11pm". */
  time: string;
  lane: string;
  ifNeedBe: boolean;
}

export interface RefineContext {
  typeLabels: string[];
  customDescription: string;
  guidance: string;
}

const TOOL = {
  name: "refine_windows",
  description: "Choose which availability windows to show for this meet-up.",
  input_schema: {
    type: "object",
    properties: {
      keep: {
        type: "array",
        description: "Windows to show, best-first is fine; drop awkward ones entirely.",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            ifNeedBe: {
              type: "boolean",
              description: "true if this is a time the host would rather not, but could.",
            },
          },
          required: ["id", "ifNeedBe"],
        },
      },
    },
    required: ["keep"],
  },
} as const;

const SYSTEM = [
  "You curate a single-user's social availability for a friend to look at.",
  "You are given candidate free windows (already privacy-safe — no event details)",
  "and the kind of meet-up. Your job:",
  "- Keep windows that genuinely suit this meet-up; drop ones that feel awkward",
  "  or off (e.g. a tiny daytime gap for a long dinner, weekday lunch for 'weekend').",
  "- Honour the host's guidance below as strong preference.",
  "- Mark a window ifNeedBe=true when it's possible but not ideal for the host",
  "  (e.g. interrupting a workday), false when it's a comfortable, good option.",
  "- Don't invent windows; only choose from the given ids. Prefer to keep a good",
  "  spread rather than overwhelming — but don't be stingy.",
].join("\n");

export async function llmRefine(
  candidates: RefineCandidate[],
  context: RefineContext,
): Promise<RefineResult | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!candidates.length) return { keep: [] };

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();

  const userText = [
    `Meet-up: ${context.typeLabels.join(", ") || "(see description)"}`,
    context.customDescription ? `Description: "${context.customDescription}"` : "",
    context.guidance ? `Host guidance: ${context.guidance}` : "Host guidance: (none)",
    "",
    "Candidate windows:",
    ...candidates.map(
      (c) => `- id=${c.id} | ${c.day} | ${c.time} | lane=${c.lane} | currentlyIfNeedBe=${c.ifNeedBe}`,
    ),
    "",
    "Choose the windows to show via the tool.",
  ]
    .filter(Boolean)
    .join("\n");

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [TOOL as never],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: userText }],
  });

  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") return null;
  const keep = (block.input as RefineResult).keep ?? [];
  // Guard: only ids we actually offered.
  const valid = new Set(candidates.map((c) => c.id));
  return { keep: keep.filter((k) => valid.has(k.id)) };
}
