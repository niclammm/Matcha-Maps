/**
 * Vanilla-JS port of the React Bits <ShapeGrid /> component (square variant only),
 * plus a "matcha" mode that scatters sparse line-art bowl/leaf icons across the grid.
 */
(() => {
  const TAU = Math.PI * 2;

  function hashCell(col, row, seed) {
    let h = (seed + col * 374761393 + row * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h = (h ^ (h >>> 16)) >>> 0;
    return h;
  }

  function drawLeaf(ctx, cx, cy, size, angle, alpha, color) {
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

  function drawBowl(ctx, cx, cy, size, alpha, color) {
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

  class ShapeGrid {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');

      this.direction = opts.direction || 'right';
      this.speed = opts.speed ?? 1;
      this.borderColor = opts.borderColor || '#999';
      this.squareSize = opts.squareSize || 40;
      this.hoverFillColor = opts.hoverFillColor || '#222';
      this.hoverTrailAmount = opts.hoverTrailAmount || 0;

      this.iconsEnabled = !!opts.icons;
      this.iconColor = opts.iconColor || this.borderColor;
      this.iconDensity = opts.iconDensity ?? 0.05;
      this.iconSeed = opts.iconSeed ?? 1;

      this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      this.gridOffset = { x: 0, y: 0 };
      this.hoveredCell = null;
      this.trailCells = [];
      this.cellOpacities = new Map();
      this.time = 0;

      this._resize = this._resize.bind(this);
      this._onMouseMove = this._onMouseMove.bind(this);
      this._onMouseLeave = this._onMouseLeave.bind(this);
      this._tick = this._tick.bind(this);

      window.addEventListener('resize', this._resize);
      canvas.addEventListener('mousemove', this._onMouseMove);
      canvas.addEventListener('mouseleave', this._onMouseLeave);

      this._resize();
      this._raf = requestAnimationFrame(this._tick);
    }

    destroy() {
      window.removeEventListener('resize', this._resize);
      this.canvas.removeEventListener('mousemove', this._onMouseMove);
      this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
      cancelAnimationFrame(this._raf);
    }

    _resize() {
      const c = this.canvas;
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
    }

    _cellKey(col, row) {
      return col + ',' + row;
    }

    _registerHover(col, row) {
      if (!this.hoveredCell || this.hoveredCell.x !== col || this.hoveredCell.y !== row) {
        if (this.hoveredCell && this.hoverTrailAmount > 0) {
          this.trailCells.unshift({ x: this.hoveredCell.x, y: this.hoveredCell.y });
          if (this.trailCells.length > this.hoverTrailAmount) this.trailCells.length = this.hoverTrailAmount;
        }
        this.hoveredCell = { x: col, y: row };
      }
    }

    _onMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const s = this.squareSize;
      const offsetX = ((this.gridOffset.x % s) + s) % s;
      const offsetY = ((this.gridOffset.y % s) + s) % s;
      const col = Math.floor((mx - offsetX) / s);
      const row = Math.floor((my - offsetY) / s);
      this._registerHover(col, row);
    }

    _onMouseLeave() {
      if (this.hoveredCell && this.hoverTrailAmount > 0) {
        this.trailCells.unshift({ x: this.hoveredCell.x, y: this.hoveredCell.y });
        if (this.trailCells.length > this.hoverTrailAmount) this.trailCells.length = this.hoverTrailAmount;
      }
      this.hoveredCell = null;
    }

    _updateOpacities() {
      const targets = new Map();
      if (this.hoveredCell) targets.set(this._cellKey(this.hoveredCell.x, this.hoveredCell.y), 1);
      if (this.hoverTrailAmount > 0) {
        this.trailCells.forEach((t, i) => {
          const key = this._cellKey(t.x, t.y);
          if (!targets.has(key)) targets.set(key, (this.trailCells.length - i) / (this.trailCells.length + 1));
        });
      }
      for (const key of targets.keys()) {
        if (!this.cellOpacities.has(key)) this.cellOpacities.set(key, 0);
      }
      for (const [key, val] of this.cellOpacities) {
        const target = targets.get(key) || 0;
        const next = val + (target - val) * 0.15;
        if (next < 0.005) this.cellOpacities.delete(key);
        else this.cellOpacities.set(key, next);
      }
    }

    _tick() {
      if (!this.reducedMotion) {
        const s = Math.max(this.speed, 0.05);
        switch (this.direction) {
          case 'right': this.gridOffset.x -= s; break;
          case 'left': this.gridOffset.x += s; break;
          case 'up': this.gridOffset.y += s; break;
          case 'down': this.gridOffset.y -= s; break;
          case 'diagonal': this.gridOffset.x -= s; this.gridOffset.y -= s; break;
        }
        this.time += 0.016;
      }
      this._updateOpacities();
      this._draw();
      this._raf = requestAnimationFrame(this._tick);
    }

    _draw() {
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
          const key = this._cellKey(col, row);
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

  window.ShapeGrid = ShapeGrid;
})();
