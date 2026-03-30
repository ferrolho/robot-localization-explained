import { Graphics, Container } from 'pixi.js';
import { smoothCircle } from './shapes';

const HIT_RADIUS = 0.015;

export class LiDARGraphics {
  readonly container: Container;
  private rays: Graphics;
  private points: Graphics;

  showRays = false;

  constructor() {
    this.container = new Container();
    this.rays = new Graphics();
    this.points = new Graphics();
    this.container.addChild(this.rays);
    this.container.addChild(this.points);
  }

  update(
    px: number, py: number,
    beams: { angle: number; distance: number }[],
  ): void {
    this.rays.clear();
    this.points.clear();

    for (const beam of beams) {
      const ex = px + Math.cos(beam.angle) * beam.distance;
      const ey = py + Math.sin(beam.angle) * beam.distance;

      if (this.showRays) {
        this.rays.moveTo(px, py);
        this.rays.lineTo(ex, ey);
      }

      smoothCircle(this.points, ex, ey, HIT_RADIUS, 8);
    }

    if (this.showRays) {
      this.rays.stroke({ color: 0xe53e3e, width: 0.01, alpha: 0.4 });
    }
    this.points.fill({ color: 0xe53e3e, alpha: 0.7 });
  }

  clear(): void {
    this.rays.clear();
    this.points.clear();
  }
}
