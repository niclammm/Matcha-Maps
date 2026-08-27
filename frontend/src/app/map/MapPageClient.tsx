"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { ScrapbookMap } from "@/components/map/ScrapbookMap";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";
import type { MergedShop } from "@/lib/types";

type DrawerState = { mode: "view" | "add" | "edit"; slug: string | null };
type Bucket = "wishlist" | "tasted";

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("cafe");
  const { cafes, hydrated: cafesHydrated } = useCafes();
  const { savedSlugs, hydrated: savedHydrated } = useSavedCafes();
  const { triedSlugs, triedCafes, hydrated: triedHydrated } = useTriedCafes();
  const hydrated = cafesHydrated && savedHydrated && triedHydrated;

  const [bucket, setBucket] = useState<Bucket>("wishlist");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [drawer, setDrawer] = useState<DrawerState | null>(
    initialSlug ? { mode: "view", slug: initialSlug } : null,
  );
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState<string | null>(null);

  const bucketSlugSet = useMemo(
    () => new Set(bucket === "wishlist" ? savedSlugs : triedSlugs),
    [bucket, savedSlugs, triedSlugs],
  );

  const sortedCafes = useMemo(
    () =>
      cafes
        .filter((c) => bucketSlugSet.has(c.slug))
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || (b.rating ?? 0) - (a.rating ?? 0)),
    [cafes, bucketSlugSet],
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
    if (bucket !== "tasted") return null;
    const rated = sortedCafes
      .map((c) => triedCafes[c.slug]?.rating)
      .filter((r): r is number => r != null);
    if (rated.length === 0) return null;
    return rated.reduce((sum, r) => sum + r, 0) / rated.length;
  }, [bucket, sortedCafes, triedCafes]);

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

  function switchBucket(next: Bucket) {
    setBucket(next);
    setAreaFilter(null);
    setQuery("");
  }

  const shownCount = visibleSlugs.size;
  const bucketLabel = bucket === "wishlist" ? "wish list" : "tasted";

  return (
    <>
      <Topbar />
      <main className="map-page">
        <div className="map-frame">
          <Nav active="map" />

          <div className="map-head">
            <h1>
              Every bowl,
              <br />
              <span>on the map.</span>
            </h1>
            <div className="map-head-meta">
              <span>
                {hydrated
                  ? `${shownCount} ${shownCount === 1 ? "spot" : "spots"} on your ${bucketLabel}`
                  : "Loading cafes…"}
              </span>
              {bucket === "tasted" && averageRating != null && (
                <>
                  <span className="stat-sep" aria-hidden="true" />
                  <span>★ {averageRating.toFixed(1)} average rating</span>
                </>
              )}
            </div>
            <div className="chips map-bucket-toggle" role="group" aria-label="Show">
              <button
                type="button"
                className={`chip${bucket === "wishlist" ? " is-on" : ""}`}
                onClick={() => switchBucket("wishlist")}
              >
                Wish List
              </button>
              <button
                type="button"
                className={`chip${bucket === "tasted" ? " is-on" : ""}`}
                onClick={() => switchBucket("tasted")}
              >
                Tasted
              </button>
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
                  + Add restaurant
                </button>
              </div>

              {hydrated && sortedCafes.length === 0 ? (
                <div className="rail-empty">
                  <p className="rail-empty-title">
                    {bucket === "wishlist" ? "Your wish list is empty." : "You haven't tasted any cafes yet."}
                  </p>
                  <p className="rail-empty-body">
                    {bucket === "wishlist"
                      ? "Open a cafe and tap the glass icon to add it to your wish list."
                      : "Open a cafe and mark it tasted once you've tried it."}
                  </p>
                </div>
              ) : (
                <div className="rail-track">
                  {sortedCafes
                    .filter((cafe) => visibleSlugs.has(cafe.slug))
                    .map((cafe) => (
                      <CafeCard
                        key={cafe.id}
                        shop={cafe}
                        variant="rail"
                        action={bucket === "tasted" ? "tried" : "save"}
                        selected={selectedSlug === cafe.slug}
                        onSelect={() => openView(cafe.slug)}
                      />
                    ))}
                </div>
              )}

              <div className="rail-foot">
                <span className="legend-item">
                  <span className="legend-swatch" style={{ background: "var(--matcha)" }} />
                  Ranked pick
                </span>
                <span className="legend-item">
                  <span className="legend-swatch" style={{ background: "var(--brown-tan)" }} />
                  Community favorite
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
