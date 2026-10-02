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
  import JourneyStepper from './components/JourneyStepper.svelte';
  import { STAGES } from './lib/stages';
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
  let estimate = $state({ px: 0, py: 0, theta: 0, v: 0, omega: 0, bGyro: 0, bAccel: 0 });
  let sensorsEnabled = $state({ encoders: true, imu: false, lidar: false });
  let showUncertainty = $state(true);
  let activeStage = $state(1);

  $effect(() => {
    const visible = showUncertainty;
    if (ellipse) ellipse.container.visible = visible;
  });
  let currentStage = $derived(STAGES[activeStage - 1]);

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

    // Robots
    truthRobot = new RobotGraphics(0x48bb78, 0.8);
    estRobot = new RobotGraphics(0x63b3ed, 0.8);
    renderer.worldContainer.addChild(truthRobot.container);
    renderer.worldContainer.addChild(estRobot.container);

    // Uncertainty ellipse — drawn last so it stays visible even when LiDAR
    // shrinks it below the robot's footprint.
    ellipse = new EllipseGraphics();
    renderer.worldContainer.addChild(ellipse.container);

    // Click to set waypoint (only inside the room)
    renderer.app.canvas.addEventListener('click', (e: MouseEvent) => {
      const rect = renderer.app.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = renderer.screenToWorld(sx, sy);
      if (sim.room.isInside(world.x, world.y, 0.2)) {
        sim.planner.waypoint = { x: world.x, y: world.y };
      }
    });

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

  function setStage(stageId: number) {
    activeStage = stageId;
    const stage = STAGES[stageId - 1];
    sensorsEnabled = { ...stage.defaultSensors };
    if (sim) {
      sim.sensors = { ...sensorsEnabled };
    }
    reset();
    if (!stage.comingSoon) {
      sim?.start();
      running = true;
    }
  }

  function toggleSensor(sensor: 'encoders' | 'imu' | 'lidar') {
    if (!currentStage.allowedSensors[sensor]) return;
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

<div class="side-panel">
  <h1>Robot Localization, Step by Step</h1>

  <JourneyStepper {activeStage} onStageChange={setStage} />

  {#if currentStage.comingSoon}
    <div class="coming-soon-overlay">
      Coming Soon
    </div>
  {:else}
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
      {#if sensorsEnabled.encoders}
        <div class="sub-toggles">
          <label class="toggle sub">
            <input type="checkbox" checked={true} onchange={(e: Event) => { sim.encoders.diameterMismatchEnabled = (e.target as HTMLInputElement).checked; }} />
            <span>Diameter mismatch (2%)</span>
          </label>
          <label class="toggle sub">
            <input type="checkbox" checked={true} onchange={(e: Event) => { sim.encoders.slipEnabled = (e.target as HTMLInputElement).checked; }} />
            <span>Wheel slip (3%)</span>
          </label>
        </div>
      {/if}

      <label class="toggle" class:disabled={!currentStage.allowedSensors.imu}>
        <input type="checkbox" checked={sensorsEnabled.imu} disabled={!currentStage.allowedSensors.imu} onchange={() => toggleSensor('imu')} />
        <span>IMU (MPU-6050)</span>
        <span class="toggle-role">correction</span>
      </label>

      <label class="toggle" class:disabled={!currentStage.allowedSensors.lidar}>
        <input type="checkbox" checked={sensorsEnabled.lidar} disabled={!currentStage.allowedSensors.lidar} onchange={() => toggleSensor('lidar')} />
        <span>2D LiDAR</span>
        <span class="toggle-role">correction</span>
      </label>
      {#if sensorsEnabled.lidar}
        <div class="sub-toggles">
          {#each lidarPresets as preset, i}
            <label class="preset-row">
              <input type="radio" name="lidar-preset" checked={selectedLidar === i} onchange={() => selectLidar(i)} />
              <span class="preset-name">{preset.name}</span>
              <span class="preset-price">{preset.price}</span>
            </label>
            <div class="preset-specs">{preset.beams} beams · {preset.noise}m noise · {preset.rate} Hz</div>
          {/each}
          <label class="toggle sub" style="margin-top: 4px;">
            <input type="checkbox" checked={false} onchange={(e: Event) => { lidarGfx.showRays = (e.target as HTMLInputElement).checked; }} />
            <span>Show laser rays</span>
          </label>
        </div>
      {/if}
    </div>
  </div>

  {/if}
</div>

<div class="canvas-container" bind:this={canvasContainer}></div>

<div class="info-panel">
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
        <div class="legend-dot" style="background: transparent; border: 2px dashed var(--yellow)"></div>
        Uncertainty (2&sigma;)
      </div>
    </div>
    <label class="toggle legend-toggle">
      <input type="checkbox" bind:checked={showUncertainty} />
      Show uncertainty
    </label>
  </div>

  <div>
    <h2>State Estimate</h2>
    <div class="state-display">
      <div>px = {estimate.px.toFixed(2)} m</div>
      <div>py = {estimate.py.toFixed(2)} m</div>
      <div>&theta; = {(estimate.theta * 180 / Math.PI).toFixed(1)}&deg;</div>
      <div>v = {estimate.v.toFixed(2)} m/s</div>
      <div>&omega; = {estimate.omega.toFixed(2)} rad/s</div>
      <div>b<sub>gyro</sub> = {estimate.bGyro.toFixed(4)} rad/s</div>
      <div>b<sub>accel</sub> = {estimate.bAccel.toFixed(4)} m/s</div>
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
    <h2>Formulas</h2>
    <FormulaPanel {activeSteps} />
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

  .sub-toggles {
    margin-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toggle.sub {
    font-size: 11px;
    color: var(--text-muted);
  }

  .legend-toggle {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .toggle.sub input[type="checkbox"] {
    width: 13px;
    height: 13px;
  }

  .toggle.disabled {
    opacity: 0.35;
    pointer-events: none;
  }

  .coming-soon-overlay {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: var(--text-muted);
    font-size: 16px;
    font-style: italic;
    border: 1px dashed var(--border);
    border-radius: 6px;
    margin-top: 8px;
  }

  .toggle-role {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--border);
    padding: 1px 6px;
    border-radius: 3px;
    margin-left: auto;
  }

  .preset-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 2px 0 0;
    cursor: pointer;
  }

  .preset-row input[type="radio"] {
    accent-color: var(--accent);
    width: 13px;
    height: 13px;
  }

  .preset-name {
    font-weight: 500;
  }

  .preset-specs {
    font-size: 10px;
    color: var(--text-muted);
    margin: 0 0 4px 21px;
  }

  .preset-price {
    font-size: 11px;
    color: var(--text-muted);
    font-family: ui-monospace, Consolas, monospace;
    margin-left: auto;
  }
</style>
