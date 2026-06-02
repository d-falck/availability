/**
 * The public viewer route: /v/[token]. The token selects the priority tier; the
 * page reads the pre-generated snapshot, filters to what that tier may see, and
 * renders. This half has NO access to Google or the LLM — only the sanitized
 * snapshot — so it cannot leak private calendar data.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { notFound } from "next/navigation";
import { config } from "@/config";
import { tierForToken } from "@/lib/links";
import { ViewerPage } from "@/components/viewer/ViewerPage";
import { CONTROLLER_JS } from "@/components/viewer/controller";
import type { Snapshot } from "@/types/snapshot";

export const dynamic = "force-dynamic"; // always read the freshest snapshot

function loadSnapshot(): Snapshot | null {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), "data", "snapshot.json"), "utf8"));
  } catch {
    return null;
  }
}

export default function ViewerRoute({ params }: { params: { token: string } }) {
  const tier = tierForToken(params.token);
  if (tier === null) notFound();

  const snapshot = loadSnapshot();
  if (!snapshot) notFound();

  const view: Snapshot = {
    ...snapshot,
    slots: snapshot.slots.filter((s) => s.minOpenness <= tier),
  };

  const viewerGlobals = {
    ownerName: config.owner.name,
    contactEmail: config.owner.contactEmail,
  };

  return (
    <>
      <ViewerPage snapshot={view} config={config} />
      <script dangerouslySetInnerHTML={{ __html: `window.__VIEWER__=${JSON.stringify(viewerGlobals)}` }} />
      <script dangerouslySetInnerHTML={{ __html: CONTROLLER_JS }} />
    </>
  );
}
