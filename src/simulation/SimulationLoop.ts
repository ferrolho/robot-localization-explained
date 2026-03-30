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

  private readonly dt = 1 / 60;

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
    this.robot.reset(0, 0, 0);
    this.planner.reset();
    this.kf.reset();
    this.emitState();
  }

  private tick = (): void => {
    if (!this._running) return;

    const stepsPerFrame = Math.round(this._speed);
    for (let i = 0; i < stepsPerFrame; i++) {
      this.stepOnce();
    }

    this.emitState();
    this._animFrameId = requestAnimationFrame(this.tick);
  };

  private stepOnce(): void {
    // 1. Ground truth propagation
    const { vCmd, omegaCmd } = this.planner.getCommand(this.robot.state);
    this.robot.step(this.dt, vCmd, omegaCmd, this.room);
    this._time += this.dt;

    // 2. Sensor readings
    const enc = this.sensors.encoders
      ? this.encoders.read(this.robot.state)
      : { v: this.kf.getState().v, omega: this.kf.getState().omega };

    // 3. KF predict (always runs — uses encoder readings as control input)
    this.kf.predict(enc.v, enc.omega, this.dt);

    // 4. KF correct (for each enabled measurement sensor)
    if (this.sensors.imu) {
      const z = this.imu.read(this.robot.state);
      this.kf.correct(z, this.imu.H, this.imu.R);
    }

    if (this.sensors.lidar) {
      const z = this.lidar.read(this.robot.state);
      this.kf.correct(z, this.lidar.H, this.lidar.R);
    }
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
        lidarBeams: this.sensors.lidar ? this.lidar.lastBeams : [],
        time: this._time,
        running: this._running,
        sensors: { ...this.sensors },
      });
    }
  }
}
