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
- [ ] Responsive layout polish
- [ ] Deploy to GitHub Pages
- [ ] *Stretch:* Formula hover → highlights corresponding visuals
- [ ] *Stretch:* Noise sliders for Q and R parameters
- [ ] *Stretch:* Full EKF with raycast Jacobian for LiDAR
- [ ] *Stretch:* Code panel showing TypeScript implementation

**Remaining:** Deploy + polish
