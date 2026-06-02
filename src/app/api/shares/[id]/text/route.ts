import { NextResponse } from "next/server";
import { getShare } from "@/lib/shares";
import { loadSnapshot } from "@/lib/snapshot";
import { resolveShare } from "@/lib/refine";
import { toText } from "@/lib/textexport";

/** Plain-text availability for a share, for the "copy as text" action. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const share = getShare(params.id);
  const snapshot = loadSnapshot();
  if (!share || !snapshot) return new NextResponse("Not found", { status: 404 });

  const text = toText(resolveShare(share, snapshot), { note: share.note });
  return new NextResponse(text, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
