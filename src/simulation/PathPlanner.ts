import type { RobotState } from './types';
import type { Room } from './Room';

/**
 * Simple waypoint-following path planner.
 * Generates random waypoints inside the room and uses a proportional
 * controller to steer the robot toward each one.
 */
export class PathPlanner {
  waypoint: { x: number; y: number };
  private readonly speed: number;
  private readonly waypointMargin: number;

  /**
   * @param room Room geometry for generating waypoints within bounds
   * @param speed Forward speed command sent to the robot (m/s)
   * @param waypointMargin How close the robot must get before picking a new waypoint (metres)
   */
  constructor(
    private room: Room,
    speed: number = 0.5,
    waypointMargin: number = 0.3,
  ) {
    this.speed = speed;
    this.waypointMargin = waypointMargin;
    this.waypoint = this.randomWaypoint();
  }

  /** Compute commanded velocity to steer toward current waypoint. */
  getCommand(state: RobotState): { vCmd: number; omegaCmd: number } {
    const dx = this.waypoint.x - state.px;
    const dy = this.waypoint.y - state.py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Reached waypoint — pick a new one
    if (dist < this.waypointMargin) {
      this.waypoint = this.randomWaypoint();
      return this.getCommand(state);
    }

    // Desired heading toward waypoint
    const desiredTheta = Math.atan2(dy, dx);

    // Angle error (wrapped to [-pi, pi])
    let angleErr = desiredTheta - state.theta;
    angleErr = Math.atan2(Math.sin(angleErr), Math.cos(angleErr));

    // Proportional steering: slow down when turning sharply
    const turnGain = 3.0;
    const omegaCmd = turnGain * angleErr;
    const vCmd = this.speed * Math.max(0.2, 1 - Math.abs(angleErr) / Math.PI);

    return { vCmd, omegaCmd };
  }

  private randomWaypoint(): { x: number; y: number } {
    const margin = 0.4;
    const hw = this.room.width / 2 - margin;
    const hh = this.room.height / 2 - margin;
    return {
      x: (Math.random() * 2 - 1) * hw,
      y: (Math.random() * 2 - 1) * hh,
    };
  }

  reset(): void {
    this.waypoint = this.randomWaypoint();
  }
}
