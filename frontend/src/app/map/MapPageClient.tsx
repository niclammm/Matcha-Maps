"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { ScrapbookMap, type FilterChipGroup } from "@/components/map/ScrapbookMap";
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
  const { savedSlugs, isSaved, toggleSave, hydrated: savedHydrated } = useSavedCafes();
  const { triedSlugs, triedCafes, isTried, toggleTried, setTriedNote, hydrated: triedHydrated } = useTriedCafes();
  const hydrated = cafesHydrated && savedHydrated && triedHydrated;

  // One-time demo seed for local preview only -- visiting /map?seed=demo
  // wishlists the 3 real spots and adds 3 clearly-labeled dummy "tasted"
  // entries with sample notes, so the buckets aren't empty when showing the
  // feature off. Never fires without the explicit query param.
  useEffect(() => {
    if (searchParams.get("seed") !== "demo" || !hydrated) return;

    const wishlistSeed = ["scarpetta", "huevos", "pasta-bar-the-original"];
    wishlistSeed.forEach((slug) => {
      if (!isSaved(slug)) toggleSave(slug);
    });

    const tastedSeed: { slug: string; rating: number; comment: string }[] = [
      { slug: "the-green-table-demo", rating: 4, comment: "Cozy neighborhood spot, great for a weeknight dinner." },
      { slug: "wok-and-roll-demo", rating: 4.5, comment: "The salted egg prawns are worth the trip alone." },
      { slug: "nonnas-kitchen-demo", rating: 3.5, comment: "Good risotto, a bit pricey for the portion." },
    ];
    tastedSeed.forEach(({ slug, rating, comment }) => {
      if (!isTried(slug)) toggleTried(slug);
      setTriedNote(slug, { rating, comment, photos: [] });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, hydrated]);

  const [bucket, setBucket] = useState<Bucket>("wishlist");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [drawer, setDrawer] = useState<DrawerState | null>(
    initialSlug ? { mode: "view", slug: initialSlug } : null,
  );
  const [query, setQuery] = useState("");
  // Wish List filters by cost (nothing's been tried yet, so price is the
  // only thing worth narrowing by); Tasted filters by your own rating and
  // cuisine instead, since those only mean something once you've actually
  // been.
  const [priceFilter, setPriceFilter] = useState<1 | 2 | 3 | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);

  const bucketSlugSet = useMemo(
    () => new Set(bucket === "wishlist" ? savedSlugs : triedSlugs),
    [bucket, savedSlugs, triedSlugs],
  );

  const bucketCafes = useMemo(
    () => cafes.filter((c) => bucketSlugSet.has(c.slug)),
    [cafes, bucketSlugSet],
  );

  const sortedCafes = useMemo(
    () =>
      bucketCafes
        // The illustrated map only knows Singapore's shape -- restaurants
        // logged from anywhere else stay list-only (Wish List/Tasted pages)
        // until real multi-country map support exists. Case/whitespace
        // normalized since Country is free text, not a fixed list.
        .filter((c) => c.country.trim().toLowerCase() === "singapore")
        .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || (b.rating ?? 0) - (a.rating ?? 0)),
    [bucketCafes],
  );

  const visibleSlugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = new Set<string>();
    for (const cafe of sortedCafes) {
      const nameHit = !q || cafe.name.toLowerCase().includes(q);
      const priceHit = bucket !== "wishlist" || priceFilter == null || cafe.priceTier === priceFilter;
      const personalRating = triedCafes[cafe.slug]?.rating;
      const ratingHit =
        bucket !== "tasted" || ratingFilter == null || (personalRating != null && Math.round(personalRating) === ratingFilter);
      const cuisineHit = bucket !== "tasted" || cuisineFilter == null || cafe.cuisine === cuisineFilter;
      if (nameHit && priceHit && ratingHit && cuisineHit) visible.add(cafe.slug);
    }
    return visible;
  }, [sortedCafes, query, bucket, priceFilter, ratingFilter, cuisineFilter, triedCafes]);

  const priceOptions = useMemo(
    () => Array.from(new Set(sortedCafes.map((c) => c.priceTier))).sort((a, b) => a - b),
    [sortedCafes],
  );
  const ratingOptions = useMemo(() => {
    const values = sortedCafes
      .map((c) => triedCafes[c.slug]?.rating)
      .filter((r): r is number => r != null)
      .map((r) => Math.round(r));
    return Array.from(new Set(values)).sort((a, b) => b - a);
  }, [sortedCafes, triedCafes]);
  const cuisineOptions = useMemo(
    () =>
      Array.from(new Set(sortedCafes.map((c) => c.cuisine).filter((c): c is string => !!c))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [sortedCafes],
  );

  // If the cafe an active filter was matching gets edited/un-tasted/removed,
  // its value can vanish from the options list entirely -- its chip
  // disappears, but without this the filter itself would silently keep
  // matching nothing with no visible chip left to explain why or clear it.
  useEffect(() => {
    if (priceFilter != null && !priceOptions.includes(priceFilter)) setPriceFilter(null);
  }, [priceOptions, priceFilter]);
  useEffect(() => {
    if (ratingFilter != null && !ratingOptions.includes(ratingFilter)) setRatingFilter(null);
  }, [ratingOptions, ratingFilter]);
  useEffect(() => {
    if (cuisineFilter != null && !cuisineOptions.includes(cuisineFilter)) setCuisineFilter(null);
  }, [cuisineOptions, cuisineFilter]);

  const filterGroups: FilterChipGroup[] = useMemo(() => {
    if (bucket === "wishlist") {
      if (priceOptions.length === 0) return [];
      return [
        {
          groupLabel: "Price",
          chips: priceOptions.map((tier) => ({
            label: "$".repeat(tier),
            active: priceFilter === tier,
            onClick: () => setPriceFilter((prev) => (prev === tier ? null : tier)),
          })),
        },
      ];
    }
    const groups: FilterChipGroup[] = [];
    if (ratingOptions.length > 0) {
      groups.push({
        groupLabel: "Rating",
        chips: ratingOptions.map((r) => ({
          label: `★${r}`,
          active: ratingFilter === r,
          onClick: () => setRatingFilter((prev) => (prev === r ? null : r)),
        })),
      });
    }
    if (cuisineOptions.length > 0) {
      groups.push({
        groupLabel: "Cuisine",
        chips: cuisineOptions.map((c) => ({
          label: c,
          active: cuisineFilter === c,
          onClick: () => setCuisineFilter((prev) => (prev === c ? null : c)),
        })),
      });
    }
    return groups;
  }, [bucket, priceOptions, ratingOptions, cuisineOptions, priceFilter, ratingFilter, cuisineFilter]);

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
    // A newly added restaurant always lands on the Wish List -- there's no
    // "add straight to Tasted" path, since you can't have tasted something
    // you're only just now entering into the app. Gated to "add" specifically
    // since this same handler also fires on "edit" saves, and a Tasted cafe
    // being edited must not get silently re-added to the Wish List too.
    if (drawer?.mode === "add" && !isSaved(shop.slug)) toggleSave(shop.slug);
    setSelectedSlug(shop.slug);
    setDrawer({ mode: "view", slug: shop.slug });
  }

  function handleRemoved() {
    setSelectedSlug(null);
    setDrawer(null);
  }

  function switchBucket(next: Bucket) {
    setBucket(next);
    setQuery("");
    setPriceFilter(null);
    setRatingFilter(null);
    setCuisineFilter(null);
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
              filterGroups={filterGroups}
            />

            <aside className="rail">
              <div className="rail-head">
                <p className="rail-label">Top ranked</p>
                {bucket === "wishlist" && (
                  <button type="button" className="btn btn-primary rail-add" onClick={openAdd}>
                    + Add restaurant
                  </button>
                )}
              </div>

              {hydrated && sortedCafes.length === 0 ? (
                <div className="rail-empty">
                  <p className="rail-empty-title">
                    {bucketCafes.length > 0
                      ? "No Singapore spots here yet."
                      : bucket === "wishlist"
                        ? "Your wish list is empty."
                        : "You haven't tasted any cafes yet."}
                  </p>
                  <p className="rail-empty-body">
                    {bucketCafes.length > 0
                      ? `The map only shows Singapore restaurants -- everything else on your ${bucketLabel} is on its page instead.`
                      : bucket === "wishlist"
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
                        selected={selectedSlug === cafe.slug}
                        onSelect={() => openView(cafe.slug)}
                        onMarkedTasted={() => openView(cafe.slug)}
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
