"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CafeCard } from "@/components/cards/CafeCard";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";

export function TastedPageClient() {
  const { triedSlugs, count, hydrated: triedHydrated } = useTriedCafes();
  const { cafes, hydrated: cafesHydrated } = useCafes();
  const hydrated = triedHydrated && cafesHydrated;

  const triedCafes = useMemo(
    () =>
      triedSlugs
        .map((slug) => cafes.find((cafe) => cafe.slug === slug))
        .filter((cafe): cafe is (typeof cafes)[number] => cafe != null),
    [cafes, triedSlugs],
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
          <div className="list-page-grid">
            {triedCafes.map((shop) => (
              <CafeCard key={shop.id} shop={shop} variant="grid" />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
