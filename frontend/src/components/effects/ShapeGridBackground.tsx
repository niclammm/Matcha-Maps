"use client";

import { useEffect, useRef } from "react";
import { ShapeGrid } from "@/lib/shape-grid";

export function ShapeGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const grid = new ShapeGrid(canvas, {
      direction: "diagonal",
      speed: 0.25,
      squareSize: 36,
      borderColor: "rgba(120, 155, 98, 0.14)",
      hoverFillColor: "rgba(120, 155, 98, 0.14)",
      hoverTrailAmount: 6,
      icons: false,
    });

    return () => grid.destroy();
  }, []);

  return <canvas className="bg-grid" ref={canvasRef} aria-hidden="true" />;
}
