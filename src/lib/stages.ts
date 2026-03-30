export interface LearningStage {
  id: number;
  label: string;
  description: string;
  allowedSensors: { encoders: boolean; imu: boolean; lidar: boolean };
  defaultSensors: { encoders: boolean; imu: boolean; lidar: boolean };
  comingSoon?: boolean;
}

export const STAGES: LearningStage[] = [
  {
    id: 1,
    label: 'Dead Reckoning',
    description: 'Estimate position using wheel encoders alone. Watch how errors accumulate without correction.',
    allowedSensors: { encoders: true, imu: false, lidar: false },
    defaultSensors: { encoders: true, imu: false, lidar: false },
  },
  {
    id: 2,
    label: 'Kalman Filter',
    description: 'Add an IMU to correct drift. The filter fuses encoder prediction with IMU measurements.',
    allowedSensors: { encoders: true, imu: true, lidar: false },
    defaultSensors: { encoders: true, imu: true, lidar: false },
  },
  {
    id: 3,
    label: 'Localization',
    description: 'Add LiDAR for absolute position from a known map. Uncertainty drops dramatically.',
    allowedSensors: { encoders: true, imu: true, lidar: true },
    defaultSensors: { encoders: true, imu: true, lidar: true },
  },
  {
    id: 4,
    label: 'SLAM',
    description: 'Simultaneous Localization and Mapping — build the map while navigating.',
    allowedSensors: { encoders: true, imu: true, lidar: true },
    defaultSensors: { encoders: true, imu: true, lidar: true },
    comingSoon: true,
  },
];
