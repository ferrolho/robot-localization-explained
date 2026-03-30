# Progress Tracker

## Phase 1: Skeleton + Moving Robot (~2-3h)

- [ ] Init Vite + Svelte + TS project
- [ ] Install PixiJS 8
- [ ] `Room.ts` — rectangular wall geometry, collision detection
- [ ] `RobotVacuum.ts` — unicycle kinematics, ground truth propagation
- [ ] `PathPlanner.ts` — random waypoints + proportional controller
- [ ] `PixiRenderer.ts` — PixiJS 8 app setup, world↔screen transform
- [ ] `RoomGraphics.ts` — draw wall lines
- [ ] `RobotGraphics.ts` — green circle with heading indicator
- [ ] `SimulationLoop.ts` — fixed-timestep orchestrator with requestAnimationFrame
- [ ] Minimal `App.svelte` with canvas container + play/pause
- [ ] Verify with `npm run dev`

**Deliverable:** Robot vacuum bouncing around a room

---

## Phase 2: Kalman Filter + Encoder Drift (~3-4h)

- [ ] `lib/matrix.ts` — matMul, matTranspose, matInverse (≤5×5), matAdd, matSub, matIdentity
- [ ] `KalmanFilter.ts` — predict() + correct() methods
- [ ] `WheelEncoders.ts` — noisy v, ω as control input u
- [ ] `EllipseGraphics.ts` — uncertainty ellipse from P (eigenvalue decomposition of 2×2 submatrix)
- [ ] `TrailGraphics.ts` — green solid trail (truth) + blue dashed trail (estimate)
- [ ] Blue estimated robot circle added to scene
- [ ] Verify: estimate drifts away from truth, ellipse grows

**Deliverable:** Core "aha" — drifting estimate with growing uncertainty

---

## Phase 3: IMU + Side Panel (~3-4h)

- [ ] `IMU.ts` — noisy velocity measurement, H and R matrices
- [ ] Wire KF correct step when IMU enabled
- [ ] Install KaTeX
- [ ] `FormulaPanel.svelte` — KaTeX-rendered predict/correct equations, active step highlighting
- [ ] `StateDisplay.svelte` — real-time x̂, P trace, K values
- [ ] `SensorToggles.svelte` — toggle switches for encoders / IMU
- [ ] `SimControls.svelte` — play/pause, speed slider, reset
- [ ] `SidePanel.svelte` — assembles all sub-components
- [ ] Layout: canvas left, side panel right

**Deliverable:** Full side panel, IMU correction visible

---

## Phase 4: LiDAR + Polish (~3-4h)

- [ ] `Room.raycast()` — distance from point to nearest wall along a direction
- [ ] `LiDAR.ts` — position extraction from range measurements
- [ ] `LiDARGraphics.ts` — ray fan visualization
- [ ] Toggle LiDAR on → dramatic ellipse shrink + estimate convergence
- [ ] Legend (green = truth, blue = estimate, ellipse = uncertainty)
- [ ] Responsive layout polish
- [ ] Deploy to GitHub Pages
- [ ] *Stretch:* Formula hover → highlights corresponding visuals
- [ ] *Stretch:* Noise sliders for Q and R parameters
- [ ] *Stretch:* Full EKF with raycast Jacobian for LiDAR

**Deliverable:** Complete educational tool on GitHub Pages
