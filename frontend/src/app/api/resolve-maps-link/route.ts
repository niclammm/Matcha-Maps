import { NextRequest, NextResponse } from "next/server";
import { isShortGoogleMapsLink } from "@/lib/cafe-helpers";

/** Resolves a Google Maps short link server-side and hands back its
 * redirect target. Browsers can't do this themselves -- reading the
 * `Location` of a cross-origin redirect is blocked by CORS -- but a server
 * fetch isn't subject to that, so this is a thin, single-purpose proxy.
 * Restricted to Google's own short-link hosts so it can't be used as an
 * open redirect-resolver for arbitrary URLs. */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  if (!isShortGoogleMapsLink(url)) {
    return NextResponse.json({ error: "Unsupported host" }, { status: 400 });
  }

  try {
    const res = await fetch(url, { redirect: "manual" });
    const location = res.headers.get("location");
    if (!location) {
      return NextResponse.json({ error: "Link did not redirect" }, { status: 502 });
    }
    return NextResponse.json({ resolvedUrl: location });
  } catch {
    return NextResponse.json({ error: "Failed to resolve link" }, { status: 502 });
  }
}
