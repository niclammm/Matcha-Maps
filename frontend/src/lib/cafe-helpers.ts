import type { Shop } from "@/lib/types";

/** New cafes derive their displayed review count from actual review entries;
 * seed cafes keep their hand-authored aggregate count untouched. */
export function reviewCountOf(shop: Shop): number {
  return shop.reviews && shop.reviews.length > 0 ? shop.reviews.length : shop.reviewCount;
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "cafe";
}

/** Appends -2, -3, ... until the slug doesn't collide with `taken`. */
export function uniqueSlug(name: string, taken: Iterable<string>, skip?: string): string {
  const takenSet = new Set(taken);
  if (skip) takenSet.delete(skip);
  const base = slugify(name);
  if (!takenSet.has(base)) return base;
  let n = 2;
  while (takenSet.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

/** Pulls lat/lng out of a pasted Google Maps URL if it contains the
 * `@lat,lng,zoom` pattern Google embeds in share links. Returns null
 * (not a throw) so callers can fall back to manual entry. */
export function parseLatLngFromGoogleMapsUrl(url: string): { lat: number; lng: number } | null {
  const match = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lng = Number(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Reads an image File, downscales it to `maxDim` on its longest side via
 * an offscreen canvas, and returns a compressed JPEG data-URL. Keeps
 * localStorage-stored photos small enough that a handful of them stay
 * well within the ~5-10MB/origin quota. */
export function fileToDataUrl(file: File, maxDim = 800, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** Rough size estimate (bytes) of a data-URL, for a soft pre-save warning
 * before actually hitting localStorage's quota. */
export function dataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
  return Math.round((base64.length * 3) / 4);
}
