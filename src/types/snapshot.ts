/**
 * Slot — a single sanitized availability window shown to a recipient. This is
 * the ONLY availability data that crosses to the browser: precise bounds (so
 * Mode A booking can reuse them) plus a quiet "if need be". The casual wording
 * is derived from the bounds at render time (timefmt/dayview).
 */

export interface Slot {
  id: string;
  /** "YYYY-MM-DD" */
  date: string;
  startISO: string;
  endISO: string;
  /** A time the host would rather not, but could. */
  ifNeedBe: boolean;
}
