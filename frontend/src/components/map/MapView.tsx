"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Shop } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

const markerIcon = L.divIcon({
  className: "matcha-marker",
  html: '<span class="matcha-marker-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FlyToSelected({ shop }: { shop: Shop | null }) {
  const map = useMap();

  useEffect(() => {
    if (!shop) return;
    map.flyTo([shop.location.lat, shop.location.lng], 15, { duration: 0.8 });
  }, [map, shop]);

  return null;
}

type MapViewProps = {
  cafes: Shop[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export function MapView({ cafes, selectedSlug, onSelect }: MapViewProps) {
  const selectedShop = cafes.find((cafe) => cafe.slug === selectedSlug) ?? null;

  return (
    <div className="map-view">
      <MapContainer center={SINGAPORE_CENTER} zoom={12} scrollWheelZoom className="map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyToSelected shop={selectedShop} />
        {cafes.map((cafe) => (
          <Marker
            key={cafe.id}
            position={[cafe.location.lat, cafe.location.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => onSelect(cafe.slug),
            }}
          >
            <Popup>
              <strong>{cafe.name}</strong>
              <br />
              {cafe.signatureDrink}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
