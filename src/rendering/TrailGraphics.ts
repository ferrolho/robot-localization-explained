import { Graphics, Container } from 'pixi.js';

const MAX_TRAIL_POINTS = 600;

export class TrailGraphics {
  readonly container: Container;
  private gfx: Graphics;
  private points: { x: number; y: number }[] = [];
  private color: number;

  constructor(color: number = 0x48bb78) {
    this.container = new Container();
    this.color = color;
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  addPoint(x: number, y: number): void {
    this.points.push({ x, y });
    if (this.points.length > MAX_TRAIL_POINTS) {
      this.points.shift();
    }
  }

  redraw(): void {
    this.gfx.clear();
    if (this.points.length < 2) return;

    this.gfx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      this.gfx.lineTo(this.points[i].x, this.points[i].y);
    }
    this.gfx.stroke({ color: this.color, width: 0.02, alpha: 0.6 });
  }

  clear(): void {
    this.points = [];
    this.gfx.clear();
  }
}
