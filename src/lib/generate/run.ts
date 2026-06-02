/**
 * Stage 1 orchestrator: fetch -> rules -> guardrails -> snapshot. Exposed as
 * generate() for the refresh timer and the regenerate API, and runnable directly
 * via `npm run generate`.
 */

import { addDays, localDate, todayInTz } from "@/lib/time";
import { saveSnapshot } from "@/lib/snapshot";
import { effectiveConfig, loadSettings } from "@/lib/settings";
import { listShares } from "@/lib/shares";
import { warmShare } from "@/lib/refine";
import { fetchCalendar } from "./fetch";
import { generateCandidates } from "./rules";
import { applyGuardrails, buildSnapshot } from "./guardrails";

export async function generate(now?: string) {
  const config = effectiveConfig();
  const settings = loadSettings();
  const fetch = await fetchCalendar();
  // Mock data is anchored to a fixed month; real data uses today.
  const ref =
    now ?? (fetch.source === "mock" ? addDays(localDate(fetch.fromISO), 1) : todayInTz(config.timezone));

  const candidates = generateCandidates(fetch, config, ref, settings.allDayHandling === "busy");
  const slots = applyGuardrails(candidates, config);
  const snapshot = buildSnapshot(slots, config, ref);
  saveSnapshot(snapshot);

  // Warm the Stage 2 refine cache for existing shares (no-op without an API key,
  // and a cache hit when a share's options didn't change).
  if (process.env.ANTHROPIC_API_KEY) {
    for (const share of listShares()) {
      await warmShare(share, snapshot, settings.guidance).catch((e) =>
        console.error("[refine] warm failed:", e?.message ?? e),
      );
    }
  }

  return { snapshot, proposed: candidates.length, source: fetch.source };
}

if (process.argv[1] && process.argv[1].endsWith("run.ts")) {
  generate()
    .then(({ snapshot, proposed, source }) => {
      const byLane = (l: string) => snapshot.slots.filter((s) => s.lane === l).length;
      console.log(`\n  source: ${source}`);
      console.log(`  proposed ${proposed} → kept ${snapshot.slots.length} windows`);
      console.log(`  lanes: quick ${byLane("quick")}  evening ${byLane("evening")}  weekend ${byLane("weekend")}\n`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
