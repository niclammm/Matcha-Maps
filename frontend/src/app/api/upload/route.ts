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

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Upload failed: BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json({ error: "Photo storage isn't configured on this deployment yet" }, { status: 500 });
  }

  const pathname = `matcha-maps/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: "image/jpeg",
    });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    // Logged server-side (Vercel function logs) with the real cause --
    // e.g. an invalid/expired token, or a store that's since been deleted --
    // rather than surfacing as an opaque 500 with no way to diagnose it.
    console.error("Vercel Blob upload failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Upload failed: ${message}` }, { status: 502 });
  }
}
