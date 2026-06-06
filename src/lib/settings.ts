/**
 * Runtime-editable settings, persisted under DATA_DIR (Settings screen):
 *  - availability hours (structured — bounds the deterministic free-window geometry),
 *  - guidance (the editable "prompt" — soft preferences for the brain),
 *  - event types (the presets the host ticks when composing a share).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_EVENT_TYPES, DEFAULT_GUIDANCE, type EventType } from "@/config";
import { dataPath } from "./paths";

export interface Settings {
  /** Earliest/latest "HH:MM" the host would ever meet — bounds the free windows. */
  availableFrom: string;
  availableTo: string;
  /** How many days out to offer options. */
  horizonDays: number;
  /** Plain-English soft preferences for the brain. */
  guidance: string;
  eventTypes: EventType[];
}

export const defaultSettings: Settings = {
  availableFrom: "09:00",
  availableTo: "23:00",
  horizonDays: 21,
  guidance: DEFAULT_GUIDANCE,
  eventTypes: DEFAULT_EVENT_TYPES,
};

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(readFileSync(dataPath("settings.json"), "utf8")) as Partial<Settings>;
    return {
      ...defaultSettings,
      ...saved,
      eventTypes: saved.eventTypes?.length ? saved.eventTypes : defaultSettings.eventTypes,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: Settings): void {
  writeFileSync(dataPath("settings.json"), JSON.stringify(s, null, 2));
}
