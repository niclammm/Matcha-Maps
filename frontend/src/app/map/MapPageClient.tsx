"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { ScrapbookMap } from "@/components/map/ScrapbookMap";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import type { MergedShop } from "@/lib/types";

type DrawerState = { mode: "view" | "add" | "edit"; slug: string | null };

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("cafe");
  const { cafes, hydrated } = useCafes();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [drawer, setDrawer] = useState<DrawerState | null>(
    initialSlug ? { mode: "view", slug: initialSlug } : null,
  );
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const sortedCafes = useMemo(
    () => [...cafes].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.rating - a.rating),
    [cafes],
  );

  const areas = useMemo(() => Array.from(new Set(sortedCafes.map((c) => c.area))), [sortedCafes]);

  const visibleSlugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = new Set<string>();
    for (const cafe of sortedCafes) {
      const hit =
        (!q || cafe.name.toLowerCase().includes(q) || cafe.area.toLowerCase().includes(q)) &&
        (!areaFilter || cafe.area === areaFilter);
      if (hit) visible.add(cafe.slug);
    }
    return visible;
  }, [sortedCafes, query, areaFilter]);

  const dimmedSlugs = useMemo(
    () => new Set(sortedCafes.filter((c) => !visibleSlugs.has(c.slug)).map((c) => c.slug)),
    [sortedCafes, visibleSlugs],
  );

  const averageRating = useMemo(() => {
    if (sortedCafes.length === 0) return 0;
    return sortedCafes.reduce((sum, c) => sum + c.rating, 0) / sortedCafes.length;
  }, [sortedCafes]);

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

  function toggleAreaFilter(area: string) {
    setAreaFilter((prev) => (prev === area ? null : area));
  }

  const shownCount = visibleSlugs.size;

  return (
    <>
      <Topbar />
      <main className="map-page">
        <div className="map-frame">
          <Nav active="cafes" />

          <div className="map-head">
            <h1>
              Every bowl,
              <br />
              <span>on the map.</span>
            </h1>
            <div className="map-head-meta">
              <span>
                {hydrated
                  ? `${shownCount} matcha spot${shownCount === 1 ? "" : "s"} in Singapore`
                  : "Loading cafes…"}
              </span>
              <span className="stat-sep" aria-hidden="true" />
              <span>★ {averageRating.toFixed(1)} average rating</span>
            </div>
          </div>

          <div className="map-layout">
            <ScrapbookMap
              cafes={sortedCafes}
              selectedSlug={selectedSlug}
              dimmedSlugs={dimmedSlugs}
              onSelect={openView}
              query={query}
              onQueryChange={setQuery}
              areas={areas}
              areaFilter={areaFilter}
              onAreaFilterToggle={toggleAreaFilter}
            />

            <aside className="rail">
              <div className="rail-head">
                <p className="rail-label">Top ranked</p>
                <button type="button" className="btn btn-primary rail-add" onClick={openAdd}>
                  + Add cafe
                </button>
              </div>

              <div className="rail-track">
                {sortedCafes
                  .filter((cafe) => visibleSlugs.has(cafe.slug))
                  .map((cafe) => (
                    <CafeCard
                      key={cafe.id}
                      shop={cafe}
                      variant="rail"
                      selected={selectedSlug === cafe.slug}
                      onSelect={() => openView(cafe.slug)}
                    />
                  ))}
              </div>

              <div className="rail-foot">
                <span className="legend-item">
                  <span className="legend-swatch" style={{ background: "var(--matcha)" }} />
                  Tasted &amp; rated
                </span>
                <span className="legend-item">
                  <span className="legend-swatch" style={{ background: "var(--brown-tan)" }} />
                  On the list
                </span>
              </div>
            </aside>
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
