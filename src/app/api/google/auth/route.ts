import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { authUrl } from "@/lib/google/oauth";

export const dynamic = "force-dynamic";

/** Kick off the Google consent flow. */
export async function GET() {
  return NextResponse.redirect(authUrl(randomBytes(8).toString("hex")));
}
