/**
 * The recipient route: /v/[share]. Loads the share, resolves it against the
 * LATEST snapshot (so the link stays up to date), and renders the minimal view.
 * No access to Google or raw calendar — only the sanitized snapshot — so it
 * cannot leak private detail.
 */

import { notFound } from "next/navigation";
import { config } from "@/config";
import { getShare } from "@/lib/shares";
import { loadSnapshot } from "@/lib/snapshot";
import { resolveShare } from "@/lib/refine";
import { ViewerPage } from "@/components/viewer/ViewerPage";
import { CONTROLLER_JS } from "@/components/viewer/controller";

export const dynamic = "force-dynamic"; // always read the freshest snapshot

export default function ShareRoute({ params }: { params: { share: string } }) {
  const share = getShare(params.share);
  const snapshot = loadSnapshot();
  if (!share || !snapshot) notFound();

  const slots = resolveShare(share, snapshot);
  const viewerGlobals = { ownerName: config.owner.name, contactEmail: config.owner.contactEmail };

  return (
    <>
      <ViewerPage ownerName={config.owner.name} slots={slots} note={share.note} />
      <script dangerouslySetInnerHTML={{ __html: `window.__VIEWER__=${JSON.stringify(viewerGlobals)}` }} />
      <script dangerouslySetInnerHTML={{ __html: CONTROLLER_JS }} />
    </>
  );
}
