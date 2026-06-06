/**
 * The private page (/me). Compose per-recipient shares and manage existing
 * links. Calendar connections + base preferences live behind the Settings link
 * so you don't have to think about them most of the time.
 */

import Link from "next/link";
import { listShares } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { loadSettings } from "@/lib/settings";
import { shareUpdatedAt } from "@/lib/refine";
import { Composer } from "./Composer";

export const dynamic = "force-dynamic";

export default function MePage() {
  const shares = listShares();
  const schedule = loadSchedule();
  const eventTypes = loadSettings().eventTypes.map((t) => ({ id: t.id, label: t.label }));
  const updatedAt: Record<string, number | null> = {};
  if (schedule) for (const s of shares) updatedAt[s.id] = shareUpdatedAt(s, schedule);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-lg px-6 py-14">
        <div className="flex justify-end">
          <Link
            href="/me/settings"
            className="text-[13px] text-stone-400 underline-offset-2 hover:underline dark:text-stone-500"
          >
            Settings
          </Link>
        </div>
        <Composer eventTypes={eventTypes} initialShares={shares} updatedAt={updatedAt} />
      </div>
    </main>
  );
}
