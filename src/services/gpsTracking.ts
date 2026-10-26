import { Coordinate } from '../types/trip';

const EARTH_RADIUS_KM = 6371.0088; // WGS84 mean earth radius in kilometers

/**
 * Calculates high-precision distance between two geographic coordinates using the Haversine formula.
 * Returns distance in kilometers (km).
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate bearing in degrees between two coordinates (0-360)
 */
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Validates and filters GPS coordinates to reject jitter, indoor multipath, and teleportation spikes.
 */
export function isCoordinateAccurate(
  newCoord: Coordinate,
  prevCoord: Coordinate | null,
  maxAccuracyMeters: number = 35
): { valid: boolean; reason?: string } {
  // Check raw GPS accuracy radius
  if (newCoord.accuracy && newCoord.accuracy > maxAccuracyMeters) {
    return { valid: false, reason: `Accuracy radius (${Math.round(newCoord.accuracy)}m) exceeds limit` };
  }

  if (!prevCoord) {
    return { valid: true };
  }

  const distKm = calculateHaversineDistanceKm(
    prevCoord.lat,
    prevCoord.lng,
    newCoord.lat,
    newCoord.lng
  );

  const timeDiffHours = (newCoord.timestamp - prevCoord.timestamp) / 3600000;

  // If timestamp didn't advance
  if (timeDiffHours <= 0) {
    return { valid: false, reason: 'Zero or backwards time progression' };
  }

  const speedKmH = distKm / timeDiffHours;

  // Reject impossible vehicle speed (> 240 km/h)
  if (speedKmH > 240) {
    return { valid: false, reason: `Implausible speed spike: ${Math.round(speedKmH)} km/h` };
  }

  // Jitter check: if distance is tiny (< 3 meters) and speed < 1 km/h, treat as vehicle stationary
  if (distKm * 1000 < 3 && speedKmH < 1.0) {
    return { valid: false, reason: 'Stationary GPS noise jitter' };
  }

  return { valid: true };
}

/**
 * Pre-baked realistic driving routes for simulation mode.
 * Provides real GPS coordinates, realistic acceleration, highway and arterial road speeds.
 */
export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  startAddress: string;
  endAddress: string;
  category: 'business' | 'personal';
  purpose: string;
  points: { lat: number; lng: number; baseSpeedKmH: number }[];
}

export const SIMULATION_ROUTES: SimulationPreset[] = [
  {
    id: 'tech_campus_to_airport',
    name: 'Tech Campus to International Terminal',
    description: 'Highway and express connector drive (14.2 km)',
    startAddress: '450 Innovation Blvd, District 7',
    endAddress: 'Terminal 2, Sky Harbor Airport',
    category: 'business',
    purpose: 'Executive Airport Transfer',
    points: [
      { lat: 37.7749, lng: -122.4194, baseSpeedKmH: 25 },
      { lat: 37.7725, lng: -122.4150, baseSpeedKmH: 42 },
      { lat: 37.7680, lng: -122.4080, baseSpeedKmH: 55 },
      { lat: 37.7590, lng: -122.4010, baseSpeedKmH: 78 },
      { lat: 37.7450, lng: -122.3960, baseSpeedKmH: 95 },
      { lat: 37.7280, lng: -122.3920, baseSpeedKmH: 104 },
      { lat: 37.7050, lng: -122.3890, baseSpeedKmH: 108 },
      { lat: 37.6750, lng: -122.3880, baseSpeedKmH: 98 },
      { lat: 37.6520, lng: -122.3910, baseSpeedKmH: 85 },
      { lat: 37.6320, lng: -122.4000, baseSpeedKmH: 62 },
      { lat: 37.6213, lng: -122.3790, baseSpeedKmH: 35 },
      { lat: 37.6180, lng: -122.3750, baseSpeedKmH: 18 },
    ],
  },
  {
    id: 'downtown_client_audit',
    name: 'Metropolitan Client Consultation',
    description: 'City arterial transit with signal stops (6.8 km)',
    startAddress: 'North Financial Tower, Suite 1400',
    endAddress: '720 Park Avenue Medical Center',
    category: 'business',
    purpose: 'Client Site Inspection & Audit',
    points: [
      { lat: 40.7128, lng: -74.006, baseSpeedKmH: 15 },
      { lat: 40.7155, lng: -74.002, baseSpeedKmH: 34 },
      { lat: 40.7210, lng: -73.998, baseSpeedKmH: 42 },
      { lat: 40.7280, lng: -73.992, baseSpeedKmH: 0 }, // traffic light
      { lat: 40.7350, lng: -73.988, baseSpeedKmH: 38 },
      { lat: 40.7420, lng: -73.984, baseSpeedKmH: 45 },
      { lat: 40.7510, lng: -73.979, baseSpeedKmH: 30 },
      { lat: 40.7580, lng: -73.974, baseSpeedKmH: 22 },
      { lat: 40.7640, lng: -73.968, baseSpeedKmH: 12 },
    ],
  },
  {
    id: 'weekend_lakeside_drive',
    name: 'Weekend Country & Lakeside Drive',
    description: 'Relaxed scenic road trip (22.5 km)',
    startAddress: '18 Cedar Hill Lane',
    endAddress: 'Pine Valley Marina & Lodge',
    category: 'personal',
    purpose: 'Family Weekend Excursion',
    points: [
      { lat: 45.5017, lng: -73.5673, baseSpeedKmH: 30 },
      { lat: 45.5120, lng: -73.5780, baseSpeedKmH: 52 },
      { lat: 45.5280, lng: -73.6020, baseSpeedKmH: 68 },
      { lat: 45.5450, lng: -73.6350, baseSpeedKmH: 82 },
      { lat: 45.5700, lng: -73.6800, baseSpeedKmH: 90 },
      { lat: 45.6020, lng: -73.7300, baseSpeedKmH: 88 },
      { lat: 45.6350, lng: -73.7850, baseSpeedKmH: 74 },
      { lat: 45.6600, lng: -73.8200, baseSpeedKmH: 50 },
      { lat: 45.6820, lng: -73.8500, baseSpeedKmH: 25 },
    ],
  },
];
