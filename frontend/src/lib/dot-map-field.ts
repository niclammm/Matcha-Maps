import { MASK, MASK_COLS } from "@/lib/map-mask";

export type DotMapPoint = { x: number; y: number; slug: string };

export type DotMapFieldOptions = {
  accentColor?: string;
  hoverColor?: string;
  mutedColor?: string;
  hoverTrailAmount?: number;
  /** Grid-unit radius within which a cafe point counts as near the cursor. */
  nearRadius?: number;
  onNearestCafeChange?: (slug: string | null) => void;
};

type Cell = { col: number; row: number };
type BaseColor = "accent" | "accentFaded" | "muted";

/**
 * Canvas engine for the abstract dot-art map. Adapted from ShapeGrid
 * (the homepage cursor-following background grid): native mouse
 * listeners plus an eased opacity map, driven by a requestAnimationFrame
 * loop rather than React state, so recoloring hundreds of dots on every
 * mousemove never touches the React render cycle at all.
 *
 * The genuinely new part (the mockup only has click-to-select): each
 * tick, the cell nearest the cursor is checked against every cafe point,
 * and onNearestCafeChange fires when the nearest cafe changes -- this is
 * what drives the pin-highlight-on-hover interaction.
 */
export class DotMapField {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private listenTarget: HTMLElement;
  private accentColor: string;
  private hoverColor: string;
  private mutedColor: string;
  private hoverTrailAmount: number;
  private nearRadius: number;
  private onNearestCafeChange?: (slug: string | null) => void;

  private reducedMotion: boolean;
  private cellSize = 10;
  private cells: Cell[] = [];
  private baseColors = new Map<string, BaseColor>();
  private points: DotMapPoint[] = [];
  private hoveredCell: Cell | null = null;
  private trailCells: Cell[] = [];
  private cellOpacities = new Map<string, number>();
  private nearestSlug: string | null = null;
  private time = 0;
  private raf = 0;

  private readonly onResize = () => this.resize();
  private readonly onMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private readonly onMouseLeave = () => this.handleMouseLeave();

  constructor(canvas: HTMLCanvasElement, opts: DotMapFieldOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    // Cafe pin buttons are real DOM elements layered on top of the canvas
    // at the exact positions a user would hover to trigger the "near"
    // glow. Listening on the canvas itself means hovering directly over a
    // pin -- the moment that matters most -- never reaches this listener,
    // since the pin intercepts the event first. Listening on the parent
    // instead still gets the mousemove via normal event bubbling.
    this.listenTarget = canvas.parentElement ?? canvas;

    this.accentColor = opts.accentColor ?? "#4f6b43";
    this.hoverColor = opts.hoverColor ?? "#789b62";
    this.mutedColor = opts.mutedColor ?? "rgba(162, 142, 122, 0.34)";
    this.hoverTrailAmount = opts.hoverTrailAmount ?? 6;
    this.nearRadius = opts.nearRadius ?? 3;
    this.onNearestCafeChange = opts.onNearestCafeChange;

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.cells = [];
    for (let row = 0; row < MASK.length; row++) {
      const line = MASK[row];
      for (let col = 0; col < MASK_COLS; col++) {
        if (line[col] === "#") this.cells.push({ col, row });
      }
    }

    window.addEventListener("resize", this.onResize);
    this.listenTarget.addEventListener("mousemove", this.onMouseMove);
    this.listenTarget.addEventListener("mouseleave", this.onMouseLeave);

    this.resize();
    this.tick();
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    this.listenTarget.removeEventListener("mousemove", this.onMouseMove);
    this.listenTarget.removeEventListener("mouseleave", this.onMouseLeave);
    cancelAnimationFrame(this.raf);
  }

  /** Called whenever the cafe list changes (add/remove/hydrate) -- updates
   * both the static glow-near-cafes base coloring and the hover-proximity
   * check, without recreating the canvas. */
  setCafePoints(points: DotMapPoint[]) {
    this.points = points;
    this.recomputeBaseColors();
  }

  private recomputeBaseColors() {
    this.baseColors.clear();
    for (const cell of this.cells) {
      let nearest = Infinity;
      for (const p of this.points) {
        const d = Math.hypot(p.x - cell.col, p.y - (cell.row + 1));
        if (d < nearest) nearest = d;
      }
      const key = this.cellKey(cell.col, cell.row);
      this.baseColors.set(key, nearest < 2.1 ? "accent" : nearest < 4.4 ? "accentFaded" : "muted");
    }
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.cellSize = this.canvas.width / MASK_COLS;
  }

