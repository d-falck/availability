/**
 * The private page (/me). Compose per-recipient shares and manage existing
 * links. Calendar connections + base preferences live behind the Settings link
 * so you don't have to think about them most of the time.
 */

import Link from "next/link";
import { config } from "@/config";
import { listShares } from "@/lib/shares";
import { Composer } from "./Composer";

export const dynamic = "force-dynamic";

export default function MePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-lg px-6 py-14">
        <div className="flex items-baseline justify-between">
          <h1 className="text-[15px] italic tracking-tight text-stone-400 dark:text-stone-500">
            {config.owner.name} · availability
          </h1>
          <Link
            href="/me/settings"
            className="text-[13px] text-stone-400 underline-offset-2 hover:underline dark:text-stone-500"
          >
            Settings
          </Link>
        </div>
        <Composer
          eventTypes={config.eventTypes.map((t) => ({ id: t.id, label: t.label }))}
          initialShares={listShares()}
        />
      </div>
    </main>
  );
}
