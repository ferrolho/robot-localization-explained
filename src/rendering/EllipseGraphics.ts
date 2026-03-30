import { Graphics, Container } from 'pixi.js';
import { smoothEllipse } from './shapes';

/**
 * Draws a 2-sigma uncertainty ellipse from the 2×2 position covariance.
 * The ellipse semi-axes are the eigenvalues of the covariance, rotated
 * by the eigenvector angle.
 */
export class EllipseGraphics {
  readonly container: Container;
  private gfx: Graphics;

  constructor() {
    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  /**
   * Update ellipse from the 2×2 position covariance submatrix.
   * @param px - estimated x position
   * @param py - estimated y position
   * @param p11 - Var(px)
   * @param p12 - Cov(px, py)
   * @param p22 - Var(py)
   * @param nSigma - confidence region (default 2 = ~95%)
   */
  update(px: number, py: number, p11: number, p12: number, p22: number, nSigma: number = 2): void {
    this.gfx.clear();

    // Eigenvalues of 2×2 symmetric matrix
    const trace = p11 + p22;
    const det = p11 * p22 - p12 * p12;
    const disc = Math.sqrt(Math.max(0, trace * trace / 4 - det));
    const lambda1 = trace / 2 + disc;
    const lambda2 = trace / 2 - disc;

    // Semi-axes scaled by nSigma
    const a = nSigma * Math.sqrt(Math.max(0, lambda1));
    const b = nSigma * Math.sqrt(Math.max(0, lambda2));

    // Cap the ellipse to avoid visual explosion
    const maxRadius = 3;
    const aClamp = Math.min(a, maxRadius);
    const bClamp = Math.min(b, maxRadius);

    // Rotation angle of the ellipse
    const angle = Math.atan2(2 * p12, p11 - p22) / 2;

    this.container.x = px;
    this.container.y = py;
    this.container.rotation = angle;

    smoothEllipse(this.gfx, 0, 0, aClamp, bClamp);
    this.gfx.fill({ color: 0x63b3ed, alpha: 0.15 });
    this.gfx.stroke({ color: 0x63b3ed, width: 0.02, alpha: 0.5 });
  }
}
