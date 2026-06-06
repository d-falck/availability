import { NextResponse } from "next/server";
import { createShare, listShares } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { warmShare } from "@/lib/refine";
import type { Share } from "@/types/share";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listShares());
}

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Share>;
  const typeIds = Array.isArray(body.typeIds) ? body.typeIds : [];
  if (!typeIds.length && !body.customDescription?.trim()) {
    return NextResponse.json(
      { error: "Pick at least one event type or write a description." },
      { status: 400 },
    );
  }
  const share = createShare({
    recipient: body.recipient?.trim() || undefined,
    typeIds,
    customDescription: body.customDescription?.trim() || undefined,
    offerFrom: body.offerFrom,
    offerTo: body.offerTo,
    precision: body.precision === "exact" ? "exact" : "rough",
  });

  // Warm the brain cache in the background so creating a link is instant; the
  // recipient page also warms on a cold cache, so nothing is lost if this is cut short.
  const schedule = loadSchedule();
  if (schedule) void warmShare(share, schedule).catch(() => {});

  return NextResponse.json(share, { status: 201 });
}
