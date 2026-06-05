import { NextResponse } from "next/server";
import { getShare } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { refreshShare, shareUpdatedAt } from "@/lib/refine";

export const dynamic = "force-dynamic";

/** Force a fresh brain pass for one link. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const share = getShare(params.id);
  const schedule = loadSchedule();
  if (!share || !schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await refreshShare(share, schedule);
    return NextResponse.json({ ok: true, updatedAt: shareUpdatedAt(share, schedule) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message ?? "Failed" }, { status: 502 });
  }
}
