import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, makeAuthCookieValue } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const sharedPassword = process.env.SHARED_PASSWORD;

  if (!sharedPassword || !password || password !== sharedPassword) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, await makeAuthCookieValue(sharedPassword), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return res;
}
