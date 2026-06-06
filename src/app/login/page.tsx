"use client";

import * as React from "react";

export default function LoginPage() {
  const denied =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("error") === "denied";

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="flex w-full max-w-xs flex-col gap-3">
        <a
          href="/api/auth/google"
          className="flex items-center justify-center rounded-full border border-stone-300 px-4 py-2.5 text-[14px] text-stone-700 transition hover:border-stone-400 dark:border-stone-700 dark:text-stone-200 dark:hover:border-stone-500"
        >
          Continue with Google
        </a>
        {denied && (
          <p className="text-center text-[13px] text-red-500">That account isn&apos;t allowed.</p>
        )}
      </div>
    </main>
  );
}
