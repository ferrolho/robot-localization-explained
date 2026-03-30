import { Graphics, Container } from 'pixi.js';

const SIZE = 0.06;

/** Renders the target waypoint as a small cross marker. */
export class WaypointGraphics {
  readonly container: Container;
  private gfx: Graphics;

  constructor() {
    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
    this.draw();
  }

  update(x: number, y: number): void {
    this.container.x = x;
    this.container.y = y;
  }

  private draw(): void {
    this.gfx.moveTo(-SIZE, -SIZE);
    this.gfx.lineTo(SIZE, SIZE);
    this.gfx.moveTo(SIZE, -SIZE);
    this.gfx.lineTo(-SIZE, SIZE);
    this.gfx.stroke({ color: 0xffffff, width: 0.02, alpha: 0.6 });
  }
}
