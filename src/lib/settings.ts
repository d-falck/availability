/**
 * Editable base preferences, persisted under DATA_DIR. These override the code
 * defaults in config.ts and are edited from the Settings screen. The generation
 * pipeline reads them via effectiveConfig() so changes take effect on the next
 * refresh. `guidance` is free-text steering for the LLM refine step (used once
 * ANTHROPIC_API_KEY is set).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { config, type Config, type DayCode } from "@/config";
import { dataPath } from "./paths";

export interface Settings {
  minFreeEveningsPerWeek: number;
  pinnedReservedNights: DayCode[];
  dayWindow: { start: string; end: string };
  eveningWindow: { start: string; end: string };
  /** How all-day events affect availability: block the day, or ignore them. */
  allDayHandling: "busy" | "ignore";
  /** Natural-language preferences for the LLM refine step. */
  guidance: string;
}

export const defaultSettings: Settings = {
  minFreeEveningsPerWeek: config.eveningReserve.minFreeEveningsPerWeek,
  pinnedReservedNights: config.eveningReserve.pinnedReservedNights,
  dayWindow: config.dayWindow,
  eveningWindow: config.eveningWindow,
  allDayHandling: "busy",
  guidance: "",
};

export function loadSettings(): Settings {
  try {
    return { ...defaultSettings, ...(JSON.parse(readFileSync(dataPath("settings.json"), "utf8")) as Partial<Settings>) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: Settings): void {
  writeFileSync(dataPath("settings.json"), JSON.stringify(s, null, 2));
}

/** Merge saved settings over the code config for the generation pipeline. */
export function effectiveConfig(): Config {
  const s = loadSettings();
  return {
    ...config,
    dayWindow: s.dayWindow,
    eveningWindow: s.eveningWindow,
    eveningReserve: {
      minFreeEveningsPerWeek: s.minFreeEveningsPerWeek,
      pinnedReservedNights: s.pinnedReservedNights,
    },
  };
}
