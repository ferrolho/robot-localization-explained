/** Robot state: [px, py, theta, v, omega] */
export interface RobotState {
  px: number;     // x position (metres)
  py: number;     // y position (metres)
  theta: number;  // heading angle (radians, 0 = right)
  v: number;      // linear velocity (m/s)
  omega: number;  // angular velocity (rad/s)
}

export interface SensorConfig {
  encoders: boolean;
  imu: boolean;
  lidar: boolean;
}

export interface RoomConfig {
  width: number;   // metres
  height: number;  // metres
}

export interface Vec2 {
  x: number;
  y: number;
}
