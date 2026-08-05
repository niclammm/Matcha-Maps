"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CafeCard } from "@/components/cards/CafeCard";
import { Nav } from "@/components/layout/Nav";
import { Topbar } from "@/components/layout/Topbar";
import { cafes } from "@/data/cafes";

const MapView = dynamic(() => import("@/components/map/MapView").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});

export default function MapPageClient() {
  const searchParams = useSearchParams();
  const initialSlug = searchParams.get("cafe");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);

  const sortedCafes = useMemo(
    () => [...cafes].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99) || b.rating - a.rating),
    [],
  );

  return (
    <>
      <Topbar />
      <main className="map-page">
        <div className="map-frame">
          <Nav active="cafes" />
          <div className="map-layout">
            <aside className="map-sidebar">
              <div className="map-sidebar-header">
                <h1>Explore Cafes</h1>
                <p>{cafes.length} matcha spots in Singapore</p>
              </div>
              <div className="map-cafe-list">
                {sortedCafes.map((cafe) => (
                  <CafeCard
                    key={cafe.id}
                    shop={cafe}
                    selected={selectedSlug === cafe.slug}
                    onSelect={() => setSelectedSlug(cafe.slug)}
                  />
                ))}
              </div>
            </aside>
            <MapView cafes={sortedCafes} selectedSlug={selectedSlug} onSelect={setSelectedSlug} />
          </div>
        </div>
      </main>
    </>
  );
}
