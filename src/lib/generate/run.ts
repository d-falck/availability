/**
 * Generation: fetch -> geometry (Schedule) -> save -> warm the brain cache for
 * existing shares. Triggered by the refresh timer and the regenerate API, and
 * runnable via `npm run generate`.
 */

import { addDays, localDate, todayInTz } from "@/lib/time";
import { effectiveConfig } from "@/lib/settings";
import { saveSchedule } from "@/lib/schedule";
import { listShares } from "@/lib/shares";
import { warmShare } from "@/lib/refine";
import { fetchCalendar } from "./fetch";
import { buildSchedule } from "./geometry";

export async function generate(now?: string) {
  const config = effectiveConfig();
  const fetch = await fetchCalendar();
  // Mock data is anchored to a fixed month; real data uses today.
  const ref =
    now ?? (fetch.source === "mock" ? addDays(localDate(fetch.fromISO), 1) : todayInTz(config.timezone));

  const schedule = buildSchedule(fetch, config, ref);
  saveSchedule(schedule);

  // Warm the brain cache for existing shares (needs a key; a cache hit when a
  // share's options didn't change).
  if (process.env.ANTHROPIC_API_KEY) {
    for (const share of listShares()) {
      await warmShare(share, schedule).catch((e) =>
        console.error("[brain] warm failed:", e?.message ?? e),
      );
    }
  }

  return { schedule, source: fetch.source };
}

if (process.argv[1] && process.argv[1].endsWith("run.ts")) {
  generate()
    .then(({ schedule, source }) => {
      const free = schedule.days.reduce((n, d) => n + d.freeWindows.length, 0);
      console.log(`\n  source: ${source}`);
      console.log(`  ${schedule.days.length} days, ${free} free windows`);
      console.log(`  → data/schedule.json\n`);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
