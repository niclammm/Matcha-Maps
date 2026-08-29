import { NextResponse } from "next/server";
import { deleteCafeBySlug, updateCafeBySlug } from "@/lib/cafe-repo";
import type { CafePatch } from "@/lib/cafe-mapping";

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const patch = (await request.json()) as CafePatch;

  const shop = await updateCafeBySlug(slug, patch);
  if (!shop) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  return NextResponse.json(shop);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const removed = await deleteCafeBySlug(slug);
  if (!removed) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
