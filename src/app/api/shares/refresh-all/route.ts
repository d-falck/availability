import { NextResponse } from "next/server";
import { generate } from "@/lib/generate/run";
import { loadSchedule } from "@/lib/schedule";
import { listShares } from "@/lib/shares";
import { refreshShare } from "@/lib/refine";

export const dynamic = "force-dynamic";

/** Rebuild the schedule from the calendar and force a fresh pass for every link. */
export async function POST() {
  try {
    await generate();
    const schedule = loadSchedule();
    if (schedule) for (const s of listShares()) await refreshShare(s, schedule);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error)?.message ?? "Failed" }, { status: 502 });
  }
}
