import { Graphics, Container } from 'pixi.js';

export class LiDARGraphics {
  readonly container: Container;
  private gfx: Graphics;

  constructor() {
    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  update(
    px: number, py: number,
    beams: { angle: number; distance: number }[],
  ): void {
    this.gfx.clear();

    for (const beam of beams) {
      const ex = px + Math.cos(beam.angle) * beam.distance;
      const ey = py + Math.sin(beam.angle) * beam.distance;

      this.gfx.moveTo(px, py);
      this.gfx.lineTo(ex, ey);
    }
    this.gfx.stroke({ color: 0xe53e3e, width: 0.01, alpha: 0.4 });
  }

  clear(): void {
    this.gfx.clear();
  }
}
