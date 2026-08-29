import { Suspense } from "react";
import MapPageClient from "./MapPageClient";

export default function MapPage() {
  return (
    <Suspense fallback={<div className="map-loading">Loading map…</div>}>
      <MapPageClient />
    </Suspense>
  );
}
