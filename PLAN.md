# Kalman Filter Educational Web Visualization — Robot Vacuum

An interactive web-based tool for learning how Kalman filters work, using a robot vacuum as an intuitive example. Students can toggle sensors on/off and observe how the filter's estimate and uncertainty change in real time.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Build | Vite 6 | Fast HMR, native TS, trivial GitHub Pages deploy |
| Language | TypeScript 5 | Types make the math self-documenting |
| Rendering | PixiJS 8 | 2D WebGL — performant for trails + ellipses, appropriate for top-down view |
| UI | Svelte 5 | Minimal boilerplate, compiles away, runes for reactive state |
| Math display | KaTeX | Faster than MathJax, smaller bundle |
| Deploy | GitHub Pages via `gh-pages` package |

## Project Structure

```
src/
├── main.ts
├── App.svelte                        # Root: canvas left, side panel right
├── style.css                         # Dark theme, layout grid
├── simulation/
│   ├── types.ts                      # State vector, sensor config, matrix types
│   ├── RobotVacuum.ts                # Ground truth unicycle kinematics
│   ├── Room.ts                       # Wall geometry, collision, raycast
│   ├── PathPlanner.ts                # Random waypoints + proportional controller
│   ├── KalmanFilter.ts               # 7-state EKF: [px, py, θ, v, ω, b_a, b_g]
│   ├── sensors/
│   │   ├── WheelEncoders.ts          # Differential drive with mismatch + slip
│   │   ├── IMU.ts                    # MPU-6050: raw gyro + accel with bias drift
│   │   └── LiDAR.ts                  # Range beams → position measurement
│   └── SimulationLoop.ts             # 200 Hz control loop, decoupled from 60 Hz display
├── rendering/
│   ├── PixiRenderer.ts               # App setup, world↔screen transform
│   ├── RoomGraphics.ts               # Wall lines
│   ├── RobotGraphics.ts              # Green (truth) + blue (estimate) circles
│   ├── TrailGraphics.ts              # Green + blue trails
│   ├── EllipseGraphics.ts            # Uncertainty ellipse from P
│   ├── LiDARGraphics.ts              # Point cloud + optional ray fan
│   ├── WaypointGraphics.ts           # Target waypoint cross marker
│   └── shapes.ts                     # smoothCircle/smoothEllipse helpers
├── components/
│   └── FormulaPanel.svelte           # KaTeX equations with hover tooltips
├── scripts/
│   └── diagnose.ts                   # Headless KF diagnostic (CSV output)
└── lib/
    └── matrix.ts                     # Hand-rolled 7×7 ops (educational clarity)
```

## Core Design

### State Vector

`x = [px, py, θ, v, ω, b_a, b_g]ᵀ` — position, heading, linear velocity, angular velocity, accelerometer bias, gyroscope bias.

### Simulation Loop (per step at 200 Hz)

1. PathPlanner uses **KF estimate** (closed-loop, as a real robot would)
2. RobotVacuum.step(dt) — ground truth propagation (unicycle model)
3. Wheel encoders generate noisy readings → KF predict (every step)
4. IMU generates readings with bias drift → KF correct (at 100 Hz)
5. LiDAR generates range beams → KF correct (at 8–15 Hz depending on model)
6. Renderer updates visuals (at ~60 Hz via requestAnimationFrame)

### Sensor Roles

| Sensor | KF Role | Provides | H matrix | Rate |
|--------|---------|----------|----------|------|
| Wheel encoders | **Prediction** (control input u) | Noisy v, ω with mismatch + slip | N/A — feeds Bu | 200 Hz |
| IMU (MPU-6050) | **Correction** (measurement) | v + b_a, ω + b_g | `[[0,0,0,1,0,1,0],[0,0,0,0,1,0,1]]` | 100 Hz |
| LiDAR (selectable) | **Correction** (measurement) | px, py from ranges | `[[1,0,0,0,0,0,0],[0,1,0,0,0,0,0]]` | 8–15 Hz |

### LiDAR Presets

