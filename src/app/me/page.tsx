/**
 * The private page (/me). Compose a per-recipient share from event types + a
 * note / custom description, and manage existing ones. No auth in v1 — intended
 * for local / self-hosted use behind your own access (auth is a follow-up).
 */

import { config } from "@/config";
import { listShares } from "@/lib/shares";
import { Composer } from "./Composer";
import { GoogleSection } from "./GoogleSection";

export const dynamic = "force-dynamic";

export default function MePage() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      <div className="mx-auto max-w-lg px-6 py-14">
        <h1 className="text-[15px] italic tracking-tight text-stone-400 dark:text-stone-500">
          {config.owner.name} · availability
        </h1>
        <GoogleSection />
        <Composer
          eventTypes={config.eventTypes.map((t) => ({ id: t.id, label: t.label }))}
          initialShares={listShares()}
        />
      </div>
    </main>
  );
}
