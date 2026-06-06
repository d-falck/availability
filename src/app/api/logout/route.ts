import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Clear the session cookie and return to the sign-in page. */
export async function GET(req: Request) {
  const base = (process.env.APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const res = NextResponse.redirect(`${base}/login`);
  res.cookies.set("auth", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return res;
}
