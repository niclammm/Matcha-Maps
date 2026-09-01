export type AreaLabel = { name: string; lat: number; lng: number; anchor?: "start" | "middle" | "end" };

export type MapCountry = {
  /** Matches `Shop.country` free text, case-insensitively. */
  name: string;
  /** Small food mark shown in the country selector. */
  mark: string;
  /** Static GeoJSON asset under public/, generated via
   * scripts/generate-country-geo.mjs. */
  geoFile: string;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  /** District/city labels placed by hand on the map, away from the pin
   * cluster -- purely decorative, empty is fine for a country without a
   * curated set yet. */
  areaLabels: AreaLabel[];
};

/** Countries with a real interactive map (an outline + pins). Any other
 * free-text Shop.country value is still valid data -- it just stays
 * list-only (Wish List/Tasted) until it gets an entry here, the same
 * incremental path Singapore-only -> Singapore+Japan already followed. */
export const MAP_COUNTRIES: MapCountry[] = [
  {
    name: "Singapore",
    mark: "🦀",
    geoFile: "/singapore-geo.json",
    // Mainland Singapore with margin (Woodlands->Sentosa, Tuas->Changi), so
    // every realistic cafe address is treated as valid.
    bounds: { minLat: 1.16, maxLat: 1.47, minLng: 103.6, maxLng: 104.05 },
    areaLabels: [
      { name: "Jurong East", lat: 1.3405, lng: 103.7436 },
      { name: "Orchard", lat: 1.326, lng: 103.8318 },
      { name: "Bugis", lat: 1.313, lng: 103.875, anchor: "start" },
      { name: "Tiong Bahru", lat: 1.2735, lng: 103.825, anchor: "end" },
      { name: "Chinatown", lat: 1.2745, lng: 103.85, anchor: "start" },
    ],
  },
  {
    name: "Japan",
    mark: "🍡",
    geoFile: "/japan-geo.json",
    // Okinawa to Hokkaido, with margin -- Japan's own span is far wider
    // than Singapore's, hence the much looser box.
    bounds: { minLat: 24, maxLat: 46, minLng: 122, maxLng: 146 },
    areaLabels: [
      { name: "Tokyo", lat: 35.6762, lng: 139.6503, anchor: "start" },
      { name: "Osaka", lat: 34.6937, lng: 135.5023, anchor: "end" },
      { name: "Kyoto", lat: 35.0116, lng: 135.7681 },
      { name: "Fukuoka", lat: 33.5904, lng: 130.4017, anchor: "end" },
      { name: "Sapporo", lat: 43.0618, lng: 141.3545 },
    ],
  },
];

export function findMapCountry(name: string): MapCountry | undefined {
  const normalized = name.trim().toLowerCase();
  return MAP_COUNTRIES.find((c) => c.name.toLowerCase() === normalized);
}

/** Best-effort reverse lookup for a coordinate pair -- used to auto-fill
 * Country from a Google Maps link's @lat,lng, which never carries address
 * text alongside it. Only ever resolves to a map-enabled country; anything
 * else is left for manual entry rather than guessed. */
export function detectCountryFromCoords(lat: number, lng: number): string | null {
  const match = MAP_COUNTRIES.find(
    (c) => lat >= c.bounds.minLat && lat <= c.bounds.maxLat && lng >= c.bounds.minLng && lng <= c.bounds.maxLng,
  );
  return match?.name ?? null;
}

/** Best-effort keyword match against an address string -- used when a
 * Google Maps link's `?q=name,address` form gives text but no coordinates.
 * Deliberately simple (a straight substring check, first match in
 * MAP_COUNTRIES order wins -- not position-in-string): Google's own address
 * formatting reliably ends international addresses with the country name,
 * and Singapore addresses already end with "Singapore <postal code>" today,
 * and the place name (which could otherwise contain a false-positive
 * mention of the other country) is already split off into a separate field
 * before this ever sees the string. Good enough for two countries; would
 * need an actual rightmost-match check before this scales much further. */
export function detectCountryFromAddress(address: string): string | null {
  const lower = address.toLowerCase();
  const match = MAP_COUNTRIES.find((c) => lower.includes(c.name.toLowerCase()));
  return match?.name ?? null;
}
