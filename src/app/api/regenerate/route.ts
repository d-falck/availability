import { NextResponse } from "next/server";
import { generate } from "@/lib/generate/run";

/**
 * Manually trigger a Stage 1 regeneration. Useful for a cron ping or, later, a
 * Google push webhook. Protected by REGEN_SECRET if that env var is set.
 */
export async function POST(req: Request) {
  const secret = process.env.REGEN_SECRET;
  if (secret && new URL(req.url).searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { snapshot, source } = await generate();
  return NextResponse.json({ ok: true, source, windows: snapshot.slots.length });
}
