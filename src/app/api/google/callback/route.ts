import { NextResponse } from "next/server";
import { exchangeCode, fetchEmail } from "@/lib/google/oauth";
import { upsertAccount } from "@/lib/google/store";

/**
 * Google redirects here after consent; store the account and head back to /me.
 * Redirects are built from APP_URL (not req.url, which behind Fly's proxy is the
 * internal 0.0.0.0:3000 bind address).
 */
function backToMe(query: string): string {
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  return `${base}/me${query}`;
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(backToMe("?google=error"));

  try {
    const tokens = await exchangeCode(code);
    const email = await fetchEmail(tokens.access_token);
    upsertAccount({ id: email, email, refreshToken: tokens.refresh_token ?? "" });
    return NextResponse.redirect(backToMe("?google=connected"));
  } catch {
    return NextResponse.redirect(backToMe("?google=error"));
  }
}
