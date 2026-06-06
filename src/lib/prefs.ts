/**
 * Renders the host's settings into the preferences block for the brain:
 * the availability hours plus the free-text guidance.
 */

import type { Settings } from "./settings";

export function buildPreferences(s: Settings): string {
  return [
    `I'm generally open to meet between ${s.availableFrom} and ${s.availableTo}.`,
    "",
    s.guidance.trim() || "(no further preferences)",
  ].join("\n");
}
