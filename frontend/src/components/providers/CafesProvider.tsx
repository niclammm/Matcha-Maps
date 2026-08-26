"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cafes as seedCafes } from "@/data/cafes";
import type { MergedShop, NewCafeInput, Shop } from "@/lib/types";
import { uniqueSlug } from "@/lib/cafe-helpers";
import {
  CUSTOM_CAFES_STORAGE_KEY,
  readCustomCafes,
  readRemovedSlugs,
  REMOVED_SLUGS_STORAGE_KEY,
  writeCustomCafes,
  writeRemovedSlugs,
} from "@/lib/custom-cafes-storage";

type CafesContextValue = {
  cafes: MergedShop[];
  hydrated: boolean;
  getBySlug: (slug: string) => MergedShop | undefined;
  addCafe: (input: NewCafeInput) => { shop: MergedShop; persisted: boolean };
  updateCafe: (slug: string, patch: Partial<NewCafeInput>) => { updated: boolean; persisted: boolean };
  removeCafe: (slug: string) => void;
};

const CafesContext = createContext<CafesContextValue | null>(null);

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cafe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CafesProvider({ children }: { children: ReactNode }) {
  const [removedSlugs, setRemovedSlugs] = useState<string[]>([]);
  const [customCafes, setCustomCafes] = useState<Shop[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRemovedSlugs(readRemovedSlugs());
    setCustomCafes(readCustomCafes());
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === REMOVED_SLUGS_STORAGE_KEY || event.key === null) {
        setRemovedSlugs(readRemovedSlugs());
      }
      if (event.key === CUSTOM_CAFES_STORAGE_KEY || event.key === null) {
        setCustomCafes(readCustomCafes());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const cafes = useMemo<MergedShop[]>(() => {
    const removedSet = new Set(removedSlugs);
    return [
      ...seedCafes.filter((c) => !removedSet.has(c.slug)).map((c) => ({ ...c, isCustom: false })),
      ...customCafes.map((c) => ({ ...c, isCustom: true })),
    ];
  }, [removedSlugs, customCafes]);

  const getBySlug = useCallback(
    (slug: string) => cafes.find((c) => c.slug === slug),
    [cafes],
  );

  const addCafe = useCallback(
    (input: NewCafeInput): { shop: MergedShop; persisted: boolean } => {
      const allSlugs = [...seedCafes.map((c) => c.slug), ...customCafes.map((c) => c.slug)];
      const slug = uniqueSlug(input.name, allSlugs);
      const newShop: Shop = {
        ...input,
        id: generateId(),
        slug,
        reviewCount: input.reviewCount ?? input.reviews?.length ?? 0,
      };

      const next = [...customCafes, newShop];
      const persisted = writeCustomCafes(next);
      setCustomCafes(next);

      return { shop: { ...newShop, isCustom: true }, persisted };
    },
    [customCafes],
  );

  const updateCafe = useCallback(
    (slug: string, patch: Partial<NewCafeInput>): { updated: boolean; persisted: boolean } => {
      const index = customCafes.findIndex((c) => c.slug === slug);
      if (index === -1) return { updated: false, persisted: false };

      const next = [...customCafes];
      next[index] = { ...next[index], ...patch };
      const persisted = writeCustomCafes(next);
      setCustomCafes(next);

      return { updated: true, persisted };
    },
    [customCafes],
  );

  const removeCafe = useCallback(
    (slug: string) => {
      const isCustom = customCafes.some((c) => c.slug === slug);
      if (isCustom) {
        setCustomCafes((prev) => {
          const next = prev.filter((c) => c.slug !== slug);
          writeCustomCafes(next);
          return next;
        });
        return;
      }

      setRemovedSlugs((prev) => {
        if (prev.includes(slug)) return prev;
        const next = [...prev, slug];
        writeRemovedSlugs(next);
        return next;
      });
    },
    [customCafes],
  );

  const value = useMemo<CafesContextValue>(
    () => ({ cafes, hydrated, getBySlug, addCafe, updateCafe, removeCafe }),
    [cafes, hydrated, getBySlug, addCafe, updateCafe, removeCafe],
  );

  return <CafesContext.Provider value={value}>{children}</CafesContext.Provider>;
}

export function useCafes(): CafesContextValue {
  const context = useContext(CafesContext);
  if (!context) {
    throw new Error("useCafes must be used within CafesProvider");
  }
  return context;
}
