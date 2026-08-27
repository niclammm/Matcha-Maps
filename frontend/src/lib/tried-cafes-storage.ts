export const TRIED_CAFES_STORAGE_KEY = "matchamaps:tried-slugs";

export function readTriedSlugs(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(TRIED_CAFES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function writeTriedSlugs(slugs: string[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TRIED_CAFES_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // ignore quota / private-mode errors
  }
}
