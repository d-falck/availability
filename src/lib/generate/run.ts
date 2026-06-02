/**
 * Stage 1 orchestrator: fetch -> rules -> guardrails -> data/snapshot.json.
 * Run with `npm run generate`. Later this is triggered by the Google
 * calendar-change webhook; the output is the same either way.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "@/config";
import { addDays, localDate } from "@/lib/time";
import { fetchCalendar } from "./fetch";
import { generateCandidates } from "./rules";
import { applyGuardrails, buildSnapshot } from "./guardrails";

export const SNAPSHOT_PATH = resolve(process.cwd(), "data", "snapshot.json");

export async function generate(now?: string) {
  const fetch = await fetchCalendar();
  const ref = now ?? addDays(localDate(fetch.fromISO), 1); // mock "today" = 2 Jun
  const candidates = generateCandidates(fetch, config, ref);
  const slots = applyGuardrails(candidates, config);
  const snapshot = buildSnapshot(slots, config, ref);

  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
  return { snapshot, proposed: candidates.length };
}

if (process.argv[1] && process.argv[1].endsWith("run.ts")) {
  generate()
    .then(({ snapshot, proposed }) => {
      const byLane = (l: string) => snapshot.slots.filter((s) => s.lane === l).length;
      console.log(`\n  proposed ${proposed} → kept ${snapshot.slots.length} windows`);
      console.log(`  lanes: quick ${byLane("quick")}  evening ${byLane("evening")}  weekend ${byLane("weekend")}`);
      console.log(`  → ${SNAPSHOT_PATH}\n`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
