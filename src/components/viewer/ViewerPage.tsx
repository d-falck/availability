/**
 * The recipient page — deliberately minimal: just a chronological list of days,
 * with combined same-day times, unambiguous labels, and a quiet "if need be" on
 * times to avoid. No name, no top copy, no categories. Classy serif, follows the
 * system light/dark setting. Presentational and server-renderable; the
 * select-and-copy behaviour is layered on by the controller.
 */

import * as React from "react";
import type { Slot } from "@/types/snapshot";
import { groupByDay } from "@/lib/dayview";
import { dayMonth, weekdayShort } from "@/lib/time";

export function ViewerPage({ slots }: { slots: Slot[] }) {
  const days = groupByDay(slots);

  return (
    <main className="min-h-screen bg-white text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-md px-6 py-16 sm:py-20">
        <ul>
          {days.length === 0 && (
            <li className="py-3 text-[16px] text-stone-400 dark:text-stone-500">
              Nothing free just now.
            </li>
          )}
          {days.map((d) => (
            <li key={d.date}>
              <button
                type="button"
                data-slot-id={d.date}
                data-label={`${weekdayShort(d.date)} ${dayMonth(d.date)} — ${d.label}`}
                className="slot group flex w-full items-center gap-4 border-b border-stone-100 py-3.5 pr-1 text-left dark:border-stone-800"
              >
                <span className="w-24 shrink-0 text-[16px] text-stone-400 dark:text-stone-500">
                  {weekdayShort(d.date)} {dayMonth(d.date)}
                </span>
                <span className="slot-time flex-1 text-[16px] text-stone-800 dark:text-stone-200">
                  {d.label}
                </span>
                {d.ifNeedBe && (
                  <span className="shrink-0 text-[13px] italic text-stone-400 dark:text-stone-500">
                    if need be
                  </span>
                )}
                <span className="box flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-stone-300 text-[10px] leading-none text-white dark:border-stone-600 dark:text-stone-900">
                  <span className="tick">✓</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="suggest-bar pointer-events-none fixed inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-stone-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
          <span className="suggest-count text-[13px] text-stone-500 dark:text-stone-400">
            0 selected
          </span>
          <button
            type="button"
            className="suggest-send rounded-full bg-stone-900 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            Copy these
          </button>
        </div>
      </div>
    </main>
  );
}