  private cellKey(col: number, row: number) {
    return `${col},${row}`;
  }

  private cellToGrid(col: number, row: number): { x: number; y: number } {
    return { x: col, y: row + 1 };
  }

  private registerHover(col: number, row: number) {
    if (!this.hoveredCell || this.hoveredCell.col !== col || this.hoveredCell.row !== row) {
      if (this.hoveredCell && this.hoverTrailAmount > 0) {
        this.trailCells.unshift({ col: this.hoveredCell.col, row: this.hoveredCell.row });
        if (this.trailCells.length > this.hoverTrailAmount) {
          this.trailCells.length = this.hoverTrailAmount;
        }
      }
      this.hoveredCell = { col, row };
      this.updateNearestCafe(col, row);
    }
  }

  private updateNearestCafe(col: number, row: number) {
    if (!this.onNearestCafeChange) return;
    const { x, y } = this.cellToGrid(col, row);
    let nearestSlug: string | null = null;
    let nearestDist = Infinity;
    for (const p of this.points) {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < nearestDist) {
        nearestDist = d;
        nearestSlug = p.slug;
      }
    }
    const withinRadius = nearestDist <= this.nearRadius ? nearestSlug : null;
    if (withinRadius !== this.nearestSlug) {
      this.nearestSlug = withinRadius;
      this.onNearestCafeChange(withinRadius);
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const col = Math.floor(mx / this.cellSize);
    const row = Math.floor(my / this.cellSize);
    this.registerHover(col, row);
  }

  private handleMouseLeave() {
    if (this.hoveredCell && this.hoverTrailAmount > 0) {
      this.trailCells.unshift({ col: this.hoveredCell.col, row: this.hoveredCell.row });
      if (this.trailCells.length > this.hoverTrailAmount) {
        this.trailCells.length = this.hoverTrailAmount;
      }
    }
    this.hoveredCell = null;
    if (this.nearestSlug !== null) {
      this.nearestSlug = null;
      this.onNearestCafeChange?.(null);
    }
  }

  private updateOpacities() {
    const targets = new Map<string, number>();
    if (this.hoveredCell) {
      targets.set(this.cellKey(this.hoveredCell.col, this.hoveredCell.row), 1);
    }
    if (this.hoverTrailAmount > 0) {
      this.trailCells.forEach((t, i) => {
        const key = this.cellKey(t.col, t.row);
        if (!targets.has(key)) {
          targets.set(key, (this.trailCells.length - i) / (this.trailCells.length + 1));
        }
      });
    }
    for (const key of targets.keys()) {
      if (!this.cellOpacities.has(key)) this.cellOpacities.set(key, 0);
    }
    for (const [key, val] of this.cellOpacities) {
      const target = targets.get(key) ?? 0;
      const next = val + (target - val) * 0.15;
      if (next < 0.005) this.cellOpacities.delete(key);
      else this.cellOpacities.set(key, next);
    }
  }

  private tick = () => {
    if (!this.reducedMotion) this.time += 0.016;
    this.updateOpacities();
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  private draw() {
    const ctx = this.ctx;
    const s = this.cellSize;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const pulse = 0.85 + Math.sin(this.time * 0.6) * 0.15;

    for (const cell of this.cells) {
      const cx = cell.col * s + s / 2;
      const cy = cell.row * s + s / 2;
      const radius = s * 0.42;
      const key = this.cellKey(cell.col, cell.row);
      const base = this.baseColors.get(key) ?? "muted";
      const hoverAlpha = this.cellOpacities.get(key);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      if (base === "accent") {
        ctx.globalAlpha = pulse;
        ctx.fillStyle = this.accentColor;
      } else if (base === "accentFaded") {
        ctx.globalAlpha = 0.4 * pulse;
        ctx.fillStyle = this.accentColor;
      } else {
        ctx.globalAlpha = 1;
        ctx.fillStyle = this.mutedColor;
      }
      ctx.fill();
      ctx.globalAlpha = 1;

      if (hoverAlpha) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.15, 0, Math.PI * 2);
        ctx.globalAlpha = hoverAlpha;
        ctx.fillStyle = this.hoverColor;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
}
