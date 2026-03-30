import { Graphics, Container } from 'pixi.js';
import type { RobotState } from '../simulation/types';

const ROBOT_RADIUS = 0.15; // metres

export class RobotGraphics {
  readonly container: Container;
  private body: Graphics;
  private heading: Graphics;

  constructor(color: number = 0x48bb78, alpha: number = 1) {
    this.container = new Container();

    // Body circle
    this.body = new Graphics();
    this.body.circle(0, 0, ROBOT_RADIUS);
    this.body.fill({ color, alpha });
    this.body.stroke({ color: 0xffffff, width: 0.01, alpha: 0.5 });
    this.container.addChild(this.body);

    // Heading indicator (line from centre to edge)
    this.heading = new Graphics();
    this.heading.moveTo(0, 0);
    this.heading.lineTo(ROBOT_RADIUS, 0);
    this.heading.stroke({ color: 0xffffff, width: 0.02 });
    this.container.addChild(this.heading);
  }

  update(state: RobotState): void {
    this.container.x = state.px;
    this.container.y = state.py;
    this.container.rotation = state.theta;
  }
}
