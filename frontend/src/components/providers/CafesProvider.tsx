"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import type { MergedShop, NewCafeInput } from "@/lib/types";
import type { CafePatch } from "@/lib/cafe-mapping";
import { uniqueSlug } from "@/lib/cafe-helpers";

type CafesContextValue = {
  cafes: MergedShop[];
  /** Always true -- cafes arrive as a server-rendered prop, never fetched
   * client-side, so there's no hydration gap to wait out. Kept so existing
   * `if (!hydrated) ...` call sites don't need to change. */
  hydrated: boolean;
  /** Set when a background save/update/delete fails after the optimistic
   * local change already applied. Surfaced globally by SyncErrorBanner. */
  syncError: string | null;
  dismissSyncError: () => void;
  getBySlug: (slug: string) => MergedShop | undefined;
  addCafe: (
    input: NewCafeInput,
    initialStatus?: "wishlist" | "tasted" | null,
  ) => { shop: MergedShop; persisted: boolean };
  updateCafe: (slug: string, patch: CafePatch) => { updated: boolean; persisted: boolean };
  removeCafe: (slug: string) => void;
};

const CafesContext = createContext<CafesContextValue | null>(null);

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `cafe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function CafesProvider({ children, initialCafes }: { children: ReactNode; initialCafes: MergedShop[] }) {
  const [cafes, setCafes] = useState<MergedShop[]>(initialCafes);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Latest update-request number issued per slug, so a same-cafe PATCH that
  // resolves out of order (a rapid double-click, or a slow rating-blur
  // racing a faster comment-blur) can tell it's been superseded and skip
  // both reconciling and rolling back over whatever the newer request
  // already applied.
  const updateSeqRef = useRef(new Map<string, number>());

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  const getBySlug = useCallback((slug: string) => cafes.find((c) => c.slug === slug), [cafes]);

  // Every mutation below applies to local state first (so the click that
  // triggered it feels instant) and fires the matching API call in the
  // background, rolling the local change back and surfacing `syncError` if
  // the network request fails -- the "smooth, but never silently wrong"
  // trade-off the app is going for now that a real network sits between a
  // click and it actually being saved.

  const addCafe = useCallback(
    (input: NewCafeInput, initialStatus: "wishlist" | "tasted" | null = null): { shop: MergedShop; persisted: boolean } => {
      const slug = uniqueSlug(
        input.name,
        cafes.map((c) => c.slug),
      );
      const optimistic: MergedShop = {
        ...input,
        id: generateId(),
        slug,
        reviewCount: input.reviewCount ?? input.reviews?.length ?? 0,
        status: initialStatus,
        tastedRating: null,
        tastedComment: "",
        tastedPhotos: [],
      };
      setCafes((prev) => [...prev, optimistic]);

      fetch("/api/cafes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("save failed");
          let saved: MergedShop = await res.json();
          // Creation and status are separate concerns server-side (POST
          // never accepts a status), so a requested initial status is set
          // via a follow-up PATCH here rather than by the caller trying to
          // call updateCafe/toggleSave itself right after addCafe returns --
          // that used to look up the new cafe in `cafes`, which still
          // reflected the pre-add snapshot from the same render (setCafes
          // above doesn't re-render synchronously), so the lookup silently
          // failed and the cafe was never actually wishlisted.
          if (initialStatus) {
            const patchRes = await fetch(`/api/cafes/${saved.slug}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: initialStatus }),
            }).catch(() => null);
            if (patchRes?.ok) saved = await patchRes.json();
          }
          setCafes((prev) => prev.map((c) => (c.slug === slug ? saved : c)));
        })
        .catch(() => {
          setCafes((prev) => prev.filter((c) => c.slug !== slug));
          setSyncError(`Couldn't save "${input.name}" -- try adding it again.`);
        });

      return { shop: optimistic, persisted: true };
    },
    [cafes],
  );

  const updateCafe = useCallback(
    (slug: string, patch: CafePatch): { updated: boolean; persisted: boolean } => {
      const previous = cafes.find((c) => c.slug === slug);
      if (!previous) return { updated: false, persisted: false };

      // Reconciling/rolling back only the keys *this* patch touched -- not
      // the whole row -- so a different in-flight edit to the same cafe
      // (e.g. a tasted-note rating-blur and a photo upload landing close
      // together) can't have its change wiped by this one's success or
      // failure.
      const patchedKeys = Object.keys(patch) as (keyof CafePatch)[];
      const seq = (updateSeqRef.current.get(slug) ?? 0) + 1;
      updateSeqRef.current.set(slug, seq);
      const isStale = () => updateSeqRef.current.get(slug) !== seq;

      setCafes((prev) => prev.map((c) => (c.slug === slug ? ({ ...c, ...patch } as MergedShop) : c)));

      fetch(`/api/cafes/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("save failed");
          const saved: MergedShop = await res.json();
          if (isStale()) return;
          setCafes((prev) =>
            prev.map((c) =>
              c.slug === slug
                ? { ...c, ...Object.fromEntries(patchedKeys.map((k) => [k, (saved as Record<string, unknown>)[k]])) }
                : c,
            ),
          );
        })
        .catch(() => {
          if (isStale()) return;
          setCafes((prev) =>
            prev.map((c) =>
              c.slug === slug
                ? {
                    ...c,
                    ...Object.fromEntries(patchedKeys.map((k) => [k, (previous as Record<string, unknown>)[k]])),
                  }
                : c,
            ),
          );
          setSyncError(`Couldn't save your change to "${previous.name}" -- try again.`);
        });

      return { updated: true, persisted: true };
    },
    [cafes],
  );

  const removeCafe = useCallback(
    (slug: string) => {
      const previous = cafes.find((c) => c.slug === slug);
      if (!previous) return;

      setCafes((prev) => prev.filter((c) => c.slug !== slug));

      fetch(`/api/cafes/${slug}`, { method: "DELETE" }).catch(() => {
        setCafes((prev) => (prev.some((c) => c.slug === slug) ? prev : [...prev, previous]));
        setSyncError(`Couldn't remove "${previous.name}" -- try again.`);
      });
    },
    [cafes],
  );

  const value = useMemo<CafesContextValue>(
    () => ({
      cafes,
      hydrated: true,
      syncError,
      dismissSyncError,
      getBySlug,
      addCafe,
      updateCafe,
      removeCafe,
    }),
    [cafes, syncError, dismissSyncError, getBySlug, addCafe, updateCafe, removeCafe],
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
