"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { DotMap } from "@/components/map/DotMap";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import type { MergedShop } from "@/lib/types";

const TILE_CLASSES = ["tile-tan", "tile-blue", "tile-sage", "tile-butter", "tile-honey"];

type DrawerState = { mode: "view" | "add" | "edit"; slug: string | null };

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("cafe");
  const { cafes, hydrated } = useCafes();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [drawer, setDrawer] = useState<DrawerState | null>(
    initialSlug ? { mode: "view", slug: initialSlug } : null,
  );

  const sortedCafes = useMemo(
    () => [...cafes].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.rating - a.rating),
    [cafes],
  );

  const drawerShop: MergedShop | null = drawer?.slug
    ? (cafes.find((c) => c.slug === drawer.slug) ?? null)
    : null;

  function openView(slug: string) {
    setSelectedSlug(slug);
    setDrawer({ mode: "view", slug });
  }

  function openAdd() {
    setSelectedSlug(null);
    setDrawer({ mode: "add", slug: null });
  }

  function requestEdit(slug: string) {
    setDrawer({ mode: "edit", slug });
  }

  function closeDrawer() {
    setDrawer(null);
  }

  function handleSaved(shop: MergedShop) {
    setSelectedSlug(shop.slug);
    setDrawer({ mode: "view", slug: shop.slug });
  }

  function handleRemoved() {
    setSelectedSlug(null);
    setDrawer(null);
  }

  return (
    <>
      <Topbar />
      <main className="map-page">
        <div className="map-frame">
          <Nav active="cafes" />

          <div className="map-toolbar">
            <p className="map-toolbar-hint">
              {hydrated ? `${cafes.length} matcha spots in Singapore` : "Loading cafes…"}
            </p>
            <button type="button" className="btn btn-primary" onClick={openAdd}>
              + Add cafe
            </button>
          </div>

          <DotMap cafes={sortedCafes} selectedSlug={selectedSlug} onSelect={openView} />

          <div className="cafe-rail">
            <div className="cafe-rail-track">
              {sortedCafes.map((cafe, i) => (
                <CafeCard
                  key={cafe.id}
                  shop={cafe}
                  variant="rail"
                  tileClass={TILE_CLASSES[i % TILE_CLASSES.length]}
                  selected={selectedSlug === cafe.slug}
                  onSelect={() => openView(cafe.slug)}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      {drawer && (
        <CafeDrawer
          mode={drawer.mode}
          shop={drawerShop}
          onClose={closeDrawer}
          onRequestEdit={requestEdit}
          onSaved={handleSaved}
          onRemoved={handleRemoved}
        />
      )}
    </>
  );
}
