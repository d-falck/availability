import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { loginUrl } from "@/lib/google/oauth";

export const dynamic = "force-dynamic";

/** Start "Sign in with Google" (public — this is how you authenticate). */
export async function GET() {
  return NextResponse.redirect(loginUrl(randomBytes(8).toString("hex")));
}
