export const TRIED_CAFES_STORAGE_KEY = "matchamaps:tried-cafes";

export type TriedNote = { rating: number | null; comment: string };

export type TriedCafesData = Record<string, TriedNote>;

function isValidNote(value: unknown): value is TriedNote {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (v.rating === null || typeof v.rating === "number") && typeof v.comment === "string";
}

export function readTriedCafes(): TriedCafesData {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(TRIED_CAFES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const entries = Object.entries(parsed as Record<string, unknown>).filter(([, note]) => isValidNote(note));
    return Object.fromEntries(entries) as TriedCafesData;
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
