import { NextResponse } from "next/server";
import { exchangeLoginCode, fetchEmail } from "@/lib/google/oauth";
import { isAllowedEmail } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Google redirects here after sign-in. Allow-listed email → set the session cookie. */
export async function GET(req: Request) {
  const base = (process.env.APP_URL ?? "").replace(/\/$/, "");
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(`${base}/login?error=1`);

  try {
    const tokens = await exchangeLoginCode(code);
    const email = await fetchEmail(tokens.access_token);
    if (!isAllowedEmail(email)) return NextResponse.redirect(`${base}/login?error=denied`);

    const res = NextResponse.redirect(`${base}/me`);
    const pw = process.env.APP_PASSWORD;
    if (pw) {
      res.cookies.set("auth", pw, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 90,
      });
    }
    return res;
  } catch {
    return NextResponse.redirect(`${base}/login?error=1`);
  }
}
