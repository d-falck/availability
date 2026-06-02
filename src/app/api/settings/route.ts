import { NextResponse } from "next/server";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import { generate } from "@/lib/generate/run";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadSettings());
}

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  const current = loadSettings();
  const next: Settings = { ...current, ...body };
  // Light sanity clamps.
  next.minFreeEveningsPerWeek = Math.max(0, Math.min(7, Number(next.minFreeEveningsPerWeek) || 0));
  if (next.allDayHandling !== "ignore") next.allDayHandling = "busy";
  saveSettings(next);
  await generate(); // reflect new preferences immediately
  return NextResponse.json(next);
}
