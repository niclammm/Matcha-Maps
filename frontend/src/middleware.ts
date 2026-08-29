import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isValidAuthCookie } from "@/lib/auth-cookie";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/login).*)"],
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();

  const sharedPassword = process.env.SHARED_PASSWORD;
  // No password configured (e.g. local dev before setup) -- don't lock
  // anyone out of a site that has no gate to unlock.
  if (!sharedPassword) return NextResponse.next();

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (await isValidAuthCookie(cookie, sharedPassword)) return NextResponse.next();

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
