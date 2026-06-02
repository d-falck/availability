/**
 * The social availability view (Mode B). Presentational and server-renderable
 * (no hooks), so the exact same markup powers both the Next route and the
 * standalone HTML preview. Selection/compose interactivity is layered on by the
 * vanilla controller (see controller.ts) against the data-* attributes here.
 */

import * as React from "react";
import type { Config } from "@/config";
import type { Lane, Slot, Snapshot } from "@/types/snapshot";
import { dayMonth, weekdayLong, weekdayShort } from "@/lib/time";

const LANES: Record<
  Lane,
  { title: string; sub: string; dot: string; soft: string }
> = {
  quick: {
    title: "Pop out for a bit",
    sub: "a coffee or a walk",
    dot: "bg-amber-400",
    soft: "border-amber-200/70 bg-amber-50/50",
  },
  evening: {
    title: "Dinner or drinks",
    sub: "a proper evening",
    dot: "bg-indigo-400",
    soft: "border-indigo-200/70 bg-indigo-50/50",
  },
  weekend: {
    title: "Weekend",
    sub: "something longer & unhurried",
    dot: "bg-teal-400",
    soft: "border-teal-200/70 bg-teal-50/50",
  },
};

const LANE_ORDER: Lane[] = ["quick", "evening", "weekend"];

/** Drop a leading weekday word so weekend times read "morning", not "Saturday morning". */
function displayTime(slot: Slot): string {
  return slot.roughTime.replace(weekdayLong(slot.date), "").trim() || slot.roughTime;
}

function messageLabel(slot: Slot): string {
  return `${weekdayShort(slot.date)} ${dayMonth(slot.date)} · ${slot.roughTime}`;
}

function SlotCard({ slot }: { slot: Slot }) {
  return (
    <button
      type="button"
      data-slot-id={slot.id}
      data-label={messageLabel(slot)}
      data-openness={slot.minOpenness}
      className={`slot relative w-full rounded-2xl border ${LANES[slot.lane].soft} px-4 py-3 text-left`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium tracking-wide text-stone-500">
          {weekdayShort(slot.date)} {dayMonth(slot.date)}
        </span>
        {slot.preferred && (
          <span className="text-[11px] font-medium text-stone-400">★ favourite</span>
        )}
      </div>
      <div className="mt-0.5 text-[17px] leading-snug text-stone-800">{displayTime(slot)}</div>
      {slot.note && <div className="mt-1 text-[13px] leading-snug text-stone-400">{slot.note}</div>}
      <span className="check absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-stone-800 text-[13px] text-white shadow">
        ✓
      </span>
    </button>
  );
}

function LaneColumn({ lane, slots }: { lane: Lane; slots: Slot[] }) {
  const meta = LANES[lane];
  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center gap-2 px-1">
        <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
        <h2 className="text-[15px] font-semibold text-stone-700">{meta.title}</h2>
        <span className="text-[13px] text-stone-400">· {meta.sub}</span>
      </header>
      {slots.length ? (
        <div className="flex flex-col gap-2.5">
          {slots.map((s) => (
            <SlotCard key={s.id} slot={s} />
          ))}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-stone-200 px-4 py-6 text-center text-[13px] text-stone-400">
          nothing this time
        </p>
      )}
    </section>
  );
}

export function ViewerPage({
  snapshot,
  config,
}: {
  snapshot: Snapshot;
  config: Config;
}) {
  const keptValues = snapshot.weeks.map((w) => w.eveningsKeptFree);
  const keptMin = keptValues.length ? Math.min(...keptValues) : 0;
  const totalWeeks = snapshot.weeks.length;

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-4xl px-5 pb-32 pt-12 sm:px-8 sm:pt-16">
        <header className="max-w-xl">
          <p className="text-[13px] font-medium uppercase tracking-[0.14em] text-stone-400">
            {config.owner.name}&apos;s availability
          </p>
          <h1 className="mt-2 text-[26px] font-semibold leading-tight text-stone-900 sm:text-[30px]">
            {config.viewer.tagline}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-stone-500">
            Nothing&apos;s booked here — these are just the shapes of times that tend to work,
            over the next {totalWeeks > 1 ? `${totalWeeks} weeks` : "couple of weeks"}. Tap the
            ones you like and send them over, and we&apos;ll pin one down.
          </p>
          {keptMin > 0 && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1.5 text-[13px] text-stone-500">
              <span aria-hidden>🌙</span>
              {keptMin} {keptMin === 1 ? "evening" : "evenings"} a week kept clear for deep work
            </p>
          )}
        </header>

        <div className="mt-10 grid gap-7 sm:mt-12 sm:grid-cols-3">
          {LANE_ORDER.map((lane) => (
            <LaneColumn
              key={lane}
              lane={lane}
              slots={snapshot.slots.filter((s) => s.lane === lane)}
            />
          ))}
        </div>
      </div>

      {/* Selection bar — slides up once something is picked (controller-driven). */}
      <div className="suggest-bar pointer-events-none fixed inset-x-0 bottom-0 flex justify-center p-4">
        <div className="pointer-events-auto flex items-center gap-4 rounded-full border border-stone-200 bg-white/95 px-5 py-3 shadow-xl backdrop-blur">
          <span className="suggest-count text-[14px] text-stone-500">0 picked</span>
          <button
            type="button"
            className="suggest-send rounded-full bg-stone-900 px-4 py-1.5 text-[14px] font-medium text-white transition hover:bg-stone-700"
          >
            Suggest these →
          </button>
        </div>
      </div>
    </main>
  );
}
