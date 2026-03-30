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
│   ├── KalmanFilter.ts               # Predict + correct (EKF-style predict)
│   ├── sensors/
│   │   ├── WheelEncoders.ts          # Noisy (v, ω) → control input u
│   │   ├── IMU.ts                    # Noisy (v, ω) → measurement z
│   │   └── LiDAR.ts                  # Range to walls → position measurement
│   └── SimulationLoop.ts             # Fixed-timestep orchestrator
├── rendering/
│   ├── PixiRenderer.ts               # App setup, world↔screen transform
│   ├── RoomGraphics.ts               # Wall lines
│   ├── RobotGraphics.ts              # Green (truth) + blue (estimate) circles
│   ├── TrailGraphics.ts              # Solid green + dashed blue trails
│   ├── EllipseGraphics.ts            # Uncertainty ellipse from P
│   └── LiDARGraphics.ts              # Ray fan when LiDAR enabled
├── components/
│   ├── SidePanel.svelte              # Container for all panels
│   ├── SensorToggles.svelte          # Toggle switches for each sensor
│   ├── SimControls.svelte            # Play/pause, speed, reset
│   ├── FormulaPanel.svelte           # KaTeX predict/correct equations
│   └── StateDisplay.svelte           # Real-time x̂, P trace, K
└── lib/
    ├── matrix.ts                     # Hand-rolled 5×5 ops (educational clarity)
    └── katex-helpers.ts              # KaTeX rendering utilities
```

## Core Design

### State Vector

`x = [px, py, θ, v, ω]ᵀ` — position, heading, linear velocity, angular velocity.

### Simulation Loop (per frame)

1. PathPlanner updates commanded velocity
2. RobotVacuum.step(dt) — ground truth propagation (unicycle model)
3. Sensors generate noisy readings from ground truth
4. KF.predict(u, dt) — wheel encoder readings as control input
5. KF.correct(z, H, R) — for each enabled measurement sensor
6. Renderer updates visuals

### Sensor Roles

| Sensor | KF Role | Provides | H matrix |
|--------|---------|----------|----------|
| Wheel encoders | **Prediction** (control input u) | Noisy v, ω | N/A — feeds Bu |
| IMU | **Correction** (measurement) | Noisy v, ω | `[[0,0,0,1,0],[0,0,0,0,1]]` |
| LiDAR | **Correction** (measurement) | Noisy px, py | `[[1,0,0,0,0],[0,1,0,0,0]]` |

### Key Educational Moments

- **Encoders only:** Uncertainty ellipse grows unboundedly — odometry drift
- **Add IMU:** Velocity improves, but position still drifts (IMU doesn't observe position)
- **Add LiDAR:** Dramatic correction — ellipse shrinks, estimate converges to truth
- **Formula panel** highlights predict vs correct step in real time
- **Ellipse** visibly grows during predict, shrinks during correct

### Design Decisions

- **Hand-rolled matrix library** (~50 lines) instead of a dependency — the code IS the teaching material
- **LiDAR simplified** as position extraction (triangulate px, py from ranges → linear H). Full EKF with raycast Jacobian is a stretch goal
- **EKF-style predict** from the start because the unicycle model is nonlinear (sin/cos). The linear vs nonlinear distinction is only in the measurement step
- **Numerical stability:** Force P symmetry after each update; use Joseph form for covariance update

## Layout

```
┌──────────────────────────────────────────────────────┐
│  Kalman Filter: Robot Vacuum                         │
├─────────────────────────┬────────────────────────────┤
│                         │  Sensors: ☑Enc ☐IMU ☐LiDAR │
│   PixiJS Canvas         │  Controls: [▶][⏸][↻] 1x    │
│   (top-down 2D room)    │                            │
│                         │  ── Predict ──────────     │
│   ● green = truth       │  x̂⁻ = Ax̂ + Bu             │
│   ● blue  = estimate    │  P⁻ = APAᵀ + Q            │
│   ◯ ellipse = P         │                            │
│                         │  ── Correct ──────────     │
│                         │  K = P⁻Hᵀ(HP⁻Hᵀ+R)⁻¹     │
│                         │  x̂ = x̂⁻ + K(z − Hx̂⁻)     │
│                         │  P = (I−KH)P⁻             │
│                         │                            │
│                         │  State: px=1.2 py=0.8 ...  │
│                         │  ‖P‖ = 0.34               │
└─────────────────────────┴────────────────────────────┘
```

## Deployment

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [svelte()],
  base: '/kalman-filter-project/',
  build: { outDir: 'dist' },
});
```

Deploy: `npm run build && npx gh-pages -d dist`

## Verification

1. `npm run dev` — robot moves around room
2. Toggle sensors — observe uncertainty ellipse behaviour
3. Encoders only → drift. Add IMU → velocity correction. Add LiDAR → position snaps
4. Formula panel updates in sync with simulation
5. `npm run build && npm run preview` — verify production build
6. Deploy to GitHub Pages and verify
