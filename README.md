# Kalman Filter Educational Visualization

An interactive web-based tool for learning how Kalman filters work, using a robot vacuum as an intuitive example. Toggle sensors on and off and watch how the filter's estimate and uncertainty change in real time.

The robot navigates a rectangular room driven by a closed-loop planner that uses the filter's own estimate — so a poorly-tuned filter visibly degrades navigation, just as it would on real hardware.

## What's modelled

- **Ground truth** — unicycle kinematics for a differential-drive robot
- **Wheel encoders** — noisy v, ω with diameter mismatch and slip (KF prediction input)
- **IMU (MPU-6050)** — raw gyro and accelerometer with drifting biases (KF correction)
- **LiDAR** — selectable presets (RPLiDAR A1/A2, Hokuyo URG-04LX, SICK TIM561) with realistic beam counts, range noise, and update rates (KF correction)
- **7-state EKF** — `[px, py, θ, v, ω, b_a, b_g]` with online bias estimation

The control loop runs at 200 Hz, decoupled from the ~60 Hz display, and each sensor fires at its own rate.

## Tech stack

| Layer | Choice |
|-------|--------|
| Build | Vite 6 |
| Language | TypeScript 5 |
| Rendering | PixiJS 8 |
| UI | Svelte 5 |
| Math display | KaTeX |

## Running locally

```bash
npm install
npm run dev
```

Other scripts:

- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build
- `npm run check` — `svelte-check` + `tsc` type check

There is also a headless diagnostic script for KF tuning: see [scripts/](scripts/).

## Project layout

See [PLAN.md](PLAN.md) for the full architecture, state vector definition, sensor roles, and the H/R matrices used by the filter. Implementation progress is tracked in [PROGRESS.md](PROGRESS.md).

Key directories:

- [src/simulation/](src/simulation/) — robot kinematics, room geometry, sensors, Kalman filter
- [src/rendering/](src/rendering/) — PixiJS graphics (robot, trails, uncertainty ellipse, LiDAR points)
- [src/components/](src/components/) — Svelte UI (sensor toggles, formula panel)
- [src/lib/matrix.ts](src/lib/matrix.ts) — hand-rolled matrix ops, kept explicit for educational clarity
