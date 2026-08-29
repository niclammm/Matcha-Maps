"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useCafes } from "@/components/providers/CafesProvider";

type SavedCafesContextValue = {
  savedSlugs: string[];
  count: number;
  isSaved: (slug: string) => boolean;
  toggleSave: (slug: string) => void;
  hydrated: boolean;
};

const SavedCafesContext = createContext<SavedCafesContextValue | null>(null);

/** A thin read/write view over CafesProvider's shared `status` field,
 * kept as its own hook so call sites don't need to change now that Wish
 * List and Tasted live on one shared cafe record instead of two
 * independent localStorage stores. */
export function SavedCafesProvider({ children }: { children: ReactNode }) {
  const { cafes, hydrated, updateCafe } = useCafes();

  const savedSlugs = useMemo(() => cafes.filter((c) => c.status === "wishlist").map((c) => c.slug), [cafes]);
  const isSaved = useCallback((slug: string) => savedSlugs.includes(slug), [savedSlugs]);

  const toggleSave = useCallback(
    (slug: string) => {
      const cafe = cafes.find((c) => c.slug === slug);
      if (!cafe) return;
      updateCafe(slug, { status: cafe.status === "wishlist" ? null : "wishlist" });
    },
    [cafes, updateCafe],
  );

  const value = useMemo(
    () => ({
      savedSlugs,
      count: savedSlugs.length,
      isSaved,
      toggleSave,
      hydrated,
    }),
    [savedSlugs, isSaved, toggleSave, hydrated],
  );

  return <SavedCafesContext.Provider value={value}>{children}</SavedCafesContext.Provider>;
}

export function useSavedCafes(): SavedCafesContextValue {
  const context = useContext(SavedCafesContext);
  if (!context) {
    throw new Error("useSavedCafes must be used within SavedCafesProvider");
  }
  return context;
}
