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
  readTriedCafes,
  TRIED_CAFES_STORAGE_KEY,
  writeTriedCafes,
  type TriedCafesData,
  type TriedNote,
} from "@/lib/tried-cafes-storage";

const EMPTY_NOTE: TriedNote = { rating: null, comment: "" };

type TriedCafesContextValue = {
  triedCafes: TriedCafesData;
  triedSlugs: string[];
  count: number;
  isTried: (slug: string) => boolean;
  toggleTried: (slug: string) => void;
  getTriedNote: (slug: string) => TriedNote;
  setTriedNote: (slug: string, note: TriedNote) => void;
  hydrated: boolean;
};

const TriedCafesContext = createContext<TriedCafesContextValue | null>(null);

export function TriedCafesProvider({ children }: { children: ReactNode }) {
  const [triedCafes, setTriedCafes] = useState<TriedCafesData>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTriedCafes(readTriedCafes());
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === TRIED_CAFES_STORAGE_KEY || event.key === null) {
        setTriedCafes(readTriedCafes());
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isTried = useCallback((slug: string) => slug in triedCafes, [triedCafes]);

  const toggleTried = useCallback((slug: string) => {
    setTriedCafes((prev) => {
      const next = { ...prev };
      if (slug in next) {
        delete next[slug];
      } else {
        next[slug] = { ...EMPTY_NOTE };
      }
      writeTriedCafes(next);
      return next;
    });
  }, []);

  const getTriedNote = useCallback((slug: string) => triedCafes[slug] ?? EMPTY_NOTE, [triedCafes]);

  const setTriedNote = useCallback((slug: string, note: TriedNote) => {
    setTriedCafes((prev) => {
      if (!(slug in prev)) return prev;
      const next = { ...prev, [slug]: note };
      writeTriedCafes(next);
      return next;
    });
  }, []);

  const triedSlugs = useMemo(() => Object.keys(triedCafes), [triedCafes]);

  const value = useMemo(
    () => ({
      triedCafes,
      triedSlugs,
      count: triedSlugs.length,
      isTried,
      toggleTried,
      getTriedNote,
      setTriedNote,
      hydrated,
    }),
    [triedCafes, triedSlugs, isTried, toggleTried, getTriedNote, setTriedNote, hydrated],
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
