"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import type { MergedShop } from "@/lib/types";

export function ListPageClient() {
  const router = useRouter();
  const { savedSlugs, count, isSaved, toggleSave, hydrated: savedHydrated } = useSavedCafes();
  const { cafes, hydrated: cafesHydrated } = useCafes();
  const hydrated = savedHydrated && cafesHydrated;
  const [addOpen, setAddOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const savedCafes = useMemo(
    () =>
      savedSlugs
        .map((slug) => cafes.find((cafe) => cafe.slug === slug))
        .filter((cafe): cafe is (typeof cafes)[number] => cafe != null),
    [cafes, savedSlugs],
  );

  // Not restricted to the map-enabled countries -- any free-text Country
  // value already on the list is a valid filter option, same as the map's
  // Cuisine filter.
  const countryOptions = useMemo(
    () => Array.from(new Set(savedCafes.map((c) => c.country))).sort((a, b) => a.localeCompare(b)),
    [savedCafes],
  );

  // Mirrors MapPageClient's same guard for Price/Rating/Cuisine: if the one
  // cafe an active filter matched gets removed/edited, its chip vanishes --
  // without this the filter would silently keep matching nothing.
  useEffect(() => {
    if (countryFilter != null && !countryOptions.includes(countryFilter)) setCountryFilter(null);
  }, [countryOptions, countryFilter]);

  const visibleCafes = useMemo(
    () => savedCafes.filter((c) => countryFilter == null || c.country === countryFilter),
    [savedCafes, countryFilter],
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
          <>
            {countryOptions.length > 1 && (
              <div className="chips filter-chip-group" role="group" aria-label="Country">
                <span className="filter-chip-group-label">Country</span>
                {countryOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`chip${countryFilter === option ? " is-on" : ""}`}
                    onClick={() => setCountryFilter((prev) => (prev === option ? null : option))}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <div className="list-page-grid">
              {visibleCafes.map((shop) => (
                <CafeCard
                  key={shop.id}
                  shop={shop}
                  variant="grid"
                  onMarkedTasted={() => router.push(`/map?cafe=${shop.slug}`)}
                />
              ))}
            </div>
          </>
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
