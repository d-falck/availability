"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import type { EventType } from "@/config";

const inputCls =
  "w-full rounded-lg border border-stone-200 p-2 text-[14px] outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-500";

export function EventTypesEditor() {
  const [types, setTypes] = useState<EventType[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setTypes(d.eventTypes));
  }, []);

  if (!types) return <p className="text-[13px] text-stone-400">Loading…</p>;

  const update = (i: number, patch: Partial<EventType>) =>
    setTypes(types.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  const remove = (i: number) => setTypes(types.filter((_, j) => j !== i));
  const add = () => setTypes([...types, { id: "", label: "", description: "" }]);

  async function save() {
    setStatus("Saving…");
    const cleaned = types!.filter((t) => t.label.trim());
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventTypes: cleaned }),
    });
    if (res.ok) setTypes((await res.json()).eventTypes);
    setStatus("Saved & refreshed");
    setTimeout(() => setStatus(null), 2000);
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-[12px] leading-relaxed text-stone-400 dark:text-stone-500">
        The presets you tick when composing a link. The description is the little prompt the
        assistant uses to pick fitting times.
      </p>

      {types.map((t, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-xl border border-stone-100 p-3 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <input
              value={t.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Label (e.g. Coffee or walk)"
              className={inputCls}
            />
            <button
              onClick={() => remove(i)}
              className="shrink-0 text-[12px] text-stone-400 hover:text-red-500 dark:text-stone-500"
            >
              remove
            </button>
          </div>
          <textarea
            value={t.description}
            onChange={(e) => update(i, { description: e.target.value })}
            placeholder="Description for the assistant (e.g. a short daytime coffee, ~30–60 min)"
            rows={2}
            className={`${inputCls} resize-none`}
          />
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button onClick={add} className="text-[13px] text-stone-500 underline-offset-2 hover:underline dark:text-stone-400">
          + Add type
        </button>
        <button
          onClick={save}
          className="rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          Save types
        </button>
        {status && <span className="text-[13px] text-stone-400">{status}</span>}
      </div>
    </section>
  );
}
