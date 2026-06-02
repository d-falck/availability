"use client";

import * as React from "react";
import { useState } from "react";
import type { Share } from "@/types/share";

type TypeOption = { id: string; label: string };

export function Composer({
  eventTypes,
  initialShares,
}: {
  eventTypes: TypeOption[];
  initialShares: Share[];
}) {
  const [shares, setShares] = useState<Share[]>(initialShares);
  const [recipient, setRecipient] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function create() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/shares", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipient,
        typeIds: [...selected],
        note,
        customDescription,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json()).error ?? "Something went wrong.");
      return;
    }
    const share: Share = await res.json();
    setShares((s) => [share, ...s]);
    setRecipient("");
    setSelected(new Set());
    setNote("");
    setCustomDescription("");
  }

  async function remove(id: string) {
    await fetch(`/api/shares/${id}`, { method: "DELETE" });
    setShares((s) => s.filter((x) => x.id !== id));
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      {/* ── Compose ───────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5">
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="Who's this for? (optional)"
          className="w-full border-b border-stone-200 pb-2 text-[15px] outline-none placeholder:text-stone-300 focus:border-stone-400"
        />

        <div className="flex flex-wrap gap-2">
          {eventTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
                selected.has(t.id)
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="…or describe it ('a long sunday lunch', 'evening drinks somewhere central')"
          rows={2}
          className="w-full resize-none rounded-xl border border-stone-200 p-3 text-[14px] outline-none placeholder:text-stone-300 focus:border-stone-400"
        />

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="A note to show them at the top (optional)"
          className="w-full rounded-xl border border-stone-200 p-3 text-[14px] outline-none placeholder:text-stone-300 focus:border-stone-400"
        />

        {error && <p className="text-[13px] text-red-500">{error}</p>}

        <button
          type="button"
          onClick={create}
          disabled={busy}
          className="self-start rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create link"}
        </button>
      </section>

      {/* ── Existing shares ───────────────────────────────────────── */}
      {shares.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400">Links</h2>
          {shares.map((s) => (
            <ShareRow key={s.id} share={s} eventTypes={eventTypes} onDelete={() => remove(s.id)} />
          ))}
        </section>
      )}
    </div>
  );
}

function ShareRow({
  share,
  eventTypes,
  onDelete,
}: {
  share: Share;
  eventTypes: TypeOption[];
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const flash = (what: string) => {
    setCopied(what);
    setTimeout(() => setCopied(null), 1500);
  };

  const labels = share.typeIds
    .map((id) => eventTypes.find((t) => t.id === id)?.label ?? id)
    .join(", ");
  const summary = [share.recipient, labels || share.customDescription].filter(Boolean).join(" · ");

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/v/${share.id}`);
    flash("link");
  }
  async function copyText() {
    const text = await (await fetch(`/api/shares/${share.id}/text`)).text();
    await navigator.clipboard.writeText(text);
    flash("text");
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[14px] text-stone-700">{summary || "Untitled"}</span>
        <a
          href={`/v/${share.id}`}
          target="_blank"
          className="shrink-0 text-[12px] text-stone-400 underline-offset-2 hover:underline"
        >
          open
        </a>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={copyLink} className="rounded-full border border-stone-200 px-3 py-1 text-[12px] text-stone-600 hover:border-stone-300">
          {copied === "link" ? "Copied!" : "Copy link"}
        </button>
        <button onClick={copyText} className="rounded-full border border-stone-200 px-3 py-1 text-[12px] text-stone-600 hover:border-stone-300">
          {copied === "text" ? "Copied!" : "Copy as text"}
        </button>
        <button onClick={onDelete} className="rounded-full px-3 py-1 text-[12px] text-stone-400 hover:text-red-500">
          Delete
        </button>
      </div>
    </div>
  );
}
