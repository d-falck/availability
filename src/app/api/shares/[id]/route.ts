import { NextResponse } from "next/server";
import { deleteShare, getShare } from "@/lib/shares";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!getShare(params.id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  deleteShare(params.id);
  return NextResponse.json({ ok: true });
}
