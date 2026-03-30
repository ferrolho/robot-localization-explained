/**
 * Minimal matrix operations for small matrices (up to 5×5).
 * Hand-rolled for educational clarity — every line is readable.
 * Matrices stored as flat Float64Array in row-major order.
 */

export type Mat = { data: Float64Array; rows: number; cols: number };

export function mat(rows: number, cols: number, values?: number[]): Mat {
  const data = values
    ? new Float64Array(values)
    : new Float64Array(rows * cols);
  return { data, rows, cols };
}

export function matIdentity(n: number): Mat {
  const m = mat(n, n);
  for (let i = 0; i < n; i++) m.data[i * n + i] = 1;
  return m;
}

export function matClone(a: Mat): Mat {
  return { data: new Float64Array(a.data), rows: a.rows, cols: a.cols };
}

export function matGet(a: Mat, r: number, c: number): number {
  return a.data[r * a.cols + c];
}

export function matSet(a: Mat, r: number, c: number, v: number): void {
  a.data[r * a.cols + c] = v;
}

export function matMul(a: Mat, b: Mat): Mat {
  const result = mat(a.rows, b.cols);
  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < b.cols; j++) {
      let sum = 0;
      for (let k = 0; k < a.cols; k++) {
        sum += matGet(a, i, k) * matGet(b, k, j);
      }
      matSet(result, i, j, sum);
    }
  }
  return result;
}

export function matAdd(a: Mat, b: Mat): Mat {
  const result = mat(a.rows, a.cols);
  for (let i = 0; i < a.data.length; i++) {
    result.data[i] = a.data[i] + b.data[i];
  }
  return result;
}

export function matSub(a: Mat, b: Mat): Mat {
  const result = mat(a.rows, a.cols);
  for (let i = 0; i < a.data.length; i++) {
    result.data[i] = a.data[i] - b.data[i];
  }
  return result;
}

export function matTranspose(a: Mat): Mat {
  const result = mat(a.cols, a.rows);
  for (let i = 0; i < a.rows; i++) {
    for (let j = 0; j < a.cols; j++) {
      matSet(result, j, i, matGet(a, i, j));
    }
  }
  return result;
}

export function matScale(a: Mat, s: number): Mat {
  const result = mat(a.rows, a.cols);
  for (let i = 0; i < a.data.length; i++) {
    result.data[i] = a.data[i] * s;
  }
  return result;
}

/**
 * Matrix inverse using Gauss-Jordan elimination.
 * Works for any small square matrix (we use up to 5×5).
 */
export function matInverse(a: Mat): Mat {
  const n = a.rows;
  // Augmented matrix [A | I]
  const aug = mat(n, 2 * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matSet(aug, i, j, matGet(a, i, j));
    }
    matSet(aug, i, n + i, 1);
  }

  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxVal = Math.abs(matGet(aug, col, col));
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(matGet(aug, row, col));
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    // Swap rows
    if (maxRow !== col) {
      for (let j = 0; j < 2 * n; j++) {
        const tmp = matGet(aug, col, j);
        matSet(aug, col, j, matGet(aug, maxRow, j));
        matSet(aug, maxRow, j, tmp);
      }
    }

    const pivot = matGet(aug, col, col);
    if (Math.abs(pivot) < 1e-12) {
      // Singular — return identity as fallback (prevents NaN propagation)
      return matIdentity(n);
    }

    // Scale pivot row
    for (let j = 0; j < 2 * n; j++) {
      matSet(aug, col, j, matGet(aug, col, j) / pivot);
    }

    // Eliminate column
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = matGet(aug, row, col);
      for (let j = 0; j < 2 * n; j++) {
        matSet(aug, row, j, matGet(aug, row, j) - factor * matGet(aug, col, j));
      }
    }
  }

  // Extract inverse from right half
  const inv = mat(n, n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      matSet(inv, i, j, matGet(aug, i, n + j));
    }
  }
  return inv;
}

/** Force symmetry: M = (M + M^T) / 2 */
export function matSymmetrise(a: Mat): Mat {
  return matScale(matAdd(a, matTranspose(a)), 0.5);
}

/** Convert state vector (5×1 mat) to/from array for convenience. */
export function matFromArray(arr: number[]): Mat {
  return mat(arr.length, 1, arr);
}

export function matToArray(m: Mat): number[] {
  return Array.from(m.data);
}
