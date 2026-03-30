<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SimulationLoop, type SimState } from './simulation/SimulationLoop';
  import { PixiRenderer } from './rendering/PixiRenderer';
  import { RoomGraphics } from './rendering/RoomGraphics';
  import { RobotGraphics } from './rendering/RobotGraphics';
  import { TrailGraphics } from './rendering/TrailGraphics';
  import { EllipseGraphics } from './rendering/EllipseGraphics';
  import { LiDARGraphics } from './rendering/LiDARGraphics';
  import { WaypointGraphics } from './rendering/WaypointGraphics';
  import FormulaPanel from './components/FormulaPanel.svelte';
  import 'katex/dist/katex.min.css';

  let canvasContainer: HTMLElement;
  let renderer: PixiRenderer;
  let sim: SimulationLoop;
  let truthRobot: RobotGraphics;
  let estRobot: RobotGraphics;
  let truthTrail: TrailGraphics;
  let estTrail: TrailGraphics;
  let ellipse: EllipseGraphics;
  let lidarGfx: LiDARGraphics;
  let waypointGfx: WaypointGraphics;

  let running = $state(false);
  let time = $state(0);
  let traceP = $state(0);
  let activeSteps = $state({ predicted: true, corrected: false });
  let estimate = $state({ px: 0, py: 0, theta: 0, v: 0, omega: 0 });
  let sensorsEnabled = $state({ encoders: true, imu: false, lidar: false });

  const lidarPresets = [
    { name: 'RPLiDAR A1',     beams: 360, noise: 0.03, rate: 8,  price: '~$100' },
    { name: 'RPLiDAR A2',     beams: 400, noise: 0.02, rate: 10, price: '~$300' },
    { name: 'Hokuyo URG-04LX', beams: 683, noise: 0.01, rate: 10, price: '~$1k' },
    { name: 'SICK TIM561',    beams: 810, noise: 0.01, rate: 15, price: '~$2k' },
  ] as const;
  let selectedLidar = $state(0);

  let frameCount = 0;

  onMount(async () => {
    sim = new SimulationLoop({ width: 6, height: 4 });
    renderer = new PixiRenderer();
    await renderer.init(canvasContainer, sim.room);

    // Room
    const roomGfx = new RoomGraphics(sim.room);
    renderer.worldContainer.addChild(roomGfx.container);

    // Waypoint marker
    waypointGfx = new WaypointGraphics();
    renderer.worldContainer.addChild(waypointGfx.container);

    // LiDAR rays (under trails)
    lidarGfx = new LiDARGraphics();
    renderer.worldContainer.addChild(lidarGfx.container);

    // Trails
    truthTrail = new TrailGraphics(0x48bb78);
    estTrail = new TrailGraphics(0x63b3ed);
    renderer.worldContainer.addChild(truthTrail.container);
    renderer.worldContainer.addChild(estTrail.container);

    // Uncertainty ellipse
    ellipse = new EllipseGraphics();
    renderer.worldContainer.addChild(ellipse.container);

    // Robots
    truthRobot = new RobotGraphics(0x48bb78, 0.8);
    estRobot = new RobotGraphics(0x63b3ed, 0.8);
    renderer.worldContainer.addChild(truthRobot.container);
    renderer.worldContainer.addChild(estRobot.container);

    sim.onUpdate = (state: SimState) => {
      truthRobot.update(state.groundTruth);
      estRobot.update(state.estimate);
      waypointGfx.update(state.waypoint.x, state.waypoint.y);

      const cov = state.covariance;
      ellipse.update(
        state.estimate.px, state.estimate.py,
        cov.p11, cov.p12, cov.p22,
      );

      if (state.lidarBeams.length > 0) {
        lidarGfx.update(state.groundTruth.px, state.groundTruth.py, state.lidarBeams);
      } else {
        lidarGfx.clear();
      }

      running = state.running;
      time = state.time;
      traceP = state.traceP;
      activeSteps = state.activeSteps;
      estimate = state.estimate;

      frameCount++;
      if (frameCount % 3 === 0) {
        truthTrail.addPoint(state.groundTruth.px, state.groundTruth.py);
        estTrail.addPoint(state.estimate.px, state.estimate.py);
        truthTrail.redraw();
        estTrail.redraw();
      }
    };

    sim.start();
  });

  onDestroy(() => {
    sim?.pause();
    renderer?.destroy();
  });

  function togglePlay() {
    if (sim.running) {
      sim.pause();
      running = false;
    } else {
      sim.start();
      running = true;
    }
  }

  function reset() {
    sim.reset();
    truthTrail?.clear();
    estTrail?.clear();
    lidarGfx?.clear();
    running = false;
    time = 0;
  }

  function toggleSensor(sensor: 'encoders' | 'imu' | 'lidar') {
    sensorsEnabled[sensor] = !sensorsEnabled[sensor];
    if (sim) {
      sim.sensors = { ...sensorsEnabled };
    }
  }

  function selectLidar(index: number) {
    selectedLidar = index;
    if (!sim) return;
    const preset = lidarPresets[index];
    sim.lidar.numBeams = preset.beams;
    sim.lidar.sigmaRange = preset.noise;
    sim.lidar.updateDerivedParams();
    sim.lidarHz = preset.rate;
  }
