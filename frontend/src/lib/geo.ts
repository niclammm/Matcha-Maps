import { MASK_COLS, MASK_ROWS } from "@/lib/map-mask";

/** Mainland Singapore with margin (Woodlands→Sentosa, Tuas→Changi), so
 * every realistic cafe address lands inside the padded interior below. */
export const SG_BOUNDS = { minLat: 1.16, maxLat: 1.47, minLng: 103.6, maxLng: 104.05 };

export type GridPoint = { x: number; y: number };

/** Projects a real lat/lng onto the dot-map's grid-unit coordinate space,
 * so any cafe — seed or newly added — gets a correct position automatically
 * with no per-cafe hand placement. */
export function projectToGrid(
  lat: number,
  lng: number,
  cols = MASK_COLS,
  rows = MASK_ROWS,
  padding = 0.08,
): GridPoint {
  const xNorm = (lng - SG_BOUNDS.minLng) / (SG_BOUNDS.maxLng - SG_BOUNDS.minLng);
  const yNorm = (lat - SG_BOUNDS.minLat) / (SG_BOUNDS.maxLat - SG_BOUNDS.minLat);
  const x = padding * cols + xNorm * (1 - 2 * padding) * cols;
  // invert: higher latitude (north) -> smaller row (top of the grid)
  const y = padding * rows + (1 - yNorm) * (1 - 2 * padding) * rows;
  return { x, y };
}

export function gridToPercent(point: GridPoint, cols = MASK_COLS, rows = MASK_ROWS) {
  return {
    left: `${(point.x / cols) * 100}%`,
    top: `${(point.y / rows) * 100}%`,
  };
}

export function isWithinSingapore(lat: number, lng: number): boolean {
  return (
    lat >= SG_BOUNDS.minLat &&
    lat <= SG_BOUNDS.maxLat &&
    lng >= SG_BOUNDS.minLng &&
    lng <= SG_BOUNDS.maxLng
  );
}
