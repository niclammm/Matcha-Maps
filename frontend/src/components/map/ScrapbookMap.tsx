"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { MergedShop } from "@/lib/types";

type GeoFeature = {
  type: "Feature";
  properties: { name: string };
  geometry: GeoJSON.Geometry;
};
type GeoFC = { type: "FeatureCollection"; features: GeoFeature[] };
type Geo = { sg: GeoFeature; neighbours: GeoFeature[] };

/** District labels placed by hand, away from the pin cluster. */
const AREA_LABELS: { name: string; lat: number; lng: number; anchor?: "start" | "middle" | "end" }[] = [
  { name: "Jurong East", lat: 1.3405, lng: 103.7436 },
  { name: "Orchard", lat: 1.326, lng: 103.8318 },
  { name: "Bugis", lat: 1.313, lng: 103.875, anchor: "start" },
  { name: "Tiong Bahru", lat: 1.2735, lng: 103.825, anchor: "end" },
  { name: "Chinatown", lat: 1.2745, lng: 103.85, anchor: "start" },
];

type PreviewState = { cafe: MergedShop; left: number; top: number };

type ScrapbookMapProps = {
  cafes: MergedShop[];
  selectedSlug: string | null;
  dimmedSlugs: Set<string>;
  onSelect: (slug: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  areas: string[];
  areaFilter: string | null;
  onAreaFilterToggle: (area: string) => void;
};

export function ScrapbookMap({
  cafes,
  selectedSlug,
  dimmedSlugs,
  onSelect,
  query,
  onQueryChange,
  areas,
  areaFilter,
  onAreaFilterToggle,
}: ScrapbookMapProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pinRefs = useRef(new Map<string, HTMLButtonElement>());
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  const [geo, setGeo] = useState<Geo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/singapore-geo.json")
      .then((r) => r.json())
      .then((fc: GeoFC) => {
        if (cancelled) return;
        const sg = fc.features.find((f) => f.properties.name === "Singapore");
        const neighbours = fc.features.filter((f) => f.properties.name !== "Singapore");
        if (!sg) throw new Error("Singapore feature missing from singapore-geo.json");
        setGeo({ sg, neighbours });
      })
      .catch(() => setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

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
      geo.sg as unknown as d3.GeoPermissibleObjects,
    );
    projectionRef.current = projection;
    const path = d3.geoPath(projection);

    const svg = d3.select(svgEl).attr("viewBox", `0 0 ${w} ${h}`);
    svg.selectAll("*").remove();

    // paper water: a flat wash, no roads, no tiles
    svg.append("rect").attr("width", w).attr("height", h).attr("fill", "rgba(220,233,237,.55)");

    // faint hatch across the water, drawn like pencil strokes
    const hatch = svg.append("g").attr("stroke", "rgba(120,158,173,.28)").attr("stroke-width", 1);
    for (let offset = -h; offset < w + h; offset += 26) {
      hatch.append("line").attr("x1", offset).attr("y1", 0).attr("x2", offset - h).attr("y2", h);
    }

    // neighbouring land, kept as pale silhouettes for the strait
    svg
      .append("g")
      .selectAll("path")
      .data(geo.neighbours)
      .join("path")
      .attr("d", (d) => path(d.geometry as unknown as d3.GeoPermissibleObjects))
      .attr("fill", "rgba(212,196,181,.22)")
      .attr("stroke", "rgba(107,88,72,.14)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3 4");

    // Singapore: the silhouette, cut out of cream paper
    const sgLayer = svg.append("g");
    sgLayer
      .append("path")
      .attr("d", path(geo.sg.geometry as unknown as d3.GeoPermissibleObjects))
      .attr("fill", "none")
      .attr("stroke", "rgba(107,88,72,.16)")
      .attr("stroke-width", 9)
      .attr("stroke-linejoin", "round");
    sgLayer
      .append("path")
      .attr("d", path(geo.sg.geometry as unknown as d3.GeoPermissibleObjects))
      .attr("fill", "var(--off-white)")
      .attr("stroke", "var(--matcha-dark)")
      .attr("stroke-width", 1.6)
      .attr("stroke-linejoin", "round");

    // sparse dot grid inside the island — the scrapbook texture, no streets
    const dots = svg.append("g").attr("fill", "rgba(162,142,122,.4)");
    const step = 13;
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        const ll = projection.invert?.([x, y]);
        if (ll && d3.geoContains(geo.sg.geometry as unknown as d3.GeoPermissibleObjects, ll)) {
          dots.append("circle").attr("cx", x).attr("cy", y).attr("r", 1.2);
        }
      }
    }

    const leaderLayer = svg.append("g");
    const labelLayer = svg.append("g");

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

    // ---- pins: nudge each pill clear of its neighbours, alternating up/down ----
    const centroidPx = projection(d3.geoCentroid(geo.sg.geometry as unknown as d3.GeoPermissibleObjects));
    type PinNode = { slug: string; el: HTMLButtonElement; x: number; y: number; tx: number; ty: number; w: number; h: number };
    const nodes: PinNode[] = [];
    for (const cafe of cafes) {
      const el = pinRefs.current.get(cafe.slug);
      const projected = projection([cafe.location.lng, cafe.location.lat]);
      if (!el || !projected) continue;
      const [x, y] = projected;
      nodes.push({ slug: cafe.slug, el, x, y, tx: x, ty: y, w: el.offsetWidth || 130, h: el.offsetHeight || 44 });
    }

    const placed: PinNode[] = [];
    const free = (n: PinNode) =>
      !placed.some(
        (p) => Math.abs(p.x - n.x) < (p.w + n.w) / 2 + 8 && Math.abs(p.y - n.y) < (p.h + n.h) / 2 + 8,
      );
    const stepY = 34;
    const toward = [1, 2, 3, 4, 5].map((k) => k * stepY);
    nodes
      .slice()
      .sort((a, b) => a.y - b.y)
      .forEach((n) => {
        const inward = centroidPx && n.ty > centroidPx[1] ? -1 : 1;
        const offsets: [number, number][] = [[0, 0]];
        toward.forEach((d) => {
          offsets.push([0, d * inward], [0, -d * inward], [-46, d * inward * 0.6], [46, d * inward * 0.6]);
        });
        for (const [dx, dy] of offsets) {
          n.x = n.tx + dx;
          n.y = n.ty + dy;
          if (n.y - n.h < 2 || n.y > h - 4) continue;
          if (free(n)) break;
        }
        placed.push(n);
      });

    const pinRects: { x: number; y: number; w: number; h: number }[] = [];
    nodes.forEach((n) => {
      n.x = Math.max(n.w / 2 + 4, Math.min(n.x, w - n.w / 2 - 4));
      n.y = Math.max(n.h + 4, Math.min(n.y, h - 6));
      n.el.style.left = `${n.x}px`;
      n.el.style.top = `${n.y}px`;
      pinRects.push({ x: n.x - n.w / 2, y: n.y - n.h, w: n.w, h: n.h + 4 });

      const displaced = Math.abs(n.y - n.ty) > 6 || Math.abs(n.x - n.tx) > 6;
      if (displaced) {
        const startY = n.ty < n.y - n.h ? n.y - n.h : n.y;
        leaderLayer
          .append("line")
          .attr("x1", n.x)
          .attr("y1", startY)
          .attr("x2", n.tx)
          .attr("y2", n.ty)
          .attr("stroke", "rgba(107,88,72,.45)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2 3");
      }
      leaderLayer
        .append("circle")
        .attr("cx", n.tx)
        .attr("cy", n.ty)
        .attr("r", 3.2)
        .attr("fill", "var(--saved-marker)")
        .attr("stroke", "var(--off-white)")
        .attr("stroke-width", 1.5);
    });

    // ---- area labels: any that would sit under a pin is nudged clear, or dropped ----
    const boxes = pinRects.slice();
    AREA_LABELS.forEach((l) => {
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
        .attr("fill", "rgba(107,88,72,.62)")
        .attr("stroke", "var(--off-white)")
        .attr("stroke-width", 3.5)
        .attr("paint-order", "stroke")
        .attr("stroke-linejoin", "round")
        .attr("font-family", "'Work Sans', sans-serif")
        .attr("font-size", 10)
        .attr("letter-spacing", ".16em")
        .text(l.name.toUpperCase());
    });
  }, [geo, cafes]);

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
    const px = parseFloat(el.style.left) || 0;
    const py = parseFloat(el.style.top) || 0;
    const previewW = 250;
    const previewH = 150;
    let left = px - previewW / 2;
    let top = py - previewH - 54;
    left = Math.max(8, Math.min(left, stage.clientWidth - previewW - 8));
    if (top < 8) top = py + 14;
    setPreview({ cafe, left, top });
  };
  const hidePreview = () => setPreview(null);

  const paperSub = areaFilter ? areaFilter.toLowerCase() : "tasted & mapped";

  return (
    <section className="map-paper">
      <span className="washi-tape washi-tape--tan" aria-hidden="true" />
      <span className="washi-tape washi-tape--blue" aria-hidden="true" />

      <div className="paper-header">
        <span className="paper-title">Singapore</span>
        <span className="paper-sub">{paperSub}</span>
        <label className="map-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Search cafes or areas"
            placeholder="Search cafes or areas"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </label>
      </div>

      <div className="chips">
        {areas.map((area) => (
          <button
            key={area}
            type="button"
            className={`chip${areaFilter === area ? " is-on" : ""}`}
            onClick={() => onAreaFilterToggle(area)}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="map-stage" ref={stageRef}>
        <svg ref={svgRef} className="map-svg" aria-label="Map of Singapore with matcha cafes" />

        {!geo && !loadError && <div className="map-stage-loading">sketching the island…</div>}
        {loadError && <div className="map-stage-loading">map failed to load</div>}

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
                className={`pin${isSelected ? " is-selected" : ""}${isDim ? " is-dim" : ""}`}
                aria-label={cafe.name}
                aria-pressed={isSelected}
                onClick={() => onSelect(cafe.slug)}
                onMouseEnter={() => showPreview(cafe)}
                onMouseLeave={hidePreview}
              >
                <div className="pin-disc">
                  <span>{cafe.name}</span>
                  <span className="pin-rating">
                    {cafe.rating != null ? (
                      <>
                        <span className="star">★</span>
                        {cafe.rating.toFixed(1)}
                      </>
                    ) : (
                      "New"
                    )}
                  </span>
                </div>
                <div className="pin-tip" />
                {cafe.signatureDrink && <span className="pin-name">{cafe.signatureDrink}</span>}
              </button>
            );
          })}

        {preview && (
          <div className="preview is-on" style={{ left: preview.left, top: preview.top }}>
            {preview.cafe.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview.cafe.coverImage} alt="" />
            )}
            <div className="preview-body">
              <div className="preview-top">
                {preview.cafe.rank ? `#${preview.cafe.rank} · ` : ""}
                {preview.cafe.area}
              </div>
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
      </div>
      <span className="map-attr">coastline: Natural Earth</span>
    </section>
  );
}
