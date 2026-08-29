import { fileToResizedBlob } from "@/lib/cafe-helpers";

/** Resizes an image file client-side, uploads it to Vercel Blob via
 * /api/upload, and returns the hosted URL to store on the cafe/tasted note.
 * Throws on failure -- callers decide how to surface that (skip the file,
 * show a warning, etc). */
export async function uploadPhoto(file: File): Promise<string> {
  const blob = await fileToResizedBlob(file);
  const body = new FormData();
  body.append("file", blob, file.name.replace(/\.[^.]+$/, "") + ".jpg");

  const res = await fetch("/api/upload", { method: "POST", body });
  if (!res.ok) throw new Error("Upload failed");
  const data: { url: string } = await res.json();
  return data.url;
}
