"use client";

import * as React from "react";
import { useState } from "react";
import type { Share } from "@/types/share";
import { dayMonth, weekdayShort } from "@/lib/time";

type Explanation = { reasoning: string; days: { date: string; label: string; ifNeedBe: boolean }[] };

type TypeOption = { id: string; label: string };

const inputCls =
  "w-full rounded-xl border border-stone-200 p-3 text-[15px] outline-none placeholder:text-stone-300 focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-600 dark:focus:border-stone-500";
const pill = "rounded-full border px-3 py-1 text-[12px] transition";

interface Draft {
  recipient: string;
  typeIds: Set<string>;
  customDescription: string;
}

const emptyDraft = (): Draft => ({ recipient: "", typeIds: new Set(), customDescription: "" });

const draftFromShare = (s: Share): Draft => ({
  recipient: s.recipient ?? "",
  typeIds: new Set(s.typeIds),
  customDescription: s.customDescription ?? "",
});

/** Shared create/edit form. */
function ShareForm({
  eventTypes,
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  eventTypes: TypeOption[];
  initial?: Share;
  submitLabel: string;
  onSubmit: (payload: Omit<Share, "id" | "createdAt">) => Promise<string | null>;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial ? draftFromShare(initial) : emptyDraft());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (id: string) =>
    setDraft((d) => {
      const typeIds = new Set(d.typeIds);
      typeIds.has(id) ? typeIds.delete(id) : typeIds.add(id);
      return { ...d, typeIds };
    });

  async function submit() {
    setBusy(true);
    setError(null);
    const err = await onSubmit({
      recipient: draft.recipient.trim() || undefined,
      typeIds: [...draft.typeIds],
      customDescription: draft.customDescription.trim() || undefined,
    });
    setBusy(false);
    if (err) setError(err);
    else if (!initial) setDraft(emptyDraft());
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        value={draft.recipient}
        onChange={(e) => setDraft({ ...draft, recipient: e.target.value })}
        placeholder="Who's this for? (optional)"
        className="w-full border-b border-stone-200 bg-transparent pb-2 text-[16px] outline-none placeholder:text-stone-300 focus:border-stone-400 dark:border-stone-700 dark:placeholder:text-stone-600 dark:focus:border-stone-500"
      />

      <div>
        <div className="flex flex-wrap gap-2">
          {eventTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              className={`${pill} text-[13px] ${
                draft.typeIds.has(t.id)
                  ? "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                  : "border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-stone-400 dark:text-stone-500">
          The assistant shows times that suit any type you pick, reasoning over your calendar. Pick
          several to widen it, or describe it below.
        </p>
      </div>

      <textarea
        value={draft.customDescription}
        onChange={(e) => setDraft({ ...draft, customDescription: e.target.value })}
        placeholder="…or describe it ('a long sunday lunch', 'evening drinks somewhere central')"
        rows={2}
        className={`${inputCls} resize-none`}
      />

      {error && <p className="text-[13px] text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 disabled:opacity-50 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-stone-400 hover:text-stone-600 dark:text-stone-500"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export function Composer({
  eventTypes,
  initialShares,
  updatedAt,
}: {
  eventTypes: TypeOption[];
  initialShares: Share[];
  updatedAt: Record<string, number | null>;
}) {
  const [shares, setShares] = useState<Share[]>(initialShares);
  const [refreshingAll, setRefreshingAll] = useState(false);

  async function create(payload: Omit<Share, "id" | "createdAt">): Promise<string | null> {
    const res = await fetch("/api/shares", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return (await res.json()).error ?? "Something went wrong.";
    const created: Share = await res.json();
    setShares((s) => [created, ...s]);
    return null;
  }

  async function refreshAll() {
    setRefreshingAll(true);
    try {
      await fetch("/api/shares/refresh-all", { method: "POST" });
      window.location.reload();
    } finally {
      setRefreshingAll(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <ShareForm eventTypes={eventTypes} submitLabel="Create link" onSubmit={create} />
      </section>

      {shares.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Links
            </h2>
            <button
              onClick={refreshAll}
              disabled={refreshingAll}
              className="text-[12px] text-stone-400 underline-offset-2 hover:underline disabled:opacity-50 dark:text-stone-500"
            >
              {refreshingAll ? "Updating…" : "Update all"}
            </button>
          </div>
          {shares.map((s) => (
            <ShareRow
              key={s.id}
              share={s}
              eventTypes={eventTypes}
              initialUpdatedAt={updatedAt[s.id] ?? null}
              onChange={(updated) => setShares((all) => all.map((x) => (x.id === s.id ? updated : x)))}
              onDelete={() => setShares((all) => all.filter((x) => x.id !== s.id))}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function timeAgo(ms: number | null): string {
  if (!ms) return "not yet generated";
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "updated just now";
  if (mins < 60) return `updated ${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `updated ${hrs}h ago`;
  return `updated ${Math.round(hrs / 24)}d ago`;
}

function ShareRow({
  share,
  eventTypes,
  initialUpdatedAt,
  onChange,
  onDelete,
}: {
  share: Share;
  eventTypes: TypeOption[];
  initialUpdatedAt: number | null;
  onChange: (s: Share) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [textValue, setTextValue] = useState("");
  const [updatedAt, setUpdatedAt] = useState<number | null>(initialUpdatedAt);
  const [refreshing, setRefreshing] = useState(false);
  const flash = (what: string) => {
    setCopied(what);
    setTimeout(() => setCopied(null), 1600);
  };

  // Pre-fetch the text version so "Copy as text" can write to the clipboard
  // synchronously on click (an async fetch first loses the user-activation
  // the clipboard API requires, so the copy would silently fail).
  React.useEffect(() => {
    let alive = true;
    fetch(`/api/shares/${share.id}/text`)
      .then((r) => r.text())
      .then((t) => alive && setTextValue(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [share.id, share.typeIds, share.customDescription, share.note]);

  const labels = share.typeIds
    .map((id) => eventTypes.find((t) => t.id === id)?.label ?? id)
    .join(", ");
  const summary = [share.recipient, labels || share.customDescription].filter(Boolean).join(" · ");

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/v/${share.id}`);
    flash("link");
  }
  async function copyText() {
    const text = textValue || (await (await fetch(`/api/shares/${share.id}/text`)).text());
    await navigator.clipboard.writeText(text);
    flash("text");
  }
  async function remove() {
    await fetch(`/api/shares/${share.id}`, { method: "DELETE" });
    onDelete();
  }
  async function save(payload: Omit<Share, "id" | "createdAt">): Promise<string | null> {
    const res = await fetch(`/api/shares/${share.id}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return (await res.json()).error ?? "Couldn't save.";
    onChange(await res.json());
    setEditing(false);
    return null;
  }
  async function refresh() {
    setRefreshing(true);
    try {
      const r = await fetch(`/api/shares/${share.id}/refresh`, { method: "POST" });
      if (r.ok) {
        setUpdatedAt((await r.json()).updatedAt ?? Date.now());
        setWhy(null); // so "Why?" reloads with the fresh reasoning
      }
    } finally {
      setRefreshing(false);
    }
  }

  const [why, setWhy] = useState<Explanation | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const [whyLoading, setWhyLoading] = useState(false);

  async function toggleWhy() {
    if (whyOpen) return setWhyOpen(false);
    setWhyOpen(true);
    if (!why) {
      setWhyLoading(true);
      try {
        const r = await fetch(`/api/shares/${share.id}/explain`);
        setWhy(r.ok ? await r.json() : { reasoning: "Couldn't load.", days: [] });
      } finally {
        setWhyLoading(false);
      }
    }
  }

  const btn = `${pill} border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500`;
  const copiedBtn = `${pill} border-emerald-500 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400`;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      {editing ? (
        <ShareForm
          eventTypes={eventTypes}
          initial={share}
          submitLabel="Save changes"
          onSubmit={save}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[15px] text-stone-700 dark:text-stone-300">
              {summary || "Untitled"}
            </span>
            <a
              href={`/v/${share.id}`}
              target="_blank"
              className="shrink-0 text-[12px] text-stone-400 underline-offset-2 hover:underline dark:text-stone-500"
            >
              open
            </a>
          </div>
          <p className="text-[12px] text-stone-400 dark:text-stone-500">
            {refreshing ? "updating…" : timeAgo(updatedAt)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyLink} className={copied === "link" ? copiedBtn : btn}>
              {copied === "link" ? "✓ Link copied" : "Copy link"}
            </button>
            <button onClick={copyText} className={copied === "text" ? copiedBtn : btn}>
              {copied === "text" ? "✓ Text copied" : "Copy as text"}
            </button>
            <button onClick={refresh} disabled={refreshing} className={`${btn} disabled:opacity-50`}>
              Update
            </button>
            <button onClick={() => setEditing(true)} className={btn}>
              Edit
            </button>
            <button onClick={toggleWhy} className={btn}>
              {whyOpen ? "Hide why" : "Why?"}
            </button>
            <button
              onClick={remove}
              className={`${pill} border-transparent text-stone-400 hover:text-red-500 dark:text-stone-500`}
            >
              Delete
            </button>
          </div>

          {whyOpen && (
            <div className="mt-1 rounded-xl border border-stone-100 bg-stone-50 p-3 text-[13px] dark:border-stone-800 dark:bg-stone-950/40">
              {whyLoading && <p className="text-stone-400">Asking the assistant…</p>}
              {why && !whyLoading && (
                <>
                  {why.reasoning && (
                    <p className="leading-relaxed text-stone-600 dark:text-stone-300">{why.reasoning}</p>
                  )}
                  <ul className="mt-2 flex flex-col gap-0.5 text-stone-500 dark:text-stone-400">
                    {why.days.map((d) => (
                      <li key={d.date}>
                        {weekdayShort(d.date)} {dayMonth(d.date)} — {d.label}
                        {d.ifNeedBe && <span className="italic text-stone-400"> (if need be)</span>}
                      </li>
                    ))}
                    {why.days.length === 0 && <li className="italic">No times chosen.</li>}
                  </ul>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
