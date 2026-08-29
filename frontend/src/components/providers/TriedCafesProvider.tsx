"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useCafes } from "@/components/providers/CafesProvider";

export type TriedNote = { rating: number | null; comment: string; photos: string[] };
export type TriedCafesData = Record<string, TriedNote>;

const EMPTY_NOTE: TriedNote = { rating: null, comment: "", photos: [] };

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

/** A thin read/write view over CafesProvider's shared `status` +
 * `tasted*` fields -- see SavedCafesProvider for why this exists as a
 * wrapper instead of folding directly into every consumer. */
export function TriedCafesProvider({ children }: { children: ReactNode }) {
  const { cafes, hydrated, updateCafe } = useCafes();

  const triedCafes = useMemo<TriedCafesData>(() => {
    const map: TriedCafesData = {};
    for (const cafe of cafes) {
      if (cafe.status === "tasted") {
        map[cafe.slug] = { rating: cafe.tastedRating, comment: cafe.tastedComment, photos: cafe.tastedPhotos };
      }
    }
    return map;
  }, [cafes]);

  const triedSlugs = useMemo(() => Object.keys(triedCafes), [triedCafes]);
  const isTried = useCallback((slug: string) => slug in triedCafes, [triedCafes]);

  const toggleTried = useCallback(
    (slug: string) => {
      const cafe = cafes.find((c) => c.slug === slug);
      if (!cafe) return;
      updateCafe(slug, { status: cafe.status === "tasted" ? null : "tasted" });
    },
    [cafes, updateCafe],
  );

  const getTriedNote = useCallback((slug: string) => triedCafes[slug] ?? EMPTY_NOTE, [triedCafes]);

  const setTriedNote = useCallback(
    (slug: string, note: TriedNote) => {
      if (!(slug in triedCafes)) return;
      updateCafe(slug, { tastedRating: note.rating, tastedComment: note.comment, tastedPhotos: note.photos });
    },
    [triedCafes, updateCafe],
  );

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
