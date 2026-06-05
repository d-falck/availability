import { NextResponse } from "next/server";
import { getShare } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { explainShare } from "@/lib/refine";

export const dynamic = "force-dynamic";

/** The brain's reasoning + chosen times for a share, for the "Why?" panel. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const share = getShare(params.id);
  const schedule = loadSchedule();
  if (!share || !schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { reasoning, days } = await explainShare(share, schedule);
    return NextResponse.json({
      reasoning,
      days: days.map((d) => ({ date: d.date, label: d.label, ifNeedBe: d.ifNeedBe })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error)?.message ?? "Couldn't explain this one." },
      { status: 502 },
    );
  }
}
