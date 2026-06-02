/**
 * All mutable state lives under DATA_DIR. In production this is the Fly volume
 * mount (e.g. /data) so it survives deploys; locally it defaults to ./data.
 * This is the seam that makes "update code without losing state" work.
 */

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const DATA_DIR = process.env.DATA_DIR
  ? resolve(process.env.DATA_DIR)
  : resolve(process.cwd(), "data");

export function dataPath(name: string): string {
  mkdirSync(DATA_DIR, { recursive: true });
  return resolve(DATA_DIR, name);
}
