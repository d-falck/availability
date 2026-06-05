import { NextResponse } from "next/server";
import { deleteShare, getShare, updateShare } from "@/lib/shares";
import { loadSchedule } from "@/lib/schedule";
import { warmShare } from "@/lib/refine";
import type { Share } from "@/types/share";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json()) as Partial<Share>;
  const updated = updateShare(params.id, {
    recipient: body.recipient?.trim() || undefined,
    typeIds: Array.isArray(body.typeIds) ? body.typeIds : [],
    note: body.note?.trim() || undefined,
    customDescription: body.customDescription?.trim() || undefined,
  });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedule = loadSchedule();
  if (schedule) void warmShare(updated, schedule).catch(() => {});

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!getShare(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  deleteShare(params.id);
  return NextResponse.json({ ok: true });
}
