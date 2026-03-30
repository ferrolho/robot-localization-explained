import { mat, type Mat } from '../../lib/matrix';
import type { RobotState } from '../types';

/**
 * MPU-6050 IMU sensor model (raw gyroscope + accelerometer).
 *
 * Gyroscope measures angular velocity with low noise but drifting bias.
 * Accelerometer measures acceleration; integrated to velocity-domain for
 * the simplified observation model used in this demo.
 *
 * H matrix observes v + b_a and omega + b_g from the 7-state vector:
 *   H = [[0, 0, 0, 1, 0, 0, 1],    <- accel: v + b_a
 *        [0, 0, 0, 0, 1, 1, 0]]    <- gyro:  omega + b_g
 *
 * The KF estimates the biases as part of its state, allowing it to
 * compensate for sensor drift over time.
 */
export class IMU {
  readonly H: Mat;
  readonly R: Mat;

  /** Per-sample noise std-dev on velocity measurement (m/s) */
  private sigmaV: number;
  /** Per-sample noise std-dev on angular rate measurement (rad/s) */
  private sigmaOmega: number;

  /** True gyro bias — unknown to the KF, drifts over time (rad/s) */
  private trueBiasGyro = 0;
  /** True accel bias — unknown to the KF, drifts over time (m/s) */
  private trueBiasAccel = 0;
  /** Bias drift rate per call (std-dev of random walk step) */
  private biasDriftGyro: number;
  private biasDriftAccel: number;

  /**
   * MPU-6050-based defaults:
   * @param sigmaV      Velocity noise std-dev (m/s) — from integrated accel noise
   * @param sigmaOmega  Angular rate noise std-dev (rad/s) — from gyro noise density
   * @param biasDriftGyro  Gyro bias random walk per step (rad/s)
   * @param biasDriftAccel Accel bias random walk per step (m/s)
   */
  constructor(
    sigmaV: number = 0.02,
    sigmaOmega: number = 0.005,
    biasDriftGyro: number = 0.0003,
    biasDriftAccel: number = 0.0001,
  ) {
    this.sigmaV = sigmaV;
    this.sigmaOmega = sigmaOmega;
    this.biasDriftGyro = biasDriftGyro;
    this.biasDriftAccel = biasDriftAccel;

    // Observation matrix: picks out (v + b_a) and (omega + b_g) from 7-state
    this.H = mat(2, 7, [
      0, 0, 0, 1, 0, 1, 0,   // accel observes v + b_a
      0, 0, 0, 0, 1, 0, 1,   // gyro observes omega + b_g
    ]);

    // Measurement noise covariance
    this.R = mat(2, 2, [
      sigmaV * sigmaV, 0,
      0, sigmaOmega * sigmaOmega,
    ]);
  }

  /** Get noisy IMU reading from true state, including bias. Returns 2×1 vector. */
  read(truth: RobotState): Mat {
    // Biases drift each reading (random walk)
    this.trueBiasGyro += this.gaussian() * this.biasDriftGyro;
    this.trueBiasAccel += this.gaussian() * this.biasDriftAccel;

    return mat(2, 1, [
      truth.v + this.trueBiasAccel + this.gaussian() * this.sigmaV,
      truth.omega + this.trueBiasGyro + this.gaussian() * this.sigmaOmega,
    ]);
  }

  /** Reset biases to zero (e.g. on simulation reset). */
  reset(): void {
    this.trueBiasGyro = 0;
    this.trueBiasAccel = 0;
  }

  private gaussian(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
