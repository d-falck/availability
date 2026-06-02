import { NextResponse } from "next/server";
import { exchangeCode, fetchEmail } from "@/lib/google/oauth";
import { upsertAccount } from "@/lib/google/store";

/** Google redirects here after consent; store the account and head back to /me. */
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/me?google=error", req.url));

  try {
    const tokens = await exchangeCode(code);
    const email = await fetchEmail(tokens.access_token);
    upsertAccount({ id: email, email, refreshToken: tokens.refresh_token ?? "" });
    return NextResponse.redirect(new URL("/me?google=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/me?google=error", req.url));
  }
}
