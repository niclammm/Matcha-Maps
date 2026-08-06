"use client";

import Link from "next/link";
import type { Shop } from "@/lib/types";
import { SaveCafeButton } from "@/components/save/SaveCafeButton";

type MapMarkerPopupProps = {
  shop: Shop;
};

export function MapMarkerPopup({ shop }: MapMarkerPopupProps) {
  return (
    <div className="map-marker-popup">
      <div className="map-marker-popup-header">
        <div>
          <strong>{shop.name}</strong>
          <p className="map-marker-popup-signature">{shop.signatureDrink}</p>
        </div>
        <SaveCafeButton slug={shop.slug} cafeName={shop.name} size="sm" />
      </div>
      <Link href={`/map?cafe=${shop.slug}`} className="map-marker-popup-link">
        View on map
      </Link>
    </div>
  );
}
