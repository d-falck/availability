import { NextResponse } from "next/server";
import { getShare } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { shareUpdatedAt } from "@/lib/refine";

export const dynamic = "force-dynamic";

/** Lightweight: when was this share's result last generated (or null if pending)? */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const share = getShare(params.id);
  const schedule = loadSchedule();
  if (!share || !schedule) return NextResponse.json({ updatedAt: null });
  return NextResponse.json({ updatedAt: shareUpdatedAt(share, schedule) });
}
