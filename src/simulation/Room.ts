import type { RoomConfig, Vec2 } from './types';

export interface LineSegment {
  x1: number; y1: number;
  x2: number; y2: number;
}

export class Room {
  readonly width: number;
  readonly height: number;
  readonly walls: LineSegment[];

  constructor(config: RoomConfig) {
    this.width = config.width;
    this.height = config.height;

    // Room centred at origin
    const hw = this.width / 2;
    const hh = this.height / 2;

    this.walls = [
      { x1: -hw, y1: -hh, x2:  hw, y2: -hh }, // bottom
      { x1:  hw, y1: -hh, x2:  hw, y2:  hh }, // right
      { x1:  hw, y1:  hh, x2: -hw, y2:  hh }, // top
      { x1: -hw, y1:  hh, x2: -hw, y2: -hh }, // left
    ];
  }

  isInside(px: number, py: number, margin: number = 0): boolean {
    const hw = this.width / 2 - margin;
    const hh = this.height / 2 - margin;
    return px >= -hw && px <= hw && py >= -hh && py <= hh;
  }

  clamp(pos: Vec2, margin: number = 0.05): Vec2 {
    const hw = this.width / 2 - margin;
    const hh = this.height / 2 - margin;
    return {
      x: Math.max(-hw, Math.min(hw, pos.x)),
      y: Math.max(-hh, Math.min(hh, pos.y)),
    };
  }

  /** Cast a ray from origin in direction angle, return distance to nearest wall. */
  raycast(ox: number, oy: number, angle: number): number {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    let minDist = Infinity;

    for (const wall of this.walls) {
      const t = this.raySegmentIntersect(ox, oy, dx, dy, wall);
      if (t !== null && t > 0 && t < minDist) {
        minDist = t;
      }
    }

    return minDist;
  }

  private raySegmentIntersect(
    ox: number, oy: number, dx: number, dy: number,
    seg: LineSegment
  ): number | null {
    const sx = seg.x2 - seg.x1;
    const sy = seg.y2 - seg.y1;
    const denom = dx * sy - dy * sx;
    if (Math.abs(denom) < 1e-10) return null;

    const t = ((seg.x1 - ox) * sy - (seg.y1 - oy) * sx) / denom;
    const u = ((seg.x1 - ox) * dy - (seg.y1 - oy) * dx) / denom;

    if (t >= 0 && u >= 0 && u <= 1) return t;
    return null;
  }
}
