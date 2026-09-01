"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { MergedShop } from "@/lib/types";
import { WishListMark } from "@/components/brand/WishListMark";
import { TastedMark } from "@/components/brand/TastedMark";
import { findMapCountry } from "@/lib/countries";

type GeoFeature = {
  type: "Feature";
  properties: { name: string };
  geometry: GeoJSON.Geometry;
};
type GeoFC = { type: "FeatureCollection"; features: GeoFeature[] };
type Geo = { target: GeoFeature; neighbours: GeoFeature[] };

type PreviewState = { cafe: MergedShop; left: number; top: number };

/** One filter dimension's worth of ready-made chip buttons -- callers (which
 * know what bucket/data the chips actually mean) build these directly, so
 * this component stays a plain presentational renderer. */
export type FilterChipGroup = {
  groupLabel: string;
  chips: { label: string; active: boolean; onClick: () => void }[];
};

type ScrapbookMapProps = {
  cafes: MergedShop[];
  selectedSlug: string | null;
  dimmedSlugs: Set<string>;
  onSelect: (slug: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  filterGroups?: FilterChipGroup[];
  showWishlist: boolean;
  showTasted: boolean;
  /** Which country's outline/pins to draw -- must match a MAP_COUNTRIES
   * entry in @/lib/countries for the map to actually render anything. */
  country: string;
};

export function ScrapbookMap({
  cafes,
  selectedSlug,
  dimmedSlugs,
  onSelect,
  query,
  onQueryChange,
  filterGroups = [],
  showWishlist,
  showTasted,
  country,
}: ScrapbookMapProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomSurfaceRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const pinPositionsRef = useRef(new Map<string, [number, number]>());
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const zoomTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const [geo, setGeo] = useState<Geo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGeo(null);
    setLoadError(false);

    const mapCountry = findMapCountry(country);
    if (!mapCountry) {
      setLoadError(true);
      return;
    }

    const targetName = country.trim().toLowerCase();
    fetch(mapCountry.geoFile)
      .then((r) => r.json())
      .then((fc: GeoFC) => {
        if (cancelled) return;
        const target = fc.features.find((f) => f.properties.name.toLowerCase() === targetName);
        const neighbours = fc.features.filter((f) => f.properties.name.toLowerCase() !== targetName);
        if (!target) throw new Error(`${country} feature missing from ${mapCountry.geoFile}`);
        setGeo({ target, neighbours });
      })
      .catch(() => {
        // A rejection/throw from an already-abandoned country switch (e.g.
        // Singapore's fetch failing late after the user already switched to
        // Japan, whose fetch already succeeded) must not flip the error
        // overlay on over a map that's already loaded correctly.
        if (cancelled) return;
        setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [country]);

  const draw = useCallback(() => {
    const stage = stageRef.current;
    const svgEl = svgRef.current;
    if (!stage || !svgEl || !geo) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;

    const projection = d3.geoMercator().fitExtent(
      [
        [w * 0.06, h * 0.14],
        [w * 0.94, h * 0.86],
      ],
      geo.target as unknown as d3.GeoPermissibleObjects,
    );
    projectionRef.current = projection;
    const path = d3.geoPath(projection);

    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${w} ${h}`);
    svg.selectAll("*").remove();

    // paper water: a flat wash, no roads, no tiles
    svg.append("rect").attr("width", w).attr("height", h).attr("fill", "rgba(224,235,238,.42)");

    // faint hatch across the water, drawn like pencil strokes
    const hatch = svg.append("g").attr("stroke", "rgba(120,158,173,.16)").attr("stroke-width", 0.8);
    for (let offset = -h; offset < w + h; offset += 38) {
      hatch.append("line").attr("x1", offset).attr("y1", 0).attr("x2", offset - h).attr("y2", h);
    }

    const mapLayer = svg.append("g").attr("class", "map-content-layer");

    // neighbouring land, kept as pale silhouettes for the strait
    mapLayer
      .append("g")
      .selectAll("path")
      .data(geo.neighbours)
      .join("path")
      .attr("d", (d) => path(d.geometry as unknown as d3.GeoPermissibleObjects))
      .attr("fill", "rgba(212,196,181,.22)")
      .attr("stroke", "rgba(107,88,72,.14)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 4");

    // the target country's silhouette, cut out of cream paper
    const targetLayer = mapLayer.append("g");
    targetLayer
      .append("path")
      .attr("d", path(geo.target.geometry as unknown as d3.GeoPermissibleObjects))
      .attr("fill", "none")
      .attr("stroke", "rgba(107,88,72,.16)")
      .attr("stroke-width", 9)
      .attr("stroke-linejoin", "round");
    targetLayer
      .append("path")
      .attr("d", path(geo.target.geometry as unknown as d3.GeoPermissibleObjects))
      .attr("fill", "var(--off-white)")
      .attr("stroke", "var(--matcha-dark)")
      .attr("stroke-width", 1.6)
      .attr("stroke-linejoin", "round");

    // sparse dot grid inside the island(s) — the scrapbook texture, no streets
    const dots = mapLayer.append("g").attr("fill", "rgba(162,142,122,.4)");
    const step = 13;
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        const ll = projection.invert?.([x, y]);
        if (ll && d3.geoContains(geo.target.geometry as unknown as d3.GeoPermissibleObjects, ll)) {
          dots.append("circle").attr("cx", x).attr("cy", y).attr("r", 1.2);
        }
      }
    }

    const labelLayer = mapLayer.append("g");

    // compass, drawn small in a corner
    const cx = w - 46;
    const cy = 40;
    const compass = svg.append("g").attr("stroke", "rgba(107,88,72,.45)").attr("fill", "none");
    compass.append("circle").attr("cx", cx).attr("cy", cy).attr("r", 15).attr("stroke-dasharray", "2 3");
    compass
      .append("line")
      .attr("x1", cx)
      .attr("y1", cy + 9)
      .attr("x2", cx)
      .attr("y2", cy - 11)
      .attr("stroke-width", 1.2);
    svg
      .append("text")
      .attr("x", cx)
      .attr("y", cy - 15)
      .attr("text-anchor", "middle")
      .attr("font-family", "'Work Sans', sans-serif")
      .attr("font-size", 9)
      .attr("fill", "rgba(107,88,72,.6)")
      .text("N");

    // ---- pins: keep each sticker on its true projected coordinate.
    // Zoom supplies the separation that the old large word pills needed
    // collision displacement for, so the marker no longer appears to lie
    // about a cafe's location. ----
    type PinNode = { slug: string; el: HTMLButtonElement; x: number; y: number; tx: number; ty: number; w: number; h: number };
    const nodes: PinNode[] = [];
    for (const cafe of cafes) {
      const el = pinRefs.current.get(cafe.slug);
      const projected = projection([cafe.location.lng, cafe.location.lat]);
      if (!el || !projected) continue;
      const [x, y] = projected;
      nodes.push({ slug: cafe.slug, el, x, y, tx: x, ty: y, w: el.offsetWidth || 130, h: el.offsetHeight || 44 });
    }

    const pinRects: { x: number; y: number; w: number; h: number }[] = [];
    pinPositionsRef.current.clear();
    const zoomTransform = zoomTransformRef.current;
    nodes.forEach((n) => {
      n.x = Math.max(n.w / 2 + 4, Math.min(n.x, w - n.w / 2 - 4));
      n.y = Math.max(n.h + 4, Math.min(n.y, h - 6));
      pinPositionsRef.current.set(n.slug, [n.x, n.y]);
      const [screenX, screenY] = zoomTransform.apply([n.x, n.y]);
      n.el.style.left = `${screenX}px`;
      n.el.style.top = `${screenY}px`;
      pinRects.push({ x: n.x - n.w / 2, y: n.y - n.h, w: n.w, h: n.h + 4 });
    });

    // ---- area labels: any that would sit under a pin is nudged clear, or dropped ----
    const boxes = pinRects.slice();
    const areaLabels = findMapCountry(country)?.areaLabels ?? [];
    areaLabels.forEach((l) => {
      const projected = projection([l.lng, l.lat]);
      if (!projected) return;
      const [px, py] = projected;
      const anchor = l.anchor ?? "middle";
      const lw = l.name.length * 8.2;
      const lh = 14;
      const candidates: [number, number][] = [
        [0, 0],
        [0, -22],
        [0, 22],
        [-28, -14],
        [28, -14],
        [-28, 16],
        [28, 16],
        [0, -30],
        [0, 30],
      ];
      let pos: [number, number] | null = null;
      for (const [dx, dy] of candidates) {
        const box = {
          x: (anchor === "start" ? px : anchor === "end" ? px - lw : px - lw / 2) + dx,
          y: py + dy - lh,
          w: lw,
          h: lh,
        };
        const collides = boxes.some(
          (b) => box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y,
        );
        if (!collides) {
          pos = [px + dx, py + dy];
          boxes.push(box);
          break;
        }
      }
      if (!pos) return;
      labelLayer
        .append("text")
        .attr("x", pos[0])
        .attr("y", pos[1])
        .attr("text-anchor", anchor)
        .attr("fill", "rgba(107,88,72,.48)")
        .attr("stroke", "var(--off-white)")
        .attr("stroke-width", 3)
        .attr("paint-order", "stroke")
        .attr("stroke-linejoin", "round")
        .attr("font-family", "'Work Sans', sans-serif")
        .attr("font-size", 9)
        .attr("letter-spacing", ".16em")
        .text(l.name.toUpperCase());
    });
    mapLayer.attr("transform", zoomTransform.toString());
  }, [geo, cafes, country]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !geo) return;

    const zoom = d3
      .zoom<HTMLDivElement, unknown>()
      .scaleExtent([1, 4])
      .translateExtent([
        [0, 0],
        [stage.clientWidth, stage.clientHeight],
      ])
      .filter((event) => !(event.target as Element).closest(".pin, .map-zoom-controls"))
      .on("zoom", (event) => {
        const transform = event.transform as d3.ZoomTransform;
        zoomTransformRef.current = transform;
        d3.select(svgRef.current).select<SVGGElement>(".map-content-layer").attr("transform", transform.toString());
        pinPositionsRef.current.forEach(([x, y], slug) => {
          const pin = pinRefs.current.get(slug);
          if (!pin) return;
          const [screenX, screenY] = transform.apply([x, y]);
          pin.style.left = `${screenX}px`;
          pin.style.top = `${screenY}px`;
        });
        setPreview(null);
      });

    zoomBehaviorRef.current = zoom;
    zoomTransformRef.current = d3.zoomIdentity;
    const selection = d3.select(stage);
    selection.call(zoom);
    selection.call(zoom.transform, d3.zoomIdentity);

    return () => {
      selection.on(".zoom", null);
      zoomBehaviorRef.current = null;
    };
  }, [geo, country]);

  const zoomBy = (factor: number) => {
    const stage = stageRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!stage || !zoom) return;
    d3.select(stage).call(zoom.scaleBy, factor);
  };

  const resetZoom = () => {
    const stage = stageRef.current;
    const zoom = zoomBehaviorRef.current;
    if (!stage || !zoom) return;
    d3.select(stage).call(zoom.transform, d3.zoomIdentity);
  };

  useEffect(() => {
    if (!geo || !stageRef.current) return;
    // draw() rebuilds the whole SVG (island/water/dot-texture/labels/pin
    // placement), which is too heavy to run synchronously on every single
    // ResizeObserver callback a window drag can fire in quick succession.
    // Coalesce to one draw per animation frame; the observer's guaranteed
    // initial callback on observe() covers the first paint too.
    let rafId = 0;
    const scheduleDraw = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(draw);
    };
    const ro = new ResizeObserver(scheduleDraw);
    ro.observe(stageRef.current);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [geo, draw]);

  const showPreview = (cafe: MergedShop) => {
    const el = pinRefs.current.get(cafe.slug);
    const stage = stageRef.current;
    if (!el || !stage) return;
    const stageRect = stage.getBoundingClientRect();
    const pinRect = el.getBoundingClientRect();
    const px = pinRect.left - stageRect.left + pinRect.width / 2;
    const py = pinRect.bottom - stageRect.top;
    const previewW = 250;
    const previewH = 150;
    let left = px - previewW / 2;
    let top = py - previewH - 54;
    left = Math.max(8, Math.min(left, stage.clientWidth - previewW - 8));
    if (top < 8) top = py + 14;
    setPreview({ cafe, left, top });
  };
  const hidePreview = () => setPreview(null);

  return (
    <section className="map-paper">
      <span className="washi-tape washi-tape--tan" aria-hidden="true" />
      <span className="washi-tape washi-tape--blue" aria-hidden="true" />

      <div className="paper-header">
        <span className="paper-title">{country}</span>
        <span className="paper-sub">tasted &amp; mapped</span>
        <label className="map-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search cafes"
            placeholder="Search cafes"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </label>
      </div>

      {filterGroups.map((group) => (
        <div
          className="chips filter-chip-group"
          key={group.groupLabel}
          role="group"
          aria-label={group.groupLabel}
        >
          <span className="filter-chip-group-label">{group.groupLabel}</span>
          {group.chips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={`chip${chip.active ? " is-on" : ""}`}
              onClick={chip.onClick}
            >
              {chip.label}
            </button>
          ))}
        </div>
      ))}

      <div className="map-stage" ref={stageRef}>
        <div className="map-zoom-surface" ref={zoomSurfaceRef}>
          <svg ref={svgRef} className="map-svg" aria-label={`Map of ${country} with matcha cafes`} />

          {geo &&
            cafes.map((cafe) => {
              const isSelected = selectedSlug === cafe.slug;
              const isDim = dimmedSlugs.has(cafe.slug);
              return (
                <button
                  key={cafe.id}
                  type="button"
                  ref={(el) => {
                    if (el) pinRefs.current.set(cafe.slug, el);
                    else pinRefs.current.delete(cafe.slug);
                  }}
                  className={`pin${cafe.status === "tasted" ? " pin--tasted" : ""}${isSelected ? " is-selected" : ""}${isDim ? " is-dim" : ""}`}
                  aria-label={cafe.name}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(cafe.slug)}
                  onMouseEnter={() => showPreview(cafe)}
                  onMouseLeave={hidePreview}
                >
                  <div className="pin-disc" aria-hidden="true">
                    {cafe.status === "tasted" ? (
                      <TastedMark size={24} decorative />
                    ) : (
                      <WishListMark size={38} decorative />
                    )}
                  </div>
                  <div className="pin-tip" />
                </button>
              );
            })}
        </div>

        {!geo && !loadError && <div className="map-stage-loading">sketching the island…</div>}
        {loadError && <div className="map-stage-loading">map failed to load</div>}

        {preview && (
          <div className="preview is-on" style={{ left: preview.left, top: preview.top }}>
            {preview.cafe.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.cafe.coverImage} alt="" />
            )}
            <div className="preview-body">
              {preview.cafe.rank && <div className="preview-top">{`#${preview.cafe.rank}`}</div>}
              <h4 className="preview-name">{preview.cafe.name}</h4>
              {preview.cafe.signatureDrink && <p className="preview-dish">{preview.cafe.signatureDrink}</p>}
              <div className="preview-rating">
                {preview.cafe.rating != null ? (
                  <>
                    <span className="star">★</span> {preview.cafe.rating.toFixed(1)} ·{" "}
                    {preview.cafe.reviewCount} reviews
                  </>
                ) : (
                  "Not yet rated"
                )}
              </div>
            </div>
          </div>
        )}

        {geo && (
          <>
            <div className="bucket-badge">
              {showWishlist && <WishListMark size={26} decorative />}
              {showTasted && <TastedMark size={15} decorative />}
              <span>
                {showWishlist && showTasted
                  ? "Showing wish list and tasted"
                  : showTasted
                    ? "Showing what you've tasted"
                    : "Showing your wish list"}
              </span>
            </div>
            <div className="map-zoom-controls" aria-label="Map zoom controls">
              <button type="button" className="map-zoom-control" onClick={() => zoomBy(1.5)} aria-label="Zoom in">
                +
              </button>
              <button type="button" className="map-zoom-control map-zoom-reset" onClick={resetZoom}>
                Reset
              </button>
              <button type="button" className="map-zoom-control" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out">
                −
              </button>
            </div>
          </>
        )}
      </div>
      <span className="map-attr">coastline: Natural Earth</span>
    </section>
  );
}
