/**
 * Settings screen — the stuff you set once and forget: connected calendars and
 * your base preferences. Kept off the main /me page so composing links stays
 * uncluttered.
 */

import Link from "next/link";
import { config } from "@/config";
import { GoogleSection } from "../GoogleSection";
import { PreferencesForm } from "../PreferencesForm";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-lg px-6 py-14">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[15px] italic tracking-tight text-stone-400 dark:text-stone-500">
            Settings
          </h1>
          <Link
            href="/me"
            className="text-[13px] text-stone-400 underline-offset-2 hover:underline dark:text-stone-500"
          >
            ← Back
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-10">
          <GoogleSection />

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Preferences
            </h2>
            <PreferencesForm />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
              Event types
            </h2>
            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <p className="mb-3 text-[12px] leading-relaxed text-stone-400 dark:text-stone-500">
                When you compose a link you tick these; the assistant uses the description to pick
                fitting times. (Defined in code for now.)
              </p>
              <ul className="flex flex-col gap-2">
                {config.eventTypes.map((t) => (
                  <li key={t.id} className="text-[14px]">
                    <span className="text-stone-700 dark:text-stone-300">{t.label}</span>
                    <span className="text-stone-400 dark:text-stone-500"> — {t.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
