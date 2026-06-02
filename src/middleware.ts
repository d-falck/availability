/**
 * Password gate for the private side. If APP_PASSWORD is unset (local dev),
 * everything is open; in production it protects /me and the admin/Google APIs.
 * Recipient pages (/v/*) and the Google OAuth callback stay public.
 */

import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/api/google/callback") return NextResponse.next();
  if (req.cookies.get("auth")?.value === password) return NextResponse.next();

  if (pathname.startsWith("/api")) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/me", "/api/google/:path*", "/api/shares/:path*"],
};
