const TAU = Math.PI * 2;

type GridCell = { x: number; y: number };

export type ShapeGridOptions = {
  direction?: "right" | "left" | "up" | "down" | "diagonal";
  speed?: number;
  borderColor?: string;
  squareSize?: number;
  hoverFillColor?: string;
  hoverTrailAmount?: number;
  icons?: boolean;
  iconColor?: string;
  iconDensity?: number;
  iconSeed?: number;
};

function hashCell(col: number, row: number, seed: number): number {
  let h = (seed + col * 374761393 + row * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

function drawLeaf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  angle: number,
  alpha: number,
  color: string,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.5);
  ctx.quadraticCurveTo(size * 0.42, size * 0.08, 0, -size * 0.5);
  ctx.quadraticCurveTo(-size * 0.42, size * 0.08, 0, size * 0.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, size * 0.4);
  ctx.lineTo(0, -size * 0.4);
  ctx.stroke();
  ctx.restore();
}

function drawBowl(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  color: string,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.14, size * 0.46, size * 0.26, 0, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.04, size * 0.46, size * 0.13, 0, 0, TAU);
  ctx.stroke();
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + i * size * 0.13, cy - size * 0.12);
    ctx.lineTo(cx + i * size * 0.09, cy - size * 0.3);
    ctx.stroke();
  }
  ctx.restore();
}

export class ShapeGrid {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private direction: NonNullable<ShapeGridOptions["direction"]>;
  private speed: number;
  private borderColor: string;
  private squareSize: number;
  private hoverFillColor: string;
  private hoverTrailAmount: number;
  private iconsEnabled: boolean;
  private iconColor: string;
  private iconDensity: number;
  private iconSeed: number;
  private reducedMotion: boolean;
  private gridOffset = { x: 0, y: 0 };
  private hoveredCell: GridCell | null = null;
  private trailCells: GridCell[] = [];
  private cellOpacities = new Map<string, number>();
  private time = 0;
  private raf = 0;

  private readonly onResize = () => this.resize();
  private readonly onMouseMove = (e: MouseEvent) => this.handleMouseMove(e);
  private readonly onMouseLeave = () => this.handleMouseLeave();

  constructor(canvas: HTMLCanvasElement, opts: ShapeGridOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;

    this.direction = opts.direction ?? "right";
    this.speed = opts.speed ?? 1;
    this.borderColor = opts.borderColor ?? "#999";
    this.squareSize = opts.squareSize ?? 40;
    this.hoverFillColor = opts.hoverFillColor ?? "#222";
    this.hoverTrailAmount = opts.hoverTrailAmount ?? 0;

    this.iconsEnabled = !!opts.icons;
    this.iconColor = opts.iconColor ?? this.borderColor;
    this.iconDensity = opts.iconDensity ?? 0.05;
    this.iconSeed = opts.iconSeed ?? 1;

    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.addEventListener("resize", this.onResize);
    canvas.addEventListener("mousemove", this.onMouseMove);
    canvas.addEventListener("mouseleave", this.onMouseLeave);

    this.resize();
    this.tick();
  }

  destroy() {
    window.removeEventListener("resize", this.onResize);
    this.canvas.removeEventListener("mousemove", this.onMouseMove);
    this.canvas.removeEventListener("mouseleave", this.onMouseLeave);
    cancelAnimationFrame(this.raf);
  }

  private resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
  }

  private cellKey(col: number, row: number) {
    return `${col},${row}`;
  }

  private registerHover(col: number, row: number) {
    if (!this.hoveredCell || this.hoveredCell.x !== col || this.hoveredCell.y !== row) {
      if (this.hoveredCell && this.hoverTrailAmount > 0) {
        this.trailCells.unshift({ x: this.hoveredCell.x, y: this.hoveredCell.y });
        if (this.trailCells.length > this.hoverTrailAmount) {
          this.trailCells.length = this.hoverTrailAmount;
        }
      }
      this.hoveredCell = { x: col, y: row };
    }
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const s = this.squareSize;
    const offsetX = ((this.gridOffset.x % s) + s) % s;
    const offsetY = ((this.gridOffset.y % s) + s) % s;
    const col = Math.floor((mx - offsetX) / s);
    const row = Math.floor((my - offsetY) / s);
    this.registerHover(col, row);
  }

  private handleMouseLeave() {
    if (this.hoveredCell && this.hoverTrailAmount > 0) {
      this.trailCells.unshift({ x: this.hoveredCell.x, y: this.hoveredCell.y });
      if (this.trailCells.length > this.hoverTrailAmount) {
        this.trailCells.length = this.hoverTrailAmount;
      }
    }
    this.hoveredCell = null;
  }

  private updateOpacities() {
    const targets = new Map<string, number>();
    if (this.hoveredCell) {
      targets.set(this.cellKey(this.hoveredCell.x, this.hoveredCell.y), 1);
    }
    if (this.hoverTrailAmount > 0) {
      this.trailCells.forEach((t, i) => {
        const key = this.cellKey(t.x, t.y);
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
    if (!this.reducedMotion) {
      const s = Math.max(this.speed, 0.05);
      switch (this.direction) {
        case "right":
          this.gridOffset.x -= s;
          break;
        case "left":
          this.gridOffset.x += s;
          break;
        case "up":
          this.gridOffset.y += s;
          break;
        case "down":
          this.gridOffset.y -= s;
          break;
        case "diagonal":
          this.gridOffset.x -= s;
          this.gridOffset.y -= s;
          break;
      }
      this.time += 0.016;
    }
    this.updateOpacities();
    this.draw();
    this.raf = requestAnimationFrame(this.tick);
  };

  private draw() {
    const ctx = this.ctx;
    const canvas = this.canvas;
    const s = this.squareSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const offsetX = ((this.gridOffset.x % s) + s) % s;
    const offsetY = ((this.gridOffset.y % s) + s) % s;
    const cols = Math.ceil(canvas.width / s) + 3;
    const rows = Math.ceil(canvas.height / s) + 3;
    const pulse = 0.75 + Math.sin(this.time * 0.6) * 0.25;

    for (let col = -2; col < cols; col++) {
      for (let row = -2; row < rows; row++) {
        const sx = col * s + offsetX;
        const sy = row * s + offsetY;
        const key = this.cellKey(col, row);
        const alpha = this.cellOpacities.get(key);

        if (alpha) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = this.hoverFillColor;
          ctx.fillRect(sx, sy, s, s);
          ctx.globalAlpha = 1;
        }

        ctx.strokeStyle = this.borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, sy, s, s);

        if (this.iconsEnabled && !alpha) {
          const h = hashCell(col, row, this.iconSeed);
          if ((h % 1000) / 1000 < this.iconDensity) {
            const cx = sx + s / 2;
            const cy = sy + s / 2;
            const iconAlpha = (0.16 + ((h % 100) / 100) * 0.14) * pulse;
            const angle = ((hashCell(col, row, this.iconSeed + 7) % 360) / 360) * TAU;
            if (h % 2 === 0) drawLeaf(ctx, cx, cy, s * 0.55, angle, iconAlpha, this.iconColor);
            else drawBowl(ctx, cx, cy, s * 0.6, iconAlpha, this.iconColor);
          }
        }
      }
    }
  }
}
