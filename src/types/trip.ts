export interface Coordinate {
  lat: number;
  lng: number;
  speed?: number | null; // in km/h
  heading?: number | null; // 0-360 degrees
  altitude?: number | null; // meters
  accuracy?: number | null; // meters
  timestamp: number; // ms
}

export type TripCategory = 'business' | 'personal';

export interface Trip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  distanceKm: number;
  category: TripCategory;
  purpose: string;
  notes: string;
  vehicleName: string;
  startAddress: string;
  endAddress: string;
  coordinates: Coordinate[];
  avgSpeedKmH: number;
  maxSpeedKmH: number;
  syncedToCloud: boolean;
  status: 'confirmed' | 'pending_confirmation' | 'discarded';
  bluetoothTriggered: boolean;
  bluetoothDeviceName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BluetoothDeviceConfig {
  id: string;
  name: string;
  autoStart: boolean;
  autoStop: boolean;
  lastConnected?: number;
  isPaired: boolean;
  signalStrength?: 'strong' | 'medium' | 'weak';
}

export interface UserSettings {
  defaultCategory: TripCategory;
  biometricLockEnabled: boolean;
  biometricPin: string;
  hasEnrolledBiometrics: boolean;
  autoLockOnLeave: boolean;
  pushNotificationsEnabled: boolean;
  minAccuracyMeters: number;
  autoPauseSpeedKmH: number;
  pairedDevices: BluetoothDeviceConfig[];
  activeBluetoothDeviceId?: string;
}

export type ViewTab = 'live' | 'history' | 'dashboard' | 'bluetooth' | 'settings';
