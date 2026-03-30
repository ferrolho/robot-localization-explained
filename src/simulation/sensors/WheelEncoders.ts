import type { RobotState } from '../types';

/**
 * Wheel encoder sensor model.
 * Measures velocity (v, omega) with Gaussian noise proportional to speed.
 * These readings are used as the control input u in the KF predict step.
 */
export class WheelEncoders {
  private sigmaV: number;
  private sigmaOmega: number;

  constructor(sigmaV: number = 0.05, sigmaOmega: number = 0.05) {
    this.sigmaV = sigmaV;
    this.sigmaOmega = sigmaOmega;
  }

  /** Get noisy encoder readings from the true robot state. */
  read(truth: RobotState): { v: number; omega: number } {
    return {
      v: truth.v + this.gaussian() * this.sigmaV * (1 + Math.abs(truth.v)),
      omega: truth.omega + this.gaussian() * this.sigmaOmega * (1 + Math.abs(truth.omega)),
    };
  }

  private gaussian(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}
