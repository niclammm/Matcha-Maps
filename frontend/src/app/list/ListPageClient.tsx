"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CafeCard } from "@/components/cards/CafeCard";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { getCafesBySlugs } from "@/data/cafes";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";

export function ListPageClient() {
  const { savedSlugs, count, hydrated } = useSavedCafes();

  const savedCafes = useMemo(() => getCafesBySlugs(savedSlugs), [savedSlugs]);

  const subtitle =
    count === 0
      ? "No cafes saved yet"
      : count === 1
        ? "1 cafe saved"
        : `${count} cafes saved`;

  return (
    <>
      <Topbar />
      <main className="frame list-page">
        <Nav active="list" />

        <header className="list-page-header">
          <p className="list-page-eyebrow">My List</p>
          <h1 className="headline list-page-title">My cafes</h1>
          <p className="lede list-page-subtitle">{subtitle}</p>
        </header>

        {!hydrated ? (
          <p className="list-page-loading">Loading your list…</p>
        ) : count === 0 ? (
          <div className="list-page-empty">
            <p className="list-page-empty-title">Your list is looking a little empty.</p>
            <p className="list-page-empty-body">
              Find a cafe worth saving and it&apos;ll show up here.
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
    </>
  );
}
