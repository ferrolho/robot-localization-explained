import type { RobotState } from '../types';

/**
 * Differential-drive wheel encoder model.
 * Simulates left/right wheel encoders that measure individual wheel velocities,
 * then converts to body-frame (v, omega) for the KF predict step.
 *
 *   v     = (v_right + v_left) / 2
 *   omega = (v_right - v_left) / wheelBase
 *
 * Models three real-world error sources:
 *   1. Per-sample Gaussian noise (electrical/quantisation)
 *   2. Wheel diameter mismatch — a fixed scale factor between left/right wheels,
 *      causing a persistent turn bias even when driving "straight"
 *   3. Wheel slip — random, speed-dependent scale errors that come and go
 *      (e.g. on smooth floors, over dust patches)
 */
export class WheelEncoders {
  readonly wheelBase: number;
  private sigmaWheel: number;

  /** Fixed scale factor per wheel — models slightly different diameters.
   *  1.0 = perfect; e.g. 1.02 means that wheel reads 2% high. */
  private scaleLeft: number;
  private scaleRight: number;

  /** Slip noise std-dev — multiplicative, speed-dependent. */
  private sigmaSlip: number;

  /** Toggle individual error sources at runtime. */
  diameterMismatchEnabled = true;
  slipEnabled = true;

  /**
   * @param wheelBase   Distance between left and right wheels (metres)
   * @param sigmaWheel  Noise std-dev on each wheel's velocity (m/s)
   * @param diameterMismatch  Fractional difference between wheel diameters
   *                          (e.g. 0.02 = 2% — one wheel is slightly larger)
   * @param sigmaSlip   Slip noise std-dev as a fraction of wheel speed
   *                    (e.g. 0.03 = 3% random slip)
   */
  constructor(
    wheelBase: number = 0.2,
    sigmaWheel: number = 0.03,
    diameterMismatch: number = 0.02,
    sigmaSlip: number = 0.03,
  ) {
    this.wheelBase = wheelBase;
    this.sigmaWheel = sigmaWheel;
    this.sigmaSlip = sigmaSlip;

    // Apply mismatch asymmetrically: left reads slightly high, right slightly low
    this.scaleLeft = 1 + diameterMismatch / 2;
    this.scaleRight = 1 - diameterMismatch / 2;
  }

  /** Get noisy encoder readings from the true robot state. */
  read(truth: RobotState): { v: number; omega: number } {
    // True individual wheel velocities (inverse of differential-drive kinematics)
    const vLeftTrue = truth.v - (truth.omega * this.wheelBase) / 2;
    const vRightTrue = truth.v + (truth.omega * this.wheelBase) / 2;

    // 1. Diameter mismatch — fixed systematic scale error
    let vLeft = vLeftTrue * (this.diameterMismatchEnabled ? this.scaleLeft : 1);
    let vRight = vRightTrue * (this.diameterMismatchEnabled ? this.scaleRight : 1);

    // 2. Wheel slip — random multiplicative error proportional to speed
    if (this.slipEnabled) {
      vLeft *= 1 + this.gaussian() * this.sigmaSlip;
      vRight *= 1 + this.gaussian() * this.sigmaSlip;
    }

    // 3. Additive Gaussian noise (electrical/quantisation)
    vLeft += this.gaussian() * this.sigmaWheel;
    vRight += this.gaussian() * this.sigmaWheel;

    // Convert back to body-frame velocities
    return {
      v: (vRight + vLeft) / 2,
      omega: (vRight - vLeft) / this.wheelBase,
    };
  }

  /** Reset (diameter mismatch is fixed for the lifetime of the robot). */
  reset(): void {
    // Nothing to reset — mismatch is a physical property, not state
  }

  private gaussian(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
