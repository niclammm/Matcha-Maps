"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import type { MergedShop } from "@/lib/types";

export function ListPageClient() {
  const { savedSlugs, count, isSaved, toggleSave, hydrated: savedHydrated } = useSavedCafes();
  const { cafes, hydrated: cafesHydrated } = useCafes();
  const hydrated = savedHydrated && cafesHydrated;
  const [addOpen, setAddOpen] = useState(false);

  const savedCafes = useMemo(
    () =>
      savedSlugs
        .map((slug) => cafes.find((cafe) => cafe.slug === slug))
        .filter((cafe): cafe is (typeof cafes)[number] => cafe != null),
    [cafes, savedSlugs],
  );

  const subtitle =
    count === 0
      ? "No cafes on your wish list yet"
      : count === 1
        ? "1 cafe on your wish list"
        : `${count} cafes on your wish list`;

  function handleAdded(shop: MergedShop) {
    if (!isSaved(shop.slug)) toggleSave(shop.slug);
    setAddOpen(false);
  }

  return (
    <>
      <Topbar />
      <main className="frame list-page">
        <Nav active="wishlist" />

        <header className="list-page-header">
          <div className="list-page-header-top">
            <div>
              <p className="list-page-eyebrow">Wish List</p>
              <h1 className="headline list-page-title">Cafes I want to try</h1>
              <p className="lede list-page-subtitle">{subtitle}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
              + Add restaurant
            </button>
          </div>
        </header>

        {!hydrated ? (
          <p className="list-page-loading">Loading your wish list…</p>
        ) : count === 0 ? (
          <div className="list-page-empty">
            <p className="list-page-empty-title">Your wish list is empty.</p>
            <p className="list-page-empty-body">
              Find a cafe you want to try and add it here.
            </p>
            <Link href="/map" className="btn btn-primary list-page-empty-cta">
              Explore the map →
            </Link>
          </div>
        ) : (
          <div className="list-page-grid">
            {savedCafes.map((shop) => (
              <CafeCard key={shop.id} shop={shop} variant="grid" />
            ))}
          </div>
        )}
      </main>

      {addOpen && (
        <CafeDrawer
          mode="add"
          shop={null}
          onClose={() => setAddOpen(false)}
          onRequestEdit={() => {}}
          onSaved={handleAdded}
          onRemoved={() => setAddOpen(false)}
        />
      )}
    </>
  );
}
