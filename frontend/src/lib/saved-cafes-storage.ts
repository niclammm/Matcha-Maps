export const SAVED_CAFES_STORAGE_KEY = "matchamaps:saved-slugs";

export function readSavedSlugs(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(SAVED_CAFES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function writeSavedSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(SAVED_CAFES_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // ignore quota / private-mode errors
  }
}
