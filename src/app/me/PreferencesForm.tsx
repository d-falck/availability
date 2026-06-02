"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
const inputCls =
  "rounded-lg border border-stone-200 p-2 text-[14px] outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-500";

export function PreferencesForm() {
  const [s, setS] = useState<Settings | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setS);
  }, []);

  if (!s) return <p className="text-[13px] text-stone-400">Loading preferences…</p>;

  const set = (patch: Partial<Settings>) => setS({ ...s, ...patch });
  const toggleNight = (d: string) =>
    set({
      pinnedReservedNights: s.pinnedReservedNights.includes(d as Settings["pinnedReservedNights"][number])
        ? s.pinnedReservedNights.filter((x) => x !== d)
        : [...s.pinnedReservedNights, d as Settings["pinnedReservedNights"][number]],
    });

  async function save() {
    setStatus("Saving…");
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(s),
    });
    setStatus("Saved & refreshed");
    setTimeout(() => setStatus(null), 2000);
  }

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <Field label="Evenings to keep free each week" hint="Never expose more than (free evenings − this) per week.">
        <input
          type="number"
          min={0}
          max={7}
          value={s.minFreeEveningsPerWeek}
          onChange={(e) => set({ minFreeEveningsPerWeek: Number(e.target.value) })}
          className={`${inputCls} w-20`}
        />
      </Field>

      <Field label="Always-reserved nights" hint="These weeknights are never offered.">
        <div className="flex flex-wrap gap-1.5">
          {DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleNight(d)}
              className={`rounded-full border px-2.5 py-1 text-[12px] transition ${
                s.pinnedReservedNights.includes(d)
                  ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-200 text-stone-500 hover:border-stone-300 dark:border-stone-700 dark:text-stone-400"
              }`}
            >
              {d[0] + d.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Daytime hours" hint="The window for coffee / walk / lunch.">
        <TimePair
          start={s.dayWindow.start}
          end={s.dayWindow.end}
          onChange={(start, end) => set({ dayWindow: { start, end } })}
        />
      </Field>

      <Field label="Evening hours" hint="The window for dinner / drinks.">
        <TimePair
          start={s.eveningWindow.start}
          end={s.eveningWindow.end}
          onChange={(start, end) => set({ eveningWindow: { start, end } })}
        />
      </Field>

      <Field label="All-day events" hint="How a day with an all-day event is treated.">
        <select
          value={s.allDayHandling}
          onChange={(e) => set({ allDayHandling: e.target.value as Settings["allDayHandling"] })}
          className={inputCls}
        >
          <option value="busy">Block the day as busy</option>
          <option value="ignore">Ignore — still offer times</option>
        </select>
      </Field>

      <Field label="Preferences for the assistant" hint="Plain-English steering for the LLM refine step (used once enabled).">
        <textarea
          value={s.guidance}
          onChange={(e) => set({ guidance: e.target.value })}
          rows={4}
          placeholder="e.g. Prefer weekends for longer meet-ups. Keep Friday evenings light. Don't suggest coffee on heavy meeting days."
          className={`${inputCls} w-full resize-none`}
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="self-start rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          Save preferences
        </button>
        {status && <span className="text-[13px] text-stone-400">{status}</span>}
      </div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <div className="text-[14px] text-stone-700 dark:text-stone-300">{label}</div>
        {hint && <div className="text-[12px] text-stone-400 dark:text-stone-500">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function TimePair({
  start,
  end,
  onChange,
}: {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-[14px] text-stone-500">
      <input type="time" value={start} onChange={(e) => onChange(e.target.value, end)} className={inputCls} />
      <span>to</span>
      <input type="time" value={end} onChange={(e) => onChange(start, e.target.value)} className={inputCls} />
    </div>
  );
}