</script>

<div class="canvas-container" bind:this={canvasContainer}></div>

<div class="side-panel">
  <h1>Kalman Filter: Robot Vacuum</h1>

  <div>
    <h2>Controls</h2>
    <div class="controls">
      <button onclick={togglePlay}>
        {running ? 'Pause' : 'Play'}
      </button>
      <button onclick={reset}>Reset</button>
      <span style="font-size: 13px; color: var(--text-muted)">
        t = {time.toFixed(1)}s
      </span>
    </div>
  </div>

  <div>
    <h2>Sensors</h2>
    <div class="sensor-toggles">
      <label class="toggle">
        <input type="checkbox" checked={sensorsEnabled.encoders} onchange={() => toggleSensor('encoders')} />
        <span>Wheel Encoders</span>
        <span class="toggle-role">prediction</span>
      </label>
      <label class="toggle">
        <input type="checkbox" checked={sensorsEnabled.imu} onchange={() => toggleSensor('imu')} />
        <span>IMU</span>
        <span class="toggle-role">correction</span>
      </label>
      <label class="toggle">
        <input type="checkbox" checked={sensorsEnabled.lidar} onchange={() => toggleSensor('lidar')} />
        <span>2D LiDAR</span>
        <span class="toggle-role">correction</span>
      </label>
    </div>

    <div class="lidar-presets">
      <h3>LiDAR Model</h3>
      {#each lidarPresets as preset, i}
        <label class="preset-row">
          <input type="radio" name="lidar-preset" checked={selectedLidar === i} onchange={() => selectLidar(i)} />
          <span class="preset-name">{preset.name}</span>
          <span class="preset-specs">{preset.beams} beams · {preset.noise}m · {preset.rate} Hz</span>
          <span class="preset-price">{preset.price}</span>
        </label>
      {/each}
      <label class="toggle" style="margin-top: 6px;">
        <input type="checkbox" checked={false} onchange={(e: Event) => { lidarGfx.showRays = (e.target as HTMLInputElement).checked; }} />
        <span>Show laser rays</span>
      </label>
    </div>
  </div>

  <div>
    <h2>Formulas</h2>
    <FormulaPanel {activeSteps} />
  </div>

  <div>
    <h2>State Estimate</h2>
    <div class="state-display">
      <div>px = {estimate.px.toFixed(2)} m</div>
      <div>py = {estimate.py.toFixed(2)} m</div>
      <div>&theta; = {(estimate.theta * 180 / Math.PI).toFixed(1)}&deg;</div>
      <div>v = {estimate.v.toFixed(2)} m/s</div>
      <div>&omega; = {estimate.omega.toFixed(2)} rad/s</div>
    </div>
  </div>

  <div>
    <h2>Uncertainty</h2>
    <div class="state-display">
      <div>tr(P) = {traceP.toFixed(4)}</div>
      <div>steps = {activeSteps.predicted ? 'P' : ''}{activeSteps.corrected ? '+C' : ''}</div>
    </div>
  </div>

  <div>
    <h2>Legend</h2>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot" style="background: var(--green)"></div>
        Ground truth
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: var(--blue)"></div>
        KF estimate
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: transparent; border: 2px solid var(--blue)"></div>
        Uncertainty (2&sigma;)
      </div>
    </div>
  </div>
</div>

<style>
  .state-display {
    font-family: ui-monospace, Consolas, monospace;
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.6;
  }

  .sensor-toggles {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    cursor: pointer;
  }

  .toggle input[type="checkbox"] {
    accent-color: var(--accent);
    width: 16px;
    height: 16px;
  }

  .toggle-role {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--border);
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: auto;
  }

  .lidar-presets {
    margin-top: 10px;
  }

  .lidar-presets h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin: 0 0 6px;
  }

  .preset-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 4px 0;
    cursor: pointer;
  }

  .preset-row input[type="radio"] {
    accent-color: var(--accent);
  }

  .preset-name {
    font-weight: 500;
    min-width: 110px;
  }

  .preset-specs {
    font-size: 11px;
    color: var(--text-muted);
    flex: 1;
  }

  .preset-price {
    font-size: 11px;
    color: var(--text-muted);
    font-family: ui-monospace, Consolas, monospace;
  }
</style>
