"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import type { Settings } from "@/lib/settings";

const inputCls =
  "rounded-lg border border-stone-200 p-2 text-[14px] outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-500";

export function PreferencesForm() {
  const [s, setS] = useState<Pick<Settings, "availableFrom" | "availableTo" | "guidance"> | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setS({ availableFrom: d.availableFrom, availableTo: d.availableTo, guidance: d.guidance }));
  }, []);

  if (!s) return <p className="text-[13px] text-stone-400">Loading preferences…</p>;

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
      <div className="flex flex-col gap-2">
        <div className="text-[14px] text-stone-700 dark:text-stone-300">Available hours</div>
        <div className="text-[12px] text-stone-400 dark:text-stone-500">
          The earliest and latest the assistant will ever propose a meet-up.
        </div>
        <div className="flex items-center gap-2 text-[14px] text-stone-500">
          <input type="time" value={s.availableFrom} onChange={(e) => setS({ ...s, availableFrom: e.target.value })} className={inputCls} />
          <span>to</span>
          <input type="time" value={s.availableTo} onChange={(e) => setS({ ...s, availableTo: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="text-[14px] text-stone-700 dark:text-stone-300">Guidance for the assistant</div>
        <div className="text-[12px] text-stone-400 dark:text-stone-500">
          Plain-English preferences — reserved evenings, weekends, energy, how to read all-day holds, anything.
        </div>
        <textarea
          value={s.guidance}
          onChange={(e) => setS({ ...s, guidance: e.target.value })}
          rows={7}
          className={`${inputCls} w-full resize-none leading-relaxed`}
        />
      </div>

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
