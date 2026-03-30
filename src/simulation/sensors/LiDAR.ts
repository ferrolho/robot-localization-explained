import { mat, type Mat } from '../../lib/matrix';
import type { RobotState } from '../types';
import type { Room } from '../Room';

/**
 * Simplified 2D LiDAR sensor model.
 * Casts N beams and triangulates position from range measurements.
 * Returns a simplified position measurement [px, py] (linear H).
 *
 * H matrix selects px and py from the state vector:
 *   H = [[1, 0, 0, 0, 0],
 *        [0, 1, 0, 0, 0]]
 */
export class LiDAR {
  readonly H: Mat;
  readonly R: Mat;

  readonly numBeams: number;
  private sigmaRange: number;
  private sigmaPosition: number;
  private room: Room;

  /** Last computed beam endpoints (for visualization). */
  lastBeams: { angle: number; distance: number }[] = [];

  constructor(room: Room, numBeams: number = 12, sigmaRange: number = 0.05) {
    this.room = room;
    this.numBeams = numBeams;
    this.sigmaRange = sigmaRange;

    // Position uncertainty after triangulation is larger than individual range noise
    this.sigmaPosition = sigmaRange * 2;

    // Observation matrix: picks out px and py from state
    this.H = mat(2, 5, [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
    ]);

    // Measurement noise covariance
    this.R = mat(2, 2, [
      this.sigmaPosition * this.sigmaPosition, 0,
      0, this.sigmaPosition * this.sigmaPosition,
    ]);
  }

  /** Get noisy position measurement from LiDAR ranges. Returns 2×1 vector. */
  read(truth: RobotState): Mat {
    this.lastBeams = [];

    // Cast beams and collect ranges
    const beamAngles: number[] = [];
    const ranges: number[] = [];

    for (let i = 0; i < this.numBeams; i++) {
      const angle = truth.theta + (2 * Math.PI * i) / this.numBeams;
      const trueRange = this.room.raycast(truth.px, truth.py, angle);
      const noisyRange = trueRange + this.gaussian() * this.sigmaRange;

      beamAngles.push(angle);
      ranges.push(Math.max(0.01, noisyRange));

      this.lastBeams.push({ angle, distance: trueRange });
    }

    // Simplified triangulation: use known wall positions to extract position.
    // With a rectangular room, opposite-beam pairs give position directly.
    // Here we just add noise to the true position (simplified model).
    return mat(2, 1, [
      truth.px + this.gaussian() * this.sigmaPosition,
      truth.py + this.gaussian() * this.sigmaPosition,
    ]);
  }

  private gaussian(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
