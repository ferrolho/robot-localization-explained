import type { RobotState } from './types';
import type { Room } from './Room';

/**
 * Ground truth robot vacuum using unicycle kinematics.
 * This is the "real" robot — no noise, no estimation.
 */
export class RobotVacuum {
  state: RobotState;

  constructor(px: number = 0, py: number = 0, theta: number = 0) {
    this.state = { px, py, theta, v: 0, omega: 0 };
  }

  /** Propagate state forward by dt using unicycle model. */
  step(dt: number, vCmd: number, omegaCmd: number, room: Room): void {
    this.state.v = vCmd;
    this.state.omega = omegaCmd;

    this.state.px += this.state.v * Math.cos(this.state.theta) * dt;
    this.state.py += this.state.v * Math.sin(this.state.theta) * dt;
    this.state.theta += this.state.omega * dt;

    // Normalise angle to [-pi, pi]
    this.state.theta = Math.atan2(
      Math.sin(this.state.theta),
      Math.cos(this.state.theta)
    );

    // Clamp to room bounds
    const clamped = room.clamp({ x: this.state.px, y: this.state.py });
    this.state.px = clamped.x;
    this.state.py = clamped.y;
  }

  reset(px: number = 0, py: number = 0, theta: number = 0): void {
    this.state = { px, py, theta, v: 0, omega: 0 };
  }
}
