import { mat, type Mat } from '../../lib/matrix';
import type { RobotState } from '../types';

/**
 * IMU sensor model.
 * Measures velocity (v) and angular velocity (omega) with Gaussian noise.
 * Feeds into the KF CORRECTION step (not prediction).
 *
 * H matrix selects v and omega from the state vector:
 *   H = [[0, 0, 0, 1, 0],
 *        [0, 0, 0, 0, 1]]
 */
export class IMU {
  readonly H: Mat;
  readonly R: Mat;

  private sigmaV: number;
  private sigmaOmega: number;

  constructor(sigmaV: number = 0.1, sigmaOmega: number = 0.08) {
    this.sigmaV = sigmaV;
    this.sigmaOmega = sigmaOmega;

    // Observation matrix: picks out v and omega from state
    this.H = mat(2, 5, [
      0, 0, 0, 1, 0,
      0, 0, 0, 0, 1,
    ]);

    // Measurement noise covariance
    this.R = mat(2, 2, [
      sigmaV * sigmaV, 0,
      0, sigmaOmega * sigmaOmega,
    ]);
  }

  /** Get noisy IMU reading from true state. Returns 2×1 measurement vector. */
  read(truth: RobotState): Mat {
    return mat(2, 1, [
      truth.v + this.gaussian() * this.sigmaV,
      truth.omega + this.gaussian() * this.sigmaOmega,
    ]);
  }

  private gaussian(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
