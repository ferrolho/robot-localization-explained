<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SimulationLoop, type SimState } from './simulation/SimulationLoop';
  import { PixiRenderer } from './rendering/PixiRenderer';
  import { RoomGraphics } from './rendering/RoomGraphics';
  import { RobotGraphics } from './rendering/RobotGraphics';
  import { TrailGraphics } from './rendering/TrailGraphics';

  let canvasContainer: HTMLElement;
  let renderer: PixiRenderer;
  let sim: SimulationLoop;
  let truthRobot: RobotGraphics;
  let trail: TrailGraphics;

  let running = $state(false);
  let time = $state(0);
  let frameCount = 0;

  onMount(async () => {
    sim = new SimulationLoop({ width: 6, height: 4 });
    renderer = new PixiRenderer();
    await renderer.init(canvasContainer, sim.room);

    // Room
    const roomGfx = new RoomGraphics(sim.room);
    renderer.worldContainer.addChild(roomGfx.container);

    // Trail
    trail = new TrailGraphics(0x48bb78);
    renderer.worldContainer.addChild(trail.container);

    // Ground truth robot
    truthRobot = new RobotGraphics(0x48bb78);
    renderer.worldContainer.addChild(truthRobot.container);

    // Update callback
    sim.onUpdate = (state: SimState) => {
      truthRobot.update(state.groundTruth);
      running = state.running;
      time = state.time;

      frameCount++;
      if (frameCount % 3 === 0) {
        trail.addPoint(state.groundTruth.px, state.groundTruth.py);
        trail.redraw();
      }
    };

    // Auto-start
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
    trail?.clear();
    running = false;
    time = 0;
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
    <h2>Legend</h2>
    <div class="legend">
      <div class="legend-item">
        <div class="legend-dot" style="background: var(--green)"></div>
        Ground truth
      </div>
      <div class="legend-item">
        <div class="legend-dot" style="background: var(--blue)"></div>
        Estimated (coming soon)
      </div>
    </div>
  </div>
</div>
