import { NextResponse } from "next/server";
import { createCafe, getAllCafes } from "@/lib/cafe-repo";
import type { NewCafeInput } from "@/lib/types";

export async function GET() {
  const cafes = await getAllCafes();
  return NextResponse.json(cafes);
}

export async function POST(request: Request) {
  const input = (await request.json()) as NewCafeInput;

  if (!input?.name?.trim() || !input?.country?.trim()) {
    return NextResponse.json({ error: "Name and country are required" }, { status: 400 });
  }
  if (!input.location || !Number.isFinite(input.location.lat) || !Number.isFinite(input.location.lng)) {
    return NextResponse.json({ error: "Valid coordinates are required" }, { status: 400 });
  }

  const shop = await createCafe(input);
  return NextResponse.json(shop, { status: 201 });
}
