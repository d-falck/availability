import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Snapshot } from "@/types/snapshot";

/** Read the latest base snapshot, or null if generation hasn't run yet. */
export function loadSnapshot(): Snapshot | null {
  try {
    return JSON.parse(
      readFileSync(resolve(process.cwd(), "data", "snapshot.json"), "utf8"),
    ) as Snapshot;
  } catch {
    return null;
  }
}
