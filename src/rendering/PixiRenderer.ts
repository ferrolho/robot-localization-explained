import { Application, Container } from 'pixi.js';
import type { Room } from '../simulation/Room';

/**
 * Manages the PixiJS application and world↔screen coordinate transform.
 * World: origin at room centre, x-right, y-up (standard maths).
 * Screen: origin at canvas top-left, y-down (PixiJS default).
 */
export class PixiRenderer {
  readonly app: Application;
  readonly worldContainer: Container;

  private _scale = 100; // pixels per metre
  private _offsetX = 0;
  private _offsetY = 0;

  constructor() {
    this.app = new Application();
    this.worldContainer = new Container();
  }

  async init(container: HTMLElement, room: Room): Promise<void> {
    await this.app.init({
      background: 0x1a1a2e,
      resizeTo: container,
      antialias: true,
    });
    container.appendChild(this.app.canvas);

    this.app.stage.addChild(this.worldContainer);
    this.updateTransform(room);

    // Handle resize
    const observer = new ResizeObserver(() => this.updateTransform(room));
    observer.observe(container);
  }

  private updateTransform(room: Room): void {
    const canvasW = this.app.screen.width;
    const canvasH = this.app.screen.height;

    // Fit the room with some padding
    const padFrac = 0.9;
    const scaleX = (canvasW * padFrac) / room.width;
    const scaleY = (canvasH * padFrac) / room.height;
    this._scale = Math.min(scaleX, scaleY);

    this._offsetX = canvasW / 2;
    this._offsetY = canvasH / 2;

    this.worldContainer.x = this._offsetX;
    this.worldContainer.y = this._offsetY;
    this.worldContainer.scale.set(this._scale, -this._scale); // y-flip
  }

  /** Convert world coordinates to screen pixels. */
  worldToScreen(wx: number, wy: number): { x: number; y: number } {
    return {
      x: this._offsetX + wx * this._scale,
      y: this._offsetY - wy * this._scale,
    };
  }

  get scale(): number {
    return this._scale;
  }

  destroy(): void {
    this.app.destroy(true);
  }
}
