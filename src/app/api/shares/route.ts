import { NextResponse } from "next/server";
import { createShare, listShares } from "@/lib/shares";
import { loadSnapshot } from "@/lib/snapshot";
import { loadSettings } from "@/lib/settings";
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
    typeNotes: body.typeNotes,
    note: body.note?.trim() || undefined,
    customDescription: body.customDescription?.trim() || undefined,
  });

  const snapshot = loadSnapshot();
  if (snapshot) await warmShare(share, snapshot, loadSettings().guidance).catch(() => {});

  return NextResponse.json(share, { status: 201 });
}
