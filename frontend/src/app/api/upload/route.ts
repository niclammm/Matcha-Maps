import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

const MAX_UPLOAD_BYTES = 8_000_000;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images can be uploaded" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Image is too large" }, { status: 413 });
  }

  const pathname = `matcha-maps/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const blob = await put(pathname, file, {
    access: "public",
    contentType: "image/jpeg",
  });

  return NextResponse.json({ url: blob.url });
}
