/**
 * Orchestrates a full regeneration: fetch -> reason -> guardrails -> snapshot,
 * writing data/snapshot.json. Run with `npm run generate`. Prints a readable
 * before/after so you can see what the reasoner proposed and what the
 * guardrails trimmed.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "@/config";
import { addDays, localDate } from "@/lib/time";
import { fetchCalendar } from "./fetch";
import { reason } from "./reason";
import { applyGuardrails, buildSnapshot } from "./guardrails";

export const SNAPSHOT_PATH = resolve(process.cwd(), "data", "snapshot.json");

export async function generate(now?: string) {
  const fetch = await fetchCalendar();
  const ref = now ?? addDays(localDate(fetch.fromISO), 1); // mock "today" = 2 Jun

  const { candidates, source } = await reason(fetch, config, ref);
  const { slots, weeks } = applyGuardrails(candidates, config, fetch);
  const snapshot = buildSnapshot(slots, weeks, config, ref);

  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));

  return { snapshot, source, proposed: candidates.length };
}

function summarise(
  proposed: number,
  source: string,
  snapshot: Awaited<ReturnType<typeof generate>>["snapshot"],
) {
  const byLane = (l: string) => snapshot.slots.filter((s) => s.lane === l).length;
  const byTier = (t: number) => snapshot.slots.filter((s) => s.minOpenness <= t).length;
  console.log(`\n  reasoner: ${source}`);
  console.log(`  proposed ${proposed} → kept ${snapshot.slots.length} after guardrails`);
  console.log(`  lanes: quick ${byLane("quick")}  evening ${byLane("evening")}  weekend ${byLane("weekend")}`);
  console.log(`  visible per tier: low ${byTier(1)}  medium ${byTier(2)}  high ${byTier(3)}`);
  console.log(
    `  evenings kept free/week: ${snapshot.weeks.map((w) => w.eveningsKeptFree).join(", ")}`,
  );
  console.log(`  → ${SNAPSHOT_PATH}\n`);
}

// Run directly (tsx src/lib/generate/run.ts)
if (process.argv[1] && process.argv[1].endsWith("run.ts")) {
  generate()
    .then(({ snapshot, source, proposed }) => summarise(proposed, source, snapshot))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
