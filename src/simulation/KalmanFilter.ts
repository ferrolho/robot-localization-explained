import {
  mat, matIdentity, matClone, matMul, matAdd, matSub,
  matTranspose, matInverse, matSymmetrise, matGet, matSet,
  type Mat,
} from '../lib/matrix';

/**
 * Extended Kalman Filter for a 5-state unicycle model.
 * State: x = [px, py, theta, v, omega]^T
 *
 * Predict step uses EKF (nonlinear state propagation + Jacobian for covariance).
 * Correct step is standard linear KF (H is linear for IMU and simplified LiDAR).
 */
export class KalmanFilter {
  /** State estimate (5×1) */
  x: Mat;
  /** Covariance matrix (5×5) */
  P: Mat;
  /** Process noise covariance (5×5) */
  Q: Mat;
  /** Last computed Kalman gain */
  K: Mat | null = null;

  constructor() {
    // Initial state: origin, facing right, stationary
    this.x = mat(5, 1, [0, 0, 0, 0, 0]);

    // Initial covariance: small uncertainty
    this.P = mat(5, 5, [
      0.01, 0, 0, 0, 0,
      0, 0.01, 0, 0, 0,
      0, 0, 0.01, 0, 0,
      0, 0, 0, 0.01, 0,
      0, 0, 0, 0, 0.01,
    ]);

    // Process noise: how much we distrust the model each step.
    // Position grows slowly, velocity is less predictable.
    // Process noise: position grows slowly (driven mainly by velocity
    // uncertainty through the Jacobian), velocity is less predictable.
    this.Q = mat(5, 5, [
      0.0001, 0, 0, 0, 0,
      0, 0.0001, 0, 0, 0,
      0, 0, 0.001, 0, 0,
      0, 0, 0, 0.01, 0,
      0, 0, 0, 0, 0.01,
    ]);
  }

  /**
   * Predict step (EKF-style).
   * Uses wheel encoder readings as control input u = [v_enc, omega_enc].
   */
  predict(vEnc: number, omegaEnc: number, dt: number): void {
    const theta = matGet(this.x, 2, 0);

    // 1. Nonlinear state propagation (unicycle model)
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    matSet(this.x, 0, 0, matGet(this.x, 0, 0) + vEnc * cosT * dt);
    matSet(this.x, 1, 0, matGet(this.x, 1, 0) + vEnc * sinT * dt);
    matSet(this.x, 2, 0, theta + omegaEnc * dt);
    matSet(this.x, 3, 0, vEnc);
    matSet(this.x, 4, 0, omegaEnc);

    // Normalise angle
    matSet(this.x, 2, 0, Math.atan2(
      Math.sin(matGet(this.x, 2, 0)),
      Math.cos(matGet(this.x, 2, 0)),
    ));

    // 2. Jacobian F = df/dx evaluated at current state
    const F = matIdentity(5);
    matSet(F, 0, 2, -vEnc * sinT * dt);  // dpx/dtheta
    matSet(F, 0, 3, cosT * dt);           // dpx/dv
    matSet(F, 1, 2, vEnc * cosT * dt);    // dpy/dtheta
    matSet(F, 1, 3, sinT * dt);           // dpy/dv
    matSet(F, 2, 4, dt);                   // dtheta/domega

    // 3. Covariance prediction: P = F P F^T + Q
    this.P = matSymmetrise(
      matAdd(matMul(matMul(F, this.P), matTranspose(F)), this.Q)
    );

    // Clamp diagonal entries to prevent unbounded covariance growth.
    // Without this, enabling a sensor mid-run causes the large
    // cross-correlations to produce an enormous Kalman gain that
    // flings the position estimate off-screen.
    const maxVar = [10, 10, 4, 1, 1]; // px, py, theta, v, omega
    for (let i = 0; i < 5; i++) {
      const pii = matGet(this.P, i, 0 + i); // workaround: 0+i for clarity
      if (pii > maxVar[i]) {
        const scale = Math.sqrt(maxVar[i] / pii);
        // Scale row i and column i so the diagonal = maxVar[i]
        // and cross-correlations shrink proportionally.
        for (let j = 0; j < 5; j++) {
          matSet(this.P, i, j, matGet(this.P, i, j) * scale);
          matSet(this.P, j, i, matGet(this.P, j, i) * scale);
        }
      }
    }

    this.K = null;
  }

  /**
   * Correct step (linear KF).
   * z: measurement vector (m×1)
   * H: observation matrix (m×5)
   * R: measurement noise covariance (m×m)
   */
  correct(z: Mat, H: Mat, R: Mat): void {
    // 1. Innovation: y = z - H x
    const y = matSub(z, matMul(H, this.x));

    // 2. Innovation covariance: S = H P H^T + R
    const S = matAdd(matMul(matMul(H, this.P), matTranspose(H)), R);

    // 3. Kalman gain: K = P H^T S^-1
    this.K = matMul(matMul(this.P, matTranspose(H)), matInverse(S));

    // 4. Update state: x = x + K y
    this.x = matAdd(this.x, matMul(this.K, y));

    // 5. Update covariance (Joseph form for numerical stability):
    //    P = (I - KH) P (I - KH)^T + K R K^T
    const I = matIdentity(5);
    const IKH = matSub(I, matMul(this.K, H));
    this.P = matSymmetrise(
      matAdd(
        matMul(matMul(IKH, this.P), matTranspose(IKH)),
        matMul(matMul(this.K, R), matTranspose(this.K)),
      )
    );

    // Normalise angle in state
    matSet(this.x, 2, 0, Math.atan2(
      Math.sin(matGet(this.x, 2, 0)),
      Math.cos(matGet(this.x, 2, 0)),
    ));

  }

  /** Get state as a plain object for rendering. */
  getState(): { px: number; py: number; theta: number; v: number; omega: number } {
    return {
      px: matGet(this.x, 0, 0),
      py: matGet(this.x, 1, 0),
      theta: matGet(this.x, 2, 0),
      v: matGet(this.x, 3, 0),
      omega: matGet(this.x, 4, 0),
    };
  }

  /** Get the 2×2 position covariance submatrix (top-left of P). */
  getPositionCovariance(): { p11: number; p12: number; p22: number } {
    return {
      p11: matGet(this.P, 0, 0),
      p12: matGet(this.P, 0, 1),
      p22: matGet(this.P, 1, 1),
    };
  }

  /** Trace of P — scalar summary of total uncertainty. */
  getTraceP(): number {
    let trace = 0;
    for (let i = 0; i < 5; i++) trace += matGet(this.P, i, i);
    return trace;
  }

  reset(): void {
    this.x = mat(5, 1, [0, 0, 0, 0, 0]);
    this.P = mat(5, 5, [
      0.01, 0, 0, 0, 0,
      0, 0.01, 0, 0, 0,
      0, 0, 0.01, 0, 0,
      0, 0, 0, 0.01, 0,
      0, 0, 0, 0, 0.01,
    ]);
    this.K = null;
  }
}
