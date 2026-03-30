import { Room } from './Room';
import { RobotVacuum } from './RobotVacuum';
import { PathPlanner } from './PathPlanner';
import type { RobotState, RoomConfig } from './types';

export interface SimState {
  groundTruth: RobotState;
  time: number;
  running: boolean;
}

export class SimulationLoop {
  readonly room: Room;
  readonly robot: RobotVacuum;
  readonly planner: PathPlanner;

  private _running = false;
  private _time = 0;
  private _speed = 1;
  private _animFrameId: number | null = null;
  private _onUpdate: ((state: SimState) => void) | null = null;

  private readonly dt = 1 / 60;

  constructor(roomConfig: RoomConfig = { width: 6, height: 4 }) {
    this.room = new Room(roomConfig);
    this.robot = new RobotVacuum(0, 0, 0);
    this.planner = new PathPlanner(this.room, 0.5);
  }

  set onUpdate(cb: (state: SimState) => void) {
    this._onUpdate = cb;
  }

  set speed(s: number) {
    this._speed = Math.max(0.25, Math.min(4, s));
  }

  get speed(): number {
    return this._speed;
  }

  get running(): boolean {
    return this._running;
  }

  start(): void {
    if (this._running) return;
    this._running = true;
    this.tick();
  }

  pause(): void {
    this._running = false;
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }

  reset(): void {
    this.pause();
    this._time = 0;
    this.robot.reset(0, 0, 0);
    this.planner.reset();
    this.emitState();
  }

  private tick = (): void => {
    if (!this._running) return;

    // Run multiple physics steps for speed multiplier
    const stepsPerFrame = Math.round(this._speed);
    for (let i = 0; i < stepsPerFrame; i++) {
      this.stepOnce();
    }

    this.emitState();
    this._animFrameId = requestAnimationFrame(this.tick);
  };

  private stepOnce(): void {
    const { vCmd, omegaCmd } = this.planner.getCommand(this.robot.state);
    this.robot.step(this.dt, vCmd, omegaCmd, this.room);
    this._time += this.dt;
  }

  private emitState(): void {
    if (this._onUpdate) {
      this._onUpdate({
        groundTruth: { ...this.robot.state },
        time: this._time,
        running: this._running,
      });
    }
  }
}
