import { Room } from './Room';
import { RobotVacuum } from './RobotVacuum';
import { PathPlanner } from './PathPlanner';
import { KalmanFilter } from './KalmanFilter';
import { WheelEncoders } from './sensors/WheelEncoders';
import { IMU } from './sensors/IMU';
import { LiDAR } from './sensors/LiDAR';
import type { RobotState, RoomConfig, SensorConfig } from './types';

export interface SimState {
  groundTruth: RobotState;
  estimate: RobotState;
  covariance: { p11: number; p12: number; p22: number };
  traceP: number;
  activeSteps: { predicted: boolean; corrected: boolean };
  waypoint: { x: number; y: number };
  lidarBeams: { angle: number; distance: number }[];
  time: number;
  running: boolean;
  sensors: SensorConfig;
}

export class SimulationLoop {
  readonly room: Room;
  readonly robot: RobotVacuum;
  readonly planner: PathPlanner;
  readonly kf: KalmanFilter;
  readonly encoders: WheelEncoders;
  readonly imu: IMU;
  readonly lidar: LiDAR;

  sensors: SensorConfig = { encoders: true, imu: false, lidar: false };

  private _running = false;
  private _time = 0;
  private _speed = 1;
  private _animFrameId: number | null = null;
  private _onUpdate: ((state: SimState) => void) | null = null;

  /** Control loop rate (Hz) */
  static readonly CONTROL_HZ = 200;
  /** IMU rate (Hz) */
  static readonly IMU_HZ = 100;
  /** LiDAR rate (Hz) — tunable at runtime */
  lidarHz = 8;
  /** Display rate — tied to requestAnimationFrame (~60 Hz) */
  static readonly DISPLAY_HZ = 60;

  private readonly dt = 1 / SimulationLoop.CONTROL_HZ;
  private _stepCount = 0;

  constructor(roomConfig: RoomConfig = { width: 6, height: 4 }) {
    this.room = new Room(roomConfig);
    this.robot = new RobotVacuum(0, 0, 0);
    this.planner = new PathPlanner(this.room, 0.5);
    this.kf = new KalmanFilter();
    this.encoders = new WheelEncoders();
    this.imu = new IMU();
    this.lidar = new LiDAR(this.room);
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
    this._stepCount = 0;
    this.robot.reset(0, 0, 0);
    this.planner.reset();
    this.kf.reset();
    this.imu.reset();
    this.emitState();
  }

  private tick = (): void => {
    if (!this._running) return;

    // Run enough control steps to fill one display frame
    const stepsPerFrame = Math.round(
      (SimulationLoop.CONTROL_HZ / SimulationLoop.DISPLAY_HZ) * this._speed,
    );
    for (let i = 0; i < stepsPerFrame; i++) {
      this.stepOnce();
    }

    this.emitState();
    this._animFrameId = requestAnimationFrame(this.tick);
  };

  private stepOnce(): void {
    // 1. Planner uses the KF estimate (as a real robot would)
    const est = this.kf.getState();
    const { vCmd, omegaCmd } = this.planner.getCommand(est);
    this.robot.step(this.dt, vCmd, omegaCmd, this.room);
    this._time += this.dt;

    // 2. Sensor readings
    const enc = this.sensors.encoders
      ? this.encoders.read(this.robot.state)
      : { v: this.kf.getState().v, omega: this.kf.getState().omega };

    // 3. KF predict (always runs — uses encoder readings as control input)
    this.kf.predict(enc.v, enc.omega, this.dt);

    // 4. KF correct (for each enabled measurement sensor, at its own rate)
    const imuEvery = Math.round(SimulationLoop.CONTROL_HZ / SimulationLoop.IMU_HZ);
    if (this.sensors.imu && this._stepCount % imuEvery === 0) {
      const z = this.imu.read(this.robot.state);
      this.kf.correct(z, this.imu.H, this.imu.R);
    }

    const lidarEvery = Math.round(SimulationLoop.CONTROL_HZ / this.lidarHz);
    if (this.sensors.lidar && this._stepCount % lidarEvery === 0) {
      const z = this.lidar.read(this.robot.state);
      this.kf.correct(z, this.lidar.H, this.lidar.R);
    }

    this._stepCount++;
  }

  private emitState(): void {
    if (this._onUpdate) {
      this._onUpdate({
        groundTruth: { ...this.robot.state },
        estimate: this.kf.getState(),
        covariance: this.kf.getPositionCovariance(),
        traceP: this.kf.getTraceP(),
        activeSteps: {
          predicted: true,
          corrected: this.sensors.imu || this.sensors.lidar,
        },
        waypoint: { ...this.planner.waypoint },
        lidarBeams: this.sensors.lidar ? this.lidar.lastBeams : [],
        time: this._time,
        running: this._running,
        sensors: { ...this.sensors },
      });
    }
  }
}
