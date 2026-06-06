"use client";

import * as React from "react";
import { useState } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const denied =
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("error") === "denied";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) window.location.href = "/me";
    else setError(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex w-full max-w-xs flex-col gap-4">
        <a
          href="/api/auth/google"
          className="flex items-center justify-center rounded-full border border-stone-300 px-4 py-2.5 text-[14px] text-stone-700 transition hover:border-stone-400 dark:border-stone-700 dark:text-stone-200 dark:hover:border-stone-500"
        >
          Continue with Google
        </a>
        {denied && <p className="text-[13px] text-red-500">That account isn&apos;t allowed.</p>}

        <div className="flex items-center gap-3 text-[12px] text-stone-300 dark:text-stone-600">
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
          or
          <span className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            placeholder="Password"
            className="w-full rounded-xl border border-stone-200 p-3 text-[15px] outline-none focus:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:focus:border-stone-500"
          />
          {error && <p className="text-[13px] text-red-500">Wrong password.</p>}
          <button
            type="submit"
            className="rounded-full bg-stone-900 px-4 py-2 text-[14px] font-medium text-white transition hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            Enter
          </button>
        </form>
      </div>
    </main>
  );
}
