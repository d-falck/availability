import { readFileSync, writeFileSync } from "node:fs";
import { dataPath } from "./paths";
import type { Schedule } from "@/types/schedule";

/** The geometry+events schedule is server-only state (contains event titles). */
export function loadSchedule(): Schedule | null {
  try {
    return JSON.parse(readFileSync(dataPath("schedule.json"), "utf8")) as Schedule;
  } catch {
    return null;
  }
}

export function saveSchedule(schedule: Schedule): void {
  writeFileSync(dataPath("schedule.json"), JSON.stringify(schedule, null, 2));
}
