/**
 * Headless diagnostic: run the simulation with all sensors on and dump
 * per-step data to CSV so we can see what drives the jitter.
 */
import { Room } from '../src/simulation/Room';
import { RobotVacuum } from '../src/simulation/RobotVacuum';
import { PathPlanner } from '../src/simulation/PathPlanner';
import { KalmanFilter } from '../src/simulation/KalmanFilter';
import { WheelEncoders } from '../src/simulation/sensors/WheelEncoders';
import { IMU } from '../src/simulation/sensors/IMU';
import { LiDAR } from '../src/simulation/sensors/LiDAR';
import { mat, matGet, matMul, matSub } from '../src/lib/matrix';

const CONTROL_HZ = 200;
const IMU_HZ = 100;
const LIDAR_HZ = 8; // RPLiDAR A1
const dt = 1 / CONTROL_HZ;
const steps = CONTROL_HZ * 10; // 10 seconds

const room = new Room({ width: 6, height: 4 });
const robot = new RobotVacuum(0, 0, 0);
const planner = new PathPlanner(room, 0.5);
const kf = new KalmanFilter();
const encoders = new WheelEncoders();
const imu = new IMU();
const lidar = new LiDAR(room, 360, 0.03); // RPLiDAR A1 defaults

// CSV header
console.log([
  'step', 't',
  'gt_px', 'gt_py', 'gt_theta', 'gt_v', 'gt_omega',
  'est_px', 'est_py', 'est_theta', 'est_v', 'est_omega',
  'err_px', 'err_py',
  'P00', 'P11', 'P22', 'P33', 'P44',
  'lidar_innov_px', 'lidar_innov_py',
  'lidar_K00', 'lidar_K10',
  'imu_innov_v', 'imu_innov_omega',
].join(','));

for (let i = 0; i < steps; i++) {
  const t = i * dt;

  // Planner uses estimate (as in real loop)
  const est = kf.getState();
  const { vCmd, omegaCmd } = planner.getCommand(est);
  robot.step(dt, vCmd, omegaCmd, room);

  // Encoders + predict
  const enc = encoders.read(robot.state);
  kf.predict(enc.v, enc.omega, dt);

  // IMU correct at IMU_HZ
  const imuEvery = Math.round(CONTROL_HZ / IMU_HZ);
  let imuInnovation = mat(2, 1, [0, 0]);
  if (i % imuEvery === 0) {
    const zImu = imu.read(robot.state);
    imuInnovation = matSub(zImu, matMul(imu.H, kf.x));
    kf.correct(zImu, imu.H, imu.R);
  }

  // LiDAR correct at LIDAR_HZ
  const lidarEvery = Math.round(CONTROL_HZ / LIDAR_HZ);
  const lidarThisStep = i % lidarEvery === 0;
  let lidarInnovation = mat(2, 1, [0, 0]);
  if (lidarThisStep) {
    const zLidar = lidar.read(robot.state);
    lidarInnovation = matSub(zLidar, matMul(lidar.H, kf.x));
    kf.correct(zLidar, lidar.H, lidar.R);
  }
  const K = kf.K;

  const gt = robot.state;
  const e = kf.getState();

  console.log([
    i, t.toFixed(4),
    gt.px.toFixed(4), gt.py.toFixed(4), gt.theta.toFixed(4), gt.v.toFixed(4), gt.omega.toFixed(4),
    e.px.toFixed(4), e.py.toFixed(4), e.theta.toFixed(4), e.v.toFixed(4), e.omega.toFixed(4),
    (e.px - gt.px).toFixed(4), (e.py - gt.py).toFixed(4),
    matGet(kf.P, 0, 0).toFixed(6), matGet(kf.P, 1, 1).toFixed(6),
    matGet(kf.P, 2, 2).toFixed(6), matGet(kf.P, 3, 3).toFixed(6),
    matGet(kf.P, 4, 4).toFixed(6),
    matGet(lidarInnovation, 0, 0).toFixed(4), matGet(lidarInnovation, 1, 0).toFixed(4),
    K ? matGet(K, 0, 0).toFixed(4) : '0', K ? matGet(K, 1, 0).toFixed(4) : '0',
    matGet(imuInnovation, 0, 0).toFixed(4), matGet(imuInnovation, 1, 0).toFixed(4),
  ].join(','));
}
