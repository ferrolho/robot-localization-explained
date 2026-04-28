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

/**
 * Trace a dashed ellipse outline as disconnected sub-paths. Caller still calls .stroke().
 * dashSegments / gapSegments count how many of the `totalSegments` slices are drawn vs skipped.
 */
export function dashedEllipse(
  g: Graphics,
  cx: number,
  cy: number,
  a: number,
  b: number,
  dashSegments = 2,
  gapSegments = 2,
  totalSegments = 80,
  phaseOffset = 0,
): void {
  const cycle = dashSegments + gapSegments;
  for (let i = 0; i < totalSegments; i++) {
    const phase = i % cycle;
    if (phase >= dashSegments) continue;
    const t0 = (2 * Math.PI * i) / totalSegments + phaseOffset;
    const t1 = (2 * Math.PI * (i + 1)) / totalSegments + phaseOffset;
    const x0 = cx + Math.cos(t0) * a;
    const y0 = cy + Math.sin(t0) * b;
    const x1 = cx + Math.cos(t1) * a;
    const y1 = cy + Math.sin(t1) * b;
    if (phase === 0) g.moveTo(x0, y0);
    g.lineTo(x1, y1);
  }
}
