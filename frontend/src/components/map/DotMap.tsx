"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MergedShop } from "@/lib/types";
import { DotMapField } from "@/lib/dot-map-field";
import { gridToPercent, projectToGrid } from "@/lib/geo";
import { DoodlePeople, DoodleTeapot } from "@/components/doodles/Doodles";
import { useSavedCafes } from "@/components/providers/SavedCafesProvider";

type DotMapProps = {
  cafes: MergedShop[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

export function DotMap({ cafes, selectedSlug, onSelect }: DotMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<DotMapField | null>(null);
  const [nearSlug, setNearSlug] = useState<string | null>(null);
  const { isSaved } = useSavedCafes();

  const points = useMemo(
    () => cafes.map((c) => ({ slug: c.slug, ...projectToGrid(c.location.lat, c.location.lng) })),
    [cafes],
  );

  const pinPositions = useMemo(
    () => new Map(points.map((p) => [p.slug, gridToPercent(p)])),
    [points],
  );

  const selectedPos = selectedSlug ? pinPositions.get(selectedSlug) : undefined;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const field = new DotMapField(canvas, {
      accentColor: "#4f6b43",
      hoverColor: "#789b62",
      mutedColor: "rgba(162, 142, 122, 0.34)",
      hoverTrailAmount: 6,
      nearRadius: 3,
      onNearestCafeChange: setNearSlug,
    });
    fieldRef.current = field;

    return () => {
      field.destroy();
      fieldRef.current = null;
    };
  }, []);

  useEffect(() => {
    fieldRef.current?.setCafePoints(points);
  }, [points]);

  return (
    <section className="dot-map-frame">
      <span className="washi-tape washi-tape--tan" aria-hidden="true" />
      <span className="washi-tape washi-tape--blue" aria-hidden="true" />
      <span className="dot-map-inset-border" aria-hidden="true" />

      <div className="dot-map-header">
        <span className="dot-map-title">Singapore</span>
        <span className="dot-map-count">
          {cafes.length} {cafes.length === 1 ? "cafe" : "cafes"} mapped
        </span>
      </div>

      <div className="dot-map-stage">
        <canvas ref={canvasRef} className="dot-map-canvas" aria-hidden="true" />

        {selectedPos && (
          <span
            className="dot-map-halo"
            style={{ left: selectedPos.left, top: selectedPos.top }}
            aria-hidden="true"
          />
        )}

        {cafes.map((cafe) => {
          const pos = pinPositions.get(cafe.slug);
          if (!pos) return null;
          const isSelected = selectedSlug === cafe.slug;
          const isNear = nearSlug === cafe.slug;
          const saved = isSaved(cafe.slug);
          return (
            <button
              key={cafe.id}
              type="button"
              className={`map-pin${isSelected ? " map-pin--selected" : ""}${isNear ? " map-pin--near" : ""}${cafe.isCustom ? " map-pin--custom" : ""}${saved ? " map-pin--saved" : ""}`}
              style={{ left: pos.left, top: pos.top }}
              onClick={() => onSelect(cafe.slug)}
              aria-label={cafe.name}
              aria-pressed={isSelected}
            >
              <span className="map-pin-pulse" aria-hidden="true" />
              <span className="map-pin-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="dot-map-footer">
        <div className="dot-map-doodles">
          <DoodleTeapot />
          <DoodlePeople />
        </div>
        <div className="dot-map-legend">
          <span className="dot-map-legend-item">
            <span className="dot-map-legend-swatch dot-map-legend-swatch--tasted" />
            Tasted &amp; rated
          </span>
          <span className="dot-map-legend-item">
            <span className="dot-map-legend-swatch dot-map-legend-swatch--list" />
            On the list
          </span>
        </div>
      </div>
    </section>
  );
}
