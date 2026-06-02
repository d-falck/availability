import { NextResponse } from "next/server";
import { listAccounts, removeAccount } from "@/lib/google/store";
import { generate } from "@/lib/generate/run";

export const dynamic = "force-dynamic";

/** Connected accounts (no secrets). */
export async function GET() {
  return NextResponse.json(
    listAccounts().map((a) => ({ id: a.id, email: a.email, calendarIds: a.calendarIds })),
  );
}

/** Disconnect an account, then regenerate without its calendars. */
export async function DELETE(req: Request) {
  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "Missing accountId" }, { status: 400 });
  removeAccount(accountId);
  await generate();
  return NextResponse.json({ ok: true });
}
