import type { RobotState } from '../types';

/**
 * Differential-drive wheel encoder model.
 * Simulates left/right wheel encoders that measure individual wheel velocities,
 * then converts to body-frame (v, omega) for the KF predict step.
 *
 *   v     = (v_right + v_left) / 2
 *   omega = (v_right - v_left) / wheelBase
 *
 * Each wheel encoder has independent Gaussian noise scaled by wheel speed.
 */
export class WheelEncoders {
  readonly wheelBase: number;
  private sigmaWheel: number;

  /**
   * @param wheelBase Distance between left and right wheels (metres)
   * @param sigmaWheel Noise std-dev on each wheel's velocity (m/s)
   */
  constructor(wheelBase: number = 0.2, sigmaWheel: number = 0.03) {
    this.wheelBase = wheelBase;
    this.sigmaWheel = sigmaWheel;
  }

  /** Get noisy encoder readings from the true robot state. */
  read(truth: RobotState): { v: number; omega: number } {
    // True individual wheel velocities (inverse of differential-drive kinematics)
    const vLeftTrue = truth.v - (truth.omega * this.wheelBase) / 2;
    const vRightTrue = truth.v + (truth.omega * this.wheelBase) / 2;

    // Each wheel encoder has independent noise proportional to wheel speed
    const vLeft = vLeftTrue + this.gaussian() * this.sigmaWheel * (1 + Math.abs(vLeftTrue));
    const vRight = vRightTrue + this.gaussian() * this.sigmaWheel * (1 + Math.abs(vRightTrue));

    // Convert back to body-frame velocities
    return {
      v: (vRight + vLeft) / 2,
      omega: (vRight - vLeft) / this.wheelBase,
    };
  }

  private gaussian(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
