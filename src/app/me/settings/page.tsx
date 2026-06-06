/**
 * Settings screen — set once and forget: connected calendars, base preferences
 * (availability hours + guidance), and editable event types.
 */

import Link from "next/link";
import { GoogleSection } from "../GoogleSection";
import { PreferencesForm } from "../PreferencesForm";
import { EventTypesEditor } from "../EventTypesEditor";

export const dynamic = "force-dynamic";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-lg px-6 py-14">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[15px] italic tracking-tight text-stone-400 dark:text-stone-500">Settings</h1>
          <Link href="/me" className="text-[13px] text-stone-400 underline-offset-2 hover:underline dark:text-stone-500">
            ← Back
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-10">
          <GoogleSection />
          <Section title="Preferences">
            <PreferencesForm />
          </Section>
          <Section title="Event types">
            <EventTypesEditor />
          </Section>
        </div>
      </div>
    </main>
  );
}
