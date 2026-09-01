"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CafeCard } from "@/components/cards/CafeCard";
import { CafeDrawer } from "@/components/map/CafeDrawer";
import { ScrapbookMap, type FilterChipGroup } from "@/components/map/ScrapbookMap";
import { WishListMark } from "@/components/brand/WishListMark";
import { TastedMark } from "@/components/brand/TastedMark";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { useCafes } from "@/components/providers/CafesProvider";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";
import { useTriedCafes } from "@/components/providers/TriedCafesProvider";
import { MAP_COUNTRIES } from "@/lib/countries";
import type { MergedShop } from "@/lib/types";

type DrawerState = { mode: "view" | "add" | "edit"; slug: string | null };

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("cafe");
  const { cafes, hydrated: cafesHydrated } = useCafes();
  const { savedSlugs, hydrated: savedHydrated } = useSavedCafes();
  const { triedSlugs, triedCafes, hydrated: triedHydrated } = useTriedCafes();
  const hydrated = cafesHydrated && savedHydrated && triedHydrated;

  const [showWishlist, setShowWishlist] = useState(true);
  const [showTasted, setShowTasted] = useState(true);
  const [country, setCountry] = useState<string>(MAP_COUNTRIES[0].name);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);
  const [drawer, setDrawer] = useState<DrawerState | null>(
    initialSlug ? { mode: "view", slug: initialSlug } : null,
  );
  const [query, setQuery] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const countrySelectRef = useRef<HTMLDivElement>(null);
  // Wish List filters by cost (nothing's been tried yet, so price is the
  // only thing worth narrowing by); Tasted filters by your own rating and
  // cuisine instead, since those only mean something once you've actually
  // been.
  const [priceFilter, setPriceFilter] = useState<1 | 2 | 3 | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null);

  const bucketCafes = useMemo(
    () =>
      cafes.filter(
        (c) => (showWishlist && c.status === "wishlist") || (showTasted && c.status === "tasted"),
      ),
    [cafes, showWishlist, showTasted],
  );

  const sortedCafes = useMemo(
    () =>
      bucketCafes
        // The illustrated map only knows the selected country's shape --
        // restaurants logged from anywhere else stay list-only (Wish
        // List/Tasted pages) until they get their own map entry too.
        // Case/whitespace normalized since Country is free text, not a
        // fixed list.
        .filter((c) => c.country.trim().toLowerCase() === country.trim().toLowerCase())
        .sort((a, b) => {
          if (showWishlist && showTasted) {
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
          }
          return (a.rank ?? 99) - (b.rank ?? 99) || (b.rating ?? 0) - (a.rating ?? 0);
        }),
    [bucketCafes, country, showWishlist, showTasted],
  );

  const visibleSlugs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = new Set<string>();
    for (const cafe of sortedCafes) {
      const nameHit = !q || cafe.name.toLowerCase().includes(q);
      const isWish = cafe.status === "wishlist";
      const isTriedCafe = cafe.status === "tasted";
      const priceHit = !isWish || priceFilter == null || cafe.priceTier === priceFilter;
      const personalRating = triedCafes[cafe.slug]?.rating;
      const ratingHit =
        !isTriedCafe || ratingFilter == null || (personalRating != null && Math.round(personalRating) === ratingFilter);
      const cuisineHit = !isTriedCafe || cuisineFilter == null || cafe.cuisine === cuisineFilter;
      if (nameHit && priceHit && ratingHit && cuisineHit) visible.add(cafe.slug);
    }
    return visible;
  }, [sortedCafes, query, priceFilter, ratingFilter, cuisineFilter, triedCafes]);

  const priceOptions = useMemo(
    () =>
      Array.from(new Set(sortedCafes.filter((c) => c.status === "wishlist").map((c) => c.priceTier))).sort(
        (a, b) => a - b,
      ),
    [sortedCafes],
  );
  const ratingOptions = useMemo(() => {
    const values = sortedCafes
      .filter((c) => c.status === "tasted")
      .map((c) => triedCafes[c.slug]?.rating)
      .filter((r): r is number => r != null)
      .map((r) => Math.round(r));
    return Array.from(new Set(values)).sort((a, b) => b - a);
  }, [sortedCafes, triedCafes]);
  const cuisineOptions = useMemo(
    () =>
      Array.from(
        new Set(sortedCafes.filter((c) => c.status === "tasted").map((c) => c.cuisine).filter((c): c is string => !!c)),
      ).sort((a, b) => a.localeCompare(b)),
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
    const groups: FilterChipGroup[] = [];
    if (showWishlist && priceOptions.length > 0) {
      groups.push({
        groupLabel: "Price",
        chips: priceOptions.map((tier) => ({
          label: "$".repeat(tier),
          active: priceFilter === tier,
          onClick: () => setPriceFilter((prev) => (prev === tier ? null : tier)),
        })),
      });
    }
    if (showTasted && ratingOptions.length > 0) {
      groups.push({
        groupLabel: "Rating",
        chips: ratingOptions.map((r) => ({
          label: `★${r}`,
          active: ratingFilter === r,
          onClick: () => setRatingFilter((prev) => (prev === r ? null : r)),
        })),
      });
    }
    if (showTasted && cuisineOptions.length > 0) {
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
  }, [showWishlist, showTasted, priceOptions, ratingOptions, cuisineOptions, priceFilter, ratingFilter, cuisineFilter]);

  const dimmedSlugs = useMemo(
    () => new Set(sortedCafes.filter((c) => !visibleSlugs.has(c.slug)).map((c) => c.slug)),
    [sortedCafes, visibleSlugs],
  );

  const averageRating = useMemo(() => {
    if (!showTasted || showWishlist) return null;
    const rated = sortedCafes
      .map((c) => triedCafes[c.slug]?.rating)
      .filter((r): r is number => r != null);
    if (rated.length === 0) return null;
    return rated.reduce((sum, r) => sum + r, 0) / rated.length;
  }, [showTasted, showWishlist, sortedCafes, triedCafes]);

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
    // Wishlisting a newly added restaurant is CafeDrawer's own job now
    // (addCafe(input, "wishlist")) -- doing it here too used to race a
    // stale `cafes` snapshot and silently no-op. See CafesProvider.addCafe.
    setSelectedSlug(shop.slug);
    setDrawer({ mode: "view", slug: shop.slug });
  }

  function handleRemoved() {
    setSelectedSlug(null);
    setDrawer(null);
  }

  function clearMapFilters() {
    setQuery("");
    setPriceFilter(null);
    setRatingFilter(null);
    setCuisineFilter(null);
  }

  function toggleWishlist() {
    if (showWishlist && !showTasted) return;
    setShowWishlist((prev) => !prev);
    clearMapFilters();
  }

  function toggleTasted() {
    if (showTasted && !showWishlist) return;
    setShowTasted((prev) => !prev);
    clearMapFilters();
  }

  function switchCountry(next: string) {
    setCountry(next);
    setCountryOpen(false);
    setQuery("");
    setPriceFilter(null);
    setRatingFilter(null);
    setCuisineFilter(null);
  }

  useEffect(() => {
    if (!countryOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!countrySelectRef.current?.contains(event.target as Node)) {
        setCountryOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setCountryOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [countryOpen]);

  const shownCount = visibleSlugs.size;
  const countCopy =
    showWishlist && showTasted
      ? `${shownCount} ${shownCount === 1 ? "spot" : "spots"} mapped`
      : showWishlist
        ? `${shownCount} ${shownCount === 1 ? "spot" : "spots"} on your wish list`
        : `${shownCount} ${shownCount === 1 ? "spot" : "spots"} on your tasted list`;
  const emptyTitle = bucketCafes.length > 0
    ? `No ${country} spots here yet.`
    : showWishlist && showTasted
      ? "Nothing on the map yet."
      : showWishlist
        ? "Your wish list is empty."
        : "You haven't tasted any cafes yet.";
  const emptyBody = bucketCafes.length > 0
    ? `The map only shows ${country} restaurants -- everything else stays on its list page.`
    : showWishlist && showTasted
      ? "Add a restaurant or mark one tasted to pin it here."
      : showWishlist
        ? "Open a cafe and tap the glass icon to add it to your wish list."
        : "Open a cafe and mark it tasted once you've tried it.";

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
                {hydrated ? countCopy : "Loading cafes…"}
              </span>
              {showTasted && !showWishlist && averageRating != null && (
                <>
                  <span className="stat-sep" aria-hidden="true" />
                  <span>★ {averageRating.toFixed(1)} average rating</span>
                </>
              )}
            </div>
            <div className="map-head-selectors">
              <div className="country-select" ref={countrySelectRef}>
                <span>Country</span>
                <div className="country-select-pill">
                  <button
                    type="button"
                    className="country-select-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={countryOpen}
                    onClick={() => setCountryOpen((open) => !open)}
                  >
                    {country}
                  </button>
                  <span className="country-select-mark" aria-hidden="true">
                    {MAP_COUNTRIES.find((mapCountry) => mapCountry.name === country)?.mark}
                  </span>
                  {countryOpen && (
                    <ul className="country-select-menu" role="listbox">
                      {MAP_COUNTRIES.map((mapCountry) => (
                        <li key={mapCountry.name} role="none">
                          <button
                            type="button"
                            role="option"
                            aria-selected={mapCountry.name === country}
                            className={mapCountry.name === country ? "is-selected" : undefined}
                            onClick={() => switchCountry(mapCountry.name)}
                          >
                            {mapCountry.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div className="bucket-tabs">
                <button
                  type="button"
                  className={`bucket-tab${showWishlist ? " is-on" : " is-off"}`}
                  aria-pressed={showWishlist}
                  onClick={toggleWishlist}
                >
                  <WishListMark size={52} animated={showWishlist} decorative className="bucket-tab-mark" />
                  <span className="bucket-tab-copy">
                    <span className="bucket-tab-label">Wish List</span>
                    <span className="bucket-tab-meta">{savedSlugs.length} to go</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`bucket-tab${showTasted ? " is-on" : " is-off"}`}
                  aria-pressed={showTasted}
                  onClick={toggleTasted}
                >
                  <TastedMark size={34} animated={showTasted} decorative className="bucket-tab-mark" />
                  <span className="bucket-tab-copy">
                    <span className="bucket-tab-label">Tasted</span>
                    <span className="bucket-tab-meta">{triedSlugs.length} logged</span>
                  </span>
                </button>
              </div>
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
              showWishlist={showWishlist}
              showTasted={showTasted}
              country={country}
            />

            <aside className="rail">
              <div className="rail-head">
                <p className="rail-label">{showWishlist && showTasted ? "A to Z" : "Top ranked"}</p>
                {showWishlist && (
                  <button type="button" className="btn btn-primary rail-add" onClick={openAdd}>
                    + Add restaurant
                  </button>
                )}
              </div>

              {hydrated && sortedCafes.length === 0 ? (
                <div className="rail-empty">
                  <p className="rail-empty-title">{emptyTitle}</p>
                  <p className="rail-empty-body">{emptyBody}</p>
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
                  On the wish list
                </span>
                <span className="legend-item">
                  <span className="legend-swatch" style={{ background: "var(--tasted-gold)" }} />
                  Already tasted
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
