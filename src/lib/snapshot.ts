import { readFileSync, writeFileSync } from "node:fs";
import { dataPath } from "./paths";
import type { Snapshot } from "@/types/snapshot";

/** Read the latest base snapshot, or null if generation hasn't run yet. */
export function loadSnapshot(): Snapshot | null {
  try {
    return JSON.parse(readFileSync(dataPath("snapshot.json"), "utf8")) as Snapshot;
  } catch {
    return null;
  }
}

export function saveSnapshot(snapshot: Snapshot): void {
  writeFileSync(dataPath("snapshot.json"), JSON.stringify(snapshot, null, 2));
}
