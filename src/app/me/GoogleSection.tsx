"use client";

import * as React from "react";
import { useEffect, useState } from "react";

type Account = { id: string; email: string; calendarIds: string[] };
type Calendar = { id: string; summary: string; primary: boolean };

const pill =
  "rounded-full border px-3 py-1 text-[12px] transition border-stone-200 text-stone-600 hover:border-stone-300 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-500";

export function GoogleSection() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/google/accounts")
      .then((r) => r.json())
      .then(setAccounts)
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section className="mt-8 flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
        Calendars
      </h2>

      {loaded && accounts.length === 0 && (
        <p className="text-[14px] text-stone-500 dark:text-stone-400">
          No calendars connected yet — availability is using sample data.
        </p>
      )}

      {accounts.map((a) => (
        <AccountCard key={a.id} account={a} onDisconnect={() => setAccounts((s) => s.filter((x) => x.id !== a.id))} />
      ))}

      <a
        href="/api/google/auth"
        className="self-start rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        Connect a Google account
      </a>
    </section>
  );
}

function AccountCard({ account, onDisconnect }: { account: Account; onDisconnect: () => void }) {
  const [calendars, setCalendars] = useState<Calendar[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(account.calendarIds));
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/google/calendars?accountId=${encodeURIComponent(account.id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.calendars) {
          setCalendars(d.calendars);
          setSelected(new Set(d.selected ?? []));
        } else setStatus(d.error ?? "Couldn't load calendars.");
      });
  }, [account.id]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function save() {
    setStatus("Saving…");
    await fetch("/api/google/calendars", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ accountId: account.id, calendarIds: [...selected] }),
    });
    setStatus("Saved & refreshed");
    setTimeout(() => setStatus(null), 1800);
  }

  async function disconnect() {
    await fetch(`/api/google/accounts?accountId=${encodeURIComponent(account.id)}`, {
      method: "DELETE",
    });
    onDisconnect();
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[15px] text-stone-700 dark:text-stone-300">{account.email}</span>
        <button onClick={disconnect} className="shrink-0 text-[12px] text-stone-400 hover:text-red-500 dark:text-stone-500">
          disconnect
        </button>
      </div>

      {calendars === null && !status && (
        <p className="text-[13px] text-stone-400">Loading calendars…</p>
      )}

      {calendars && (
        <div className="flex flex-col gap-2">
          {calendars.map((c) => (
            <label key={c.id} className="flex items-center gap-2 text-[14px] text-stone-700 dark:text-stone-300">
              <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} />
              <span className="truncate">{c.summary}</span>
            </label>
          ))}
          <div className="mt-1 flex items-center gap-3">
            <button onClick={save} className={pill}>
              Save
            </button>
            {status && <span className="text-[12px] text-stone-400">{status}</span>}
          </div>
        </div>
      )}

      {!calendars && status && <p className="text-[13px] text-red-500">{status}</p>}
    </div>
  );
}
