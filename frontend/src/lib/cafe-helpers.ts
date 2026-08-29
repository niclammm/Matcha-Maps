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

const SHORT_MAPS_LINK_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);

/** True for a share-sheet short link (maps.app.goo.gl/...), which a browser
 * can't resolve itself -- reading a cross-origin redirect's target is
 * blocked by CORS, so these need the server-side /api/resolve-maps-link
 * helper first. A full google.com/maps/... link needs no such round trip. */
export function isShortGoogleMapsLink(url: string): boolean {
  try {
    return SHORT_MAPS_LINK_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Resolves a short Google Maps link to its full form via the server-side
 * helper (browsers can't follow the cross-origin redirect themselves).
 * Returns the input unchanged -- not a throw -- if it's already a full
 * link, or if resolution fails for any reason, so callers can always fall
 * back to parsing (or manually filling in) whatever they started with. */
export async function resolveGoogleMapsLink(url: string): Promise<string> {
  if (!isShortGoogleMapsLink(url)) return url;
  try {
    const res = await fetch(`/api/resolve-maps-link?url=${encodeURIComponent(url)}`);
    if (!res.ok) return url;
    const data: unknown = await res.json();
    const resolved = (data as { resolvedUrl?: unknown }).resolvedUrl;
    return typeof resolved === "string" && resolved ? resolved : url;
  } catch {
    return url;
  }
}

export type ExtractedPlaceInfo = {
  name: string | null;
  lat: number | null;
  lng: number | null;
  address: string | null;
  cuisine: string | null;
};

/** Google's `_restaurant`/`_cafe`/etc. category slugs, humanized into a
 * short cuisine label -- "italian_restaurant" -> "Italian". */
function humanizeCategorySlug(slug: string): string | null {
  const trimmed = slug.replace(/_(restaurant|cafe|bar|bakery|food|store|shop)$/, "");
  // A slug that's only the suffix (e.g. just "_cafe") has nothing to
  // humanize -- fail safe to null rather than leak the raw slug into the UI.
  if (!trimmed) return null;
  return trimmed
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** Best-effort, undocumented: Google Maps share links sometimes embed a
 * `!15s<base64 blob>` segment that decodes to a small internal record
 * containing a plain-text category slug (e.g. "italian_restaurant"). This
 * isn't a stable or public format -- it can be missing, or change without
 * notice -- so every step is defensive and any failure just returns null,
 * leaving cuisine for manual entry rather than blocking the rest of the
 * extraction. */
function extractCuisineFromDataBlob(url: string): string | null {
  try {
    const match = url.match(/!15s([A-Za-z0-9_-]+)/);
    if (!match) return null;
    let b64 = match[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4 !== 0) b64 += "=";
    const decoded = atob(b64);
    const categoryMatch = decoded.match(/([a-z][a-z_]{2,40}_(?:restaurant|cafe|bar|bakery|food))/);
    if (!categoryMatch) return null;
    return humanizeCategorySlug(categoryMatch[1]);
  } catch {
    return null;
  }
}

/** Pulls whatever a pasted (already-resolved) Google Maps URL will give up:
 * lat/lng and a place name from the common `/maps/place/<Name>/@lat,lng,z`
 * form, or a name+address from the `/maps/?q=<Name>,+<Address>` form (which
 * has no parseable coordinates), plus a best-effort cuisine guess. Every
 * field is independently nullable -- never throws, never requires the
 * others to have matched -- so the caller can pre-fill what it finds and
 * leave the rest for manual entry. */
export function extractPlaceInfoFromGoogleMapsUrl(url: string): ExtractedPlaceInfo {
  let name: string | null = null;
  let address: string | null = null;
  let lat: number | null = null;
  let lng: number | null = null;

  const coordMatch = url.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (coordMatch) {
    const parsedLat = Number(coordMatch[1]);
    const parsedLng = Number(coordMatch[2]);
    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      lat = parsedLat;
      lng = parsedLng;
    }
  }

  const placeMatch = url.match(/\/maps\/place\/([^/@]+)/);
  if (placeMatch) {
    try {
      name = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim() || null;
    } catch {
      name = placeMatch[1].replace(/\+/g, " ").trim() || null;
    }
  } else {
    const queryMatch = url.match(/[?&]q=([^&]+)/);
    if (queryMatch) {
      try {
        const decodedQuery = decodeURIComponent(queryMatch[1].replace(/\+/g, " ")).trim();
        const [first, ...rest] = decodedQuery.split(",");
        name = first?.trim() || null;
        address = rest.join(",").trim() || null;
      } catch {
        // leave name/address null if the query segment doesn't decode cleanly
      }
    }
  }

  return { name, lat, lng, address, cuisine: extractCuisineFromDataBlob(url) };
}

/** Reads an image File, downscales it to `maxDim` on its longest side via
 * an offscreen canvas, and returns a compressed JPEG Blob ready to upload.
 * Uploads go to real file storage now (not localStorage), so this is just
 * a bandwidth/storage-cost trim, not a hard quota workaround. */
export function fileToResizedBlob(file: File, maxDim = 1600, quality = 0.85): Promise<Blob> {
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
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
          "image/jpeg",
          quality,
        );
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
