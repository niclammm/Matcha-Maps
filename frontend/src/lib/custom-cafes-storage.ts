import type { Shop } from "@/lib/types";

export const REMOVED_SLUGS_STORAGE_KEY = "matchamaps:removed-slugs";
export const CUSTOM_CAFES_STORAGE_KEY = "matchamaps:custom-cafes";

const CUSTOM_CAFES_VERSION = 1;

type CustomCafesFile = {
  version: number;
  cafes: Shop[];
};

export function readRemovedSlugs(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(REMOVED_SLUGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function writeRemovedSlugs(slugs: string[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    localStorage.setItem(REMOVED_SLUGS_STORAGE_KEY, JSON.stringify(slugs));
    return true;
  } catch {
    return false;
  }
}

function isValidShop(value: unknown): value is Shop {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const loc = v.location as Record<string, unknown> | undefined;
  return (
    typeof v.id === "string" &&
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    typeof v.area === "string" &&
    (v.rating === undefined || typeof v.rating === "number") &&
    typeof v.reviewCount === "number" &&
    typeof v.signatureDrink === "string" &&
    (v.priceTier === 1 || v.priceTier === 2 || v.priceTier === 3) &&
    !!loc &&
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    typeof loc.address === "string"
  );
}

export function readCustomCafes(): Shop[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CUSTOM_CAFES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      (parsed as CustomCafesFile).version !== CUSTOM_CAFES_VERSION ||
      !Array.isArray((parsed as CustomCafesFile).cafes)
    ) {
      return [];
    }
    return (parsed as CustomCafesFile).cafes.filter(isValidShop);
  } catch {
    return [];
  }
}

export function writeCustomCafes(cafes: Shop[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    const file: CustomCafesFile = { version: CUSTOM_CAFES_VERSION, cafes };
    localStorage.setItem(CUSTOM_CAFES_STORAGE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}
