/**
 * The recipient page — deliberately minimal: a chronological list of days, with
 * combined same-day times, specific where the data allows, and a quiet "if need
 * be" on times to avoid. No categories, no copy, no emoji. Presentational and
 * server-renderable so the same markup powers the Next route and the standalone
 * preview; selection/compose is layered on by the controller.
 */

import * as React from "react";
import type { Slot } from "@/types/snapshot";
import { groupByDay } from "@/lib/dayview";
import { dayMonth, weekdayShort } from "@/lib/time";

export function ViewerPage({
  ownerName,
  slots,
  note,
}: {
  ownerName: string;
  slots: Slot[];
  note?: string;
}) {
  const days = groupByDay(slots);

  return (
    <main className="min-h-screen bg-white text-stone-900">
      <div className="mx-auto max-w-md px-6 py-16 sm:py-20">
        <h1 className="text-[15px] font-medium tracking-tight text-stone-400">{ownerName}</h1>
        {note && <p className="mt-3 text-[15px] leading-relaxed text-stone-600">{note}</p>}

        <ul className="mt-8">
          {days.length === 0 && (
            <li className="py-3 text-[15px] text-stone-400">Nothing free just now.</li>
          )}
          {days.map((d) => (
            <li key={d.date}>
              <button
                type="button"
                data-slot-id={d.date}
                data-label={`${weekdayShort(d.date)} ${dayMonth(d.date)} — ${d.label}`}
                className="slot flex w-full items-baseline justify-between gap-4 border-b border-stone-100 py-3.5 text-left"
              >
                <span className="w-24 shrink-0 text-[15px] text-stone-400">
                  {weekdayShort(d.date)} {dayMonth(d.date)}
                </span>
                <span className="flex-1 text-[15px] text-stone-800">{d.label}</span>
                {d.ifNeedBe && (
                  <span className="shrink-0 text-[12px] text-stone-300">if need be</span>
                )}
                <span className="check shrink-0 text-[13px] text-stone-900">✓</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="suggest-bar pointer-events-none fixed inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-stone-200 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur">
          <span className="suggest-count text-[13px] text-stone-500">0 selected</span>
          <button
            type="button"
            className="suggest-send rounded-full bg-stone-900 px-3.5 py-1.5 text-[13px] font-medium text-white transition hover:bg-stone-700"
          >
            Suggest these
          </button>
        </div>
      </div>
    </main>
  );
}
