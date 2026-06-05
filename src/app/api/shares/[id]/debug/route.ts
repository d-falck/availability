import { NextResponse } from "next/server";
import { getShare } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { debugShare } from "@/lib/refine";

export const dynamic = "force-dynamic";

/** Why is this share's page (e.g. Mia's) empty? Shows schedule + brain output. */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const share = getShare(params.id);
  const schedule = loadSchedule();
  if (!share) return NextResponse.json({ error: "Unknown share id" }, { status: 404 });
  if (!schedule) return NextResponse.json({ error: "No schedule yet — has generation run?" }, { status: 404 });

  try {
    return NextResponse.json(await debugShare(share, schedule));
  } catch (e) {
    return NextResponse.json(
      { error: "Brain call failed", detail: (e as Error)?.message ?? String(e) },
      { status: 502 },
    );
  }
}
