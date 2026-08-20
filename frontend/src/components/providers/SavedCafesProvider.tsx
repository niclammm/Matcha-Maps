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
import {
  readSavedSlugs,
  SAVED_CAFES_STORAGE_KEY,
  writeSavedSlugs,
} from "@/lib/saved-cafes-storage";

type SavedCafesContextValue = {
  savedSlugs: string[];
  count: number;
  isSaved: (slug: string) => boolean;
  toggleSave: (slug: string) => void;
  hydrated: boolean;
};

const SavedCafesContext = createContext<SavedCafesContextValue | null>(null);

export function SavedCafesProvider({ children }: { children: ReactNode }) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSavedSlugs(readSavedSlugs());
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === SAVED_CAFES_STORAGE_KEY || event.key === null) {
        setSavedSlugs(readSavedSlugs());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isSaved = useCallback((slug: string) => savedSlugs.includes(slug), [savedSlugs]);

  const toggleSave = useCallback((slug: string) => {
    setSavedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      writeSavedSlugs(next);
      return next;
    });
  }, []);

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
