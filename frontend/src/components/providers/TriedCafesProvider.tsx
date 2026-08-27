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
  readTriedSlugs,
  TRIED_CAFES_STORAGE_KEY,
  writeTriedSlugs,
} from "@/lib/tried-cafes-storage";

type TriedCafesContextValue = {
  triedSlugs: string[];
  count: number;
  isTried: (slug: string) => boolean;
  toggleTried: (slug: string) => void;
  hydrated: boolean;
};

const TriedCafesContext = createContext<TriedCafesContextValue | null>(null);

export function TriedCafesProvider({ children }: { children: ReactNode }) {
  const [triedSlugs, setTriedSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTriedSlugs(readTriedSlugs());
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === TRIED_CAFES_STORAGE_KEY || event.key === null) {
        setTriedSlugs(readTriedSlugs());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isTried = useCallback((slug: string) => triedSlugs.includes(slug), [triedSlugs]);

  const toggleTried = useCallback((slug: string) => {
    setTriedSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      writeTriedSlugs(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      triedSlugs,
      count: triedSlugs.length,
      isTried,
      toggleTried,
      hydrated,
    }),
    [triedSlugs, isTried, toggleTried, hydrated],
  );

  return <TriedCafesContext.Provider value={value}>{children}</TriedCafesContext.Provider>;
}

export function useTriedCafes(): TriedCafesContextValue {
  const context = useContext(TriedCafesContext);
  if (!context) {
    throw new Error("useTriedCafes must be used within TriedCafesProvider");
  }
  return context;
}
