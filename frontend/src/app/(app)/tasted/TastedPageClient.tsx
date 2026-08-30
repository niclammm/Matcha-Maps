"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CafeCard } from "@/components/cards/CafeCard";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";

export function TastedPageClient() {
  const { triedSlugs, count, hydrated: triedHydrated } = useTriedCafes();
  const { cafes, hydrated: cafesHydrated } = useCafes();
  const hydrated = triedHydrated && cafesHydrated;
  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const triedCafes = useMemo(
    () =>
      triedSlugs
        .map((slug) => cafes.find((cafe) => cafe.slug === slug))
        .filter((cafe): cafe is (typeof cafes)[number] => cafe != null),
    [cafes, triedSlugs],
  );

  // Not restricted to the map-enabled countries -- any free-text Country
  // value already tasted is a valid filter option, same as the map's
  // Cuisine filter.
  const countryOptions = useMemo(
    () => Array.from(new Set(triedCafes.map((c) => c.country))).sort((a, b) => a.localeCompare(b)),
    [triedCafes],
  );

  useEffect(() => {
    if (countryFilter != null && !countryOptions.includes(countryFilter)) setCountryFilter(null);
  }, [countryOptions, countryFilter]);

  const visibleCafes = useMemo(
    () => triedCafes.filter((c) => countryFilter == null || c.country === countryFilter),
    [triedCafes, countryFilter],
  );

  const subtitle =
    count === 0
      ? "No cafes tasted yet"
      : count === 1
        ? "1 cafe tasted"
        : `${count} cafes tasted`;

  return (
    <>
      <Topbar />
      <main className="frame list-page">
        <Nav active="tasted" />

        <header className="list-page-header">
          <p className="list-page-eyebrow">Tasted</p>
          <h1 className="headline list-page-title">Cafes I&apos;ve tried</h1>
          <p className="lede list-page-subtitle">{subtitle}</p>
        </header>

        {!hydrated ? (
          <p className="list-page-loading">Loading your tasted cafes…</p>
        ) : count === 0 ? (
          <div className="list-page-empty">
            <p className="list-page-empty-title">You haven&apos;t tasted any cafes yet.</p>
            <p className="list-page-empty-body">
              Once you&apos;ve tried a cafe, mark it tasted and it&apos;ll show up here.
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
                <CafeCard key={shop.id} shop={shop} variant="grid" />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
