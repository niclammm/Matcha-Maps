/** Mainland Singapore with margin (Woodlands→Sentosa, Tuas→Changi), so
 * every realistic cafe address is treated as valid. */
export const SG_BOUNDS = { minLat: 1.16, maxLat: 1.47, minLng: 103.6, maxLng: 104.05 };

export function isWithinSingapore(lat: number, lng: number): boolean {
  return (
    lat >= SG_BOUNDS.minLat &&
    lat <= SG_BOUNDS.maxLat &&
    lng >= SG_BOUNDS.minLng &&
    lng <= SG_BOUNDS.maxLng
  );
}
