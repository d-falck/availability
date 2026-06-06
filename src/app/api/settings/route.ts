import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { loadSettings, saveSettings, type Settings } from "@/lib/settings";
import type { EventType } from "@/config";
import { generate } from "@/lib/generate/run";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(loadSettings());
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || randomBytes(3).toString("hex");

export async function PUT(req: Request) {
  const body = (await req.json()) as Partial<Settings>;
  const next: Settings = { ...loadSettings(), ...body };

  if (Array.isArray(body.eventTypes)) {
    next.eventTypes = body.eventTypes
      .filter((t): t is EventType => !!t && typeof t.label === "string" && t.label.trim().length > 0)
      .map((t) => ({ id: t.id?.trim() || slug(t.label), label: t.label.trim(), description: (t.description ?? "").trim() }));
  }

  saveSettings(next);
  await generate(); // reflect new preferences/hours/types immediately
  return NextResponse.json(next);
}
