/**
 * The recipient route: /[share] (e.g. cal.damonfalck.me/abc123). Resolves the
 * share against the latest schedule (cache-first; brain on a cold cache) and
 * renders the minimal view. Only sanitized slots reach the browser — never the
 * schedule's event details. Top-level static routes (/me, /login, /api) take
 * precedence over this dynamic segment.
 */

import { notFound } from "next/navigation";
import { getShare } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { resolveShare } from "@/lib/refine";
import { ViewerPage } from "@/components/viewer/ViewerPage";
import { CONTROLLER_JS } from "@/components/viewer/controller";

export const dynamic = "force-dynamic";

export default async function ShareRoute({ params }: { params: { share: string } }) {
  const share = getShare(params.share);
  const schedule = loadSchedule();
  if (!share || !schedule) notFound();

  const slots = await resolveShare(share, schedule);

  return (
    <>
      <ViewerPage slots={slots} exact={share.precision === "exact"} />
      <script dangerouslySetInnerHTML={{ __html: CONTROLLER_JS }} />
    </>
  );
}
