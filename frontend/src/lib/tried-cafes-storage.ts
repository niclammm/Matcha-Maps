export const TRIED_CAFES_STORAGE_KEY = "matchamaps:tried-cafes";

export type TriedNote = { rating: number | null; comment: string; photos: string[] };

function isValidPhotos(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((p) => typeof p === "string");
}

/** Validates the required fields (`rating`/`comment`) and normalizes
 * `photos` independently, defaulting a missing or malformed value (e.g. a
 * stray `null`) to `[]` rather than letting it invalidate an otherwise-real
 * rating/comment -- notes saved before `photos` existed won't have it. */
function toValidNote(value: unknown): TriedNote | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!(v.rating === null || typeof v.rating === "number")) return null;
  if (typeof v.comment !== "string") return null;
  return { rating: v.rating, comment: v.comment, photos: isValidPhotos(v.photos) ? v.photos : [] };
}

export type TriedCafesData = Record<string, TriedNote>;

export function readTriedCafes(): TriedCafesData {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(TRIED_CAFES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed as Record<string, unknown>)
      .map(([slug, note]) => [slug, toValidNote(note)] as const)
      .filter((entry): entry is [string, TriedNote] => entry[1] !== null);
    return Object.fromEntries(entries);
  } catch {
    return {};
  }
}

export function writeTriedCafes(data: TriedCafesData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TRIED_CAFES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore quota / private-mode errors
  }
}
