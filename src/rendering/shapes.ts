import type { Graphics } from 'pixi.js';

const DEFAULT_SEGMENTS = 64;

/** Trace a circle on a Graphics context with enough segments to look smooth at any scale. */
export function smoothCircle(g: Graphics, cx: number, cy: number, r: number, segments = DEFAULT_SEGMENTS): void {
  const pts: number[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(cx + Math.cos(t) * r, cy + Math.sin(t) * r);
  }
  g.poly(pts, true);
}

/** Trace an ellipse on a Graphics context with enough segments to look smooth at any scale. */
export function smoothEllipse(g: Graphics, cx: number, cy: number, a: number, b: number, segments = DEFAULT_SEGMENTS): void {
  const pts: number[] = [];
  for (let i = 0; i < segments; i++) {
    const t = (2 * Math.PI * i) / segments;
    pts.push(cx + Math.cos(t) * a, cy + Math.sin(t) * b);
  }
  g.poly(pts, true);
}
