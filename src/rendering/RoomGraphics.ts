import { Graphics, Container } from 'pixi.js';
import type { Room } from '../simulation/Room';

export class RoomGraphics {
  readonly container: Container;

  constructor(room: Room) {
    this.container = new Container();
    this.draw(room);
  }

  private draw(room: Room): void {
    const g = new Graphics();
    const hw = room.width / 2;
    const hh = room.height / 2;

    // Floor
    g.rect(-hw, -hh, room.width, room.height);
    g.fill({ color: 0x16213e });

    // Walls
    g.moveTo(-hw, -hh);
    g.lineTo(hw, -hh);
    g.lineTo(hw, hh);
    g.lineTo(-hw, hh);
    g.closePath();
    g.stroke({ color: 0x4a5568, width: 0.04 });

    this.container.addChild(g);
  }
}
