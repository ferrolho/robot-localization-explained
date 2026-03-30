# Progress Tracker

## Phase 1: Skeleton + Moving Robot ✅

- [x] Init Vite + Svelte + TS project
- [x] Install PixiJS 8
- [x] `Room.ts` — rectangular wall geometry, collision detection, raycast
- [x] `RobotVacuum.ts` — unicycle kinematics, ground truth propagation
- [x] `PathPlanner.ts` — random waypoints + proportional controller
- [x] `PixiRenderer.ts` — PixiJS 8 app setup, world↔screen transform
- [x] `RoomGraphics.ts` — draw wall lines
- [x] `RobotGraphics.ts` — green circle with heading indicator
- [x] `SimulationLoop.ts` — fixed-timestep orchestrator with requestAnimationFrame
- [x] Minimal `App.svelte` with canvas container + play/pause
- [x] Verify with `npm run dev`

---

## Phase 2: Kalman Filter + Encoder Drift ✅

- [x] `lib/matrix.ts` — matMul, matTranspose, matInverse (≤5×5), matAdd, matSub, matIdentity
- [x] `KalmanFilter.ts` — predict() + correct() methods (EKF-style predict)
- [x] `WheelEncoders.ts` — noisy v, ω as control input u
- [x] `EllipseGraphics.ts` — uncertainty ellipse from P (eigenvalue decomposition of 2×2 submatrix)
- [x] `TrailGraphics.ts` — green solid trail (truth) + blue trail (estimate)
- [x] Blue estimated robot circle added to scene
- [x] Estimate drifts away from truth, ellipse grows

---

## Phase 3: IMU + Side Panel ✅

- [x] `IMU.ts` — noisy velocity measurement, H and R matrices
- [x] Wire KF correct step when IMU enabled
- [x] Install KaTeX
- [x] `FormulaPanel.svelte` — KaTeX-rendered predict/correct equations, active step highlighting
- [x] State display — real-time x̂, P trace, step type (inline in App.svelte)
- [x] Sensor toggles — checkbox toggles for encoders / IMU / LiDAR with role labels
- [x] Sim controls — play/pause, reset (inline in App.svelte)
- [x] Layout: canvas left, side panel right

---

## Phase 4: LiDAR + Polish ✅

- [x] `Room.raycast()` — distance from point to nearest wall along a direction
- [x] `LiDAR.ts` — position extraction from range measurements
- [x] `LiDARGraphics.ts` — ray fan visualization
- [x] Toggle LiDAR on → ellipse shrink + estimate convergence
- [x] Legend (green = truth, blue = estimate, ellipse = uncertainty)

---

## Phase 5: Realistic Sensor Models + UX ✅

- [x] Decouple control loop (200 Hz) from display rate (~60 Hz)
- [x] Per-sensor update rates (IMU 100 Hz, LiDAR 8–15 Hz)
- [x] Realistic wheel encoder model — differential drive with diameter mismatch (2%) and wheel slip (3%)
- [x] Realistic IMU model (MPU-6050) — raw gyro + accelerometer with drifting biases
- [x] 7-state KF: `[px, py, θ, v, ω, b_a, b_g]` with bias estimation
- [x] Real LiDAR presets (RPLiDAR A1, A2, Hokuyo, SICK) with specs and prices
- [x] LiDAR point cloud visualization with optional ray toggle
- [x] Tuned Q matrix — reduced Q_pos to prevent LiDAR correction jitter
- [x] Covariance clamping to prevent divergence when enabling sensors mid-run
- [x] Planner uses KF estimate (closed-loop, as a real robot would)
- [x] Click-to-set-waypoint with screen-to-world coordinate conversion
- [x] Waypoint marker visualization
- [x] Formula panel hover tooltips explaining each KF term
- [x] Smooth rendering — `smoothCircle`/`smoothEllipse` helpers for PixiJS world-space shapes
- [x] Formula panel highlights both predict + correct when both are active
- [x] Encoder sub-options (diameter mismatch, slip) as toggleable checkboxes
- [x] Sensor options nest under parent toggles (conditional visibility)
- [x] Headless diagnostic script (`scripts/diagnose.ts`) for KF tuning
- [x] JSDoc with units on all sensor/planner constructor params

---

## Phase 6: Realistic Signal Processing 🔲

- [ ] LiDAR: triangulate position from beam ranges against known room geometry (replace noise-on-truth cheat)
- [ ] Accelerometer: integrate acceleration to derive velocity (replace direct velocity read cheat)
- [ ] Deploy to GitHub Pages
- [ ] Responsive layout polish

---

## Stretch Goals 🔲

- [ ] Matrix visualization panel — show how state vector and covariance are transformed through predict → correct, with animated transitions from prior to posterior