| Model | Beams | Range noise | Rate | Price |
|-------|-------|-------------|------|-------|
| RPLiDAR A1 | 360 | 0.03 m | 8 Hz | ~$100 |
| RPLiDAR A2 | 400 | 0.02 m | 10 Hz | ~$300 |
| Hokuyo URG-04LX | 683 | 0.01 m | 10 Hz | ~$1k |
| SICK TIM561 | 810 | 0.01 m | 15 Hz | ~$2k |

### Key Educational Moments

- **Encoders only:** Drift from diameter mismatch curves the path; slip adds noise
- **Add IMU:** Gyro bias causes spiral drift when alone; combined with encoders, bias is estimated and compensated
- **Add LiDAR:** Absolute position bounds all drift — ellipse shrinks, estimate converges
- **Bias estimation:** Watch b_gyro and b_accel values converge as the filter learns sensor errors
- **Formula panel** highlights predict vs correct step, with hover tooltips on each term
- **Closed-loop planner:** Poor estimation visibly degrades navigation — the robot makes bad decisions when the filter is bad

---

## Phase 6: Realistic Signal Processing

Two simulation shortcuts ("cheats") remain. This phase replaces them with proper signal processing.

### 6a. LiDAR: Triangulate Position from Beam Ranges

**Current cheat:** `read()` returns `truth.px + noise` — ignores the actual beams.

**Realistic approach:** Use opposite beam pairs to compute position from wall distances in a known rectangular room.

For a rectangular room centred at origin (half-width `hw`, half-height `hh`):
- A beam hitting the right wall at distance `d` at angle `α` gives: `px = hw - d·cos(α)`
- A beam hitting the top wall gives: `py = hh - d·sin(α)`
- Each beam pair (opposite walls) gives an independent position estimate
- Average all estimates, weighted by confidence (beams nearly parallel to a wall are unreliable)

**Implementation plan:**
1. In `LiDAR.read()`, cast all beams and collect `(angle, noisyRange)` pairs (already done)
2. For each beam, determine which wall it hits using `Room.raycast()` direction
3. Compute the implied robot position from each beam + known wall location
4. Weight each estimate by `|cos(angle_to_wall_normal)|` — beams perpendicular to walls are most reliable
5. Weighted average gives `(px_est, py_est)` — this is the measurement `z`
6. The noise on `z` emerges naturally from range noise propagated through the geometry
7. R matrix: compute from the weighted combination of per-beam range variances

**What changes:**
- `LiDAR.read()` — replace the 3-line cheat with ~30 lines of triangulation
- `LiDAR.updateDerivedParams()` — R is now derived from the geometry, not a simple formula
- Noise characteristics will depend on robot position (near walls = some beams more accurate) — more realistic

### 6b. Accelerometer: Integrate Acceleration Instead of Reading Velocity

**Current cheat:** `read()` returns `truth.v + bias + noise` — a real accelerometer measures acceleration, not velocity.

**Realistic approach:** The IMU stores a velocity accumulator. Each `read()` call:
1. Sample true acceleration: `a_true = (truth.v - v_prev) / dt`
2. Add bias and noise: `a_meas = a_true + b_a + noise_a`
3. Integrate: `v_accumulated += a_meas * dt`
4. Return `v_accumulated` as the velocity measurement

This naturally produces:
- Velocity drift from integrated bias (realistic)
- Growing uncertainty over time without corrections (realistic)
- Noise that accumulates differently than additive per-sample noise (realistic)

**What changes:**
- `IMU` class — add `prevTruthV`, `accumulatedV` fields
- `IMU.read()` — compute acceleration, add noise/bias, integrate to velocity
- `IMU.reset()` — reset accumulator
- The H matrix and R stay the same (still observing velocity + bias)
- R might need retuning since the noise characteristics change

**Impact:** With integrated acceleration, the accelerometer measurement will drift faster when uncorrected, making the benefit of sensor fusion even more visible. The gyro part stays unchanged (it already directly measures angular rate).

### 6c. Remaining Polish

- [ ] Deploy to GitHub Pages
- [ ] Responsive layout polish
