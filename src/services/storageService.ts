import { Trip, UserSettings, BluetoothDeviceConfig } from '../types/trip';

const TRIPS_STORAGE_KEY = 'aerotrack_trips_v1';
const SETTINGS_STORAGE_KEY = 'aerotrack_settings_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  defaultCategory: 'business',
  biometricLockEnabled: false,
  biometricPin: '1234',
  hasEnrolledBiometrics: false,
  autoLockOnLeave: false,
  pushNotificationsEnabled: true,
  minAccuracyMeters: 30,
  autoPauseSpeedKmH: 0.8,
  pairedDevices: [
    {
      id: 'dev_bmw_audio',
      name: 'BMW iDrive Cockpit Audio',
      autoStart: true,
      autoStop: true,
      isPaired: true,
      signalStrength: 'strong',
      lastConnected: Date.now() - 3600000 * 4,
    },
    {
      id: 'dev_obd_dongle',
      name: 'Veepeak OBD-II BLE Scanner',
      autoStart: true,
      autoStop: true,
      isPaired: true,
      signalStrength: 'strong',
      lastConnected: Date.now() - 3600000 * 24 * 2,
    },
  ],
  activeBluetoothDeviceId: 'dev_bmw_audio',
};

// Generate realistic historical trips for rich dashboard charts (current year 2026 + previous months)
function generateSeedTrips(): Trip[] {
  const now = new Date('2026-10-24T11:00:00Z').getTime();
  const dayMs = 86400000;

  const sampleTrips: Trip[] = [
    {
      id: 'trip_seed_10_23',
      title: 'South Tech Hub Client Review',
      startTime: now - dayMs * 1 - 3600000 * 3,
      endTime: now - dayMs * 1 - 3600000 * 2 - 1800000,
      durationSeconds: 2520, // 42 min
      distanceKm: 28.45,
      category: 'business',
      purpose: 'Quarterly Infrastructure Review',
      notes: 'Highway 101 moderate traffic. Fuel stop at Shell.',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ, 100 Enterprise Way',
      endAddress: '780 Horizon Ridge, Suite 400',
      avgSpeedKmH: 40.6,
      maxSpeedKmH: 104.2,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      bluetoothDeviceName: 'BMW iDrive Cockpit Audio',
      createdAt: now - dayMs * 1,
      updatedAt: now - dayMs * 1,
      coordinates: [
        { lat: 37.7749, lng: -122.4194, speed: 30, timestamp: now - dayMs * 1 - 2500000 },
        { lat: 37.7550, lng: -122.4050, speed: 75, timestamp: now - dayMs * 1 - 2000000 },
        { lat: 37.7200, lng: -122.3900, speed: 104, timestamp: now - dayMs * 1 - 1500000 },
        { lat: 37.6700, lng: -122.3850, speed: 92, timestamp: now - dayMs * 1 - 1000000 },
        { lat: 37.6250, lng: -122.3800, speed: 45, timestamp: now - dayMs * 1 - 500000 },
      ],
    },
    {
      id: 'trip_seed_10_22',
      title: 'Westfield Mall Supplies & Errand',
      startTime: now - dayMs * 2 - 3600000 * 5,
      endTime: now - dayMs * 2 - 3600000 * 4 - 300000,
      durationSeconds: 1500, // 25 min
      distanceKm: 11.2,
      category: 'personal',
      purpose: 'Home Supplies & Hardware Store',
      notes: 'Weekend home improvements',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Home Residence',
      endAddress: 'Westfield Retail District',
      avgSpeedKmH: 26.9,
      maxSpeedKmH: 62.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: false,
      createdAt: now - dayMs * 2,
      updatedAt: now - dayMs * 2,
      coordinates: [
        { lat: 37.7749, lng: -122.4194, speed: 25, timestamp: now - dayMs * 2 - 1500000 },
        { lat: 37.7850, lng: -122.4300, speed: 48, timestamp: now - dayMs * 2 - 1000000 },
        { lat: 37.7950, lng: -122.4450, speed: 32, timestamp: now - dayMs * 2 - 500000 },
      ],
    },
    {
      id: 'trip_seed_10_20',
      title: 'Apex Industrial Plant Inspection',
      startTime: now - dayMs * 4 - 3600000 * 2,
      endTime: now - dayMs * 4 - 3600000 * 1,
      durationSeconds: 3600, // 60 min
      distanceKm: 52.8,
      category: 'business',
      purpose: 'Plant Safety Audit & Hardware Inspection',
      notes: 'Full day site visit. Tolled expressway.',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ, 100 Enterprise Way',
      endAddress: 'Apex Manufacturing Park, Gate 3',
      avgSpeedKmH: 52.8,
      maxSpeedKmH: 112.5,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      bluetoothDeviceName: 'BMW iDrive Cockpit Audio',
      createdAt: now - dayMs * 4,
      updatedAt: now - dayMs * 4,
      coordinates: [
        { lat: 37.7749, lng: -122.4194, speed: 40, timestamp: now - dayMs * 4 - 3600000 },
        { lat: 37.7100, lng: -122.3800, speed: 105, timestamp: now - dayMs * 4 - 2400000 },
        { lat: 37.5800, lng: -122.3400, speed: 112, timestamp: now - dayMs * 4 - 1200000 },
      ],
    },
    {
      id: 'trip_seed_10_18',
      title: 'Supplier Logistics Depot Meeting',
      startTime: now - dayMs * 6 - 3600000 * 4,
      endTime: now - dayMs * 6 - 3600000 * 3 - 900000,
      durationSeconds: 2700,
      distanceKm: 34.6,
      category: 'business',
      purpose: 'Supply Chain Negotiations',
      notes: 'Signed delivery agreements for Q4',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ',
      endAddress: 'East Bay Logistics Center',
      avgSpeedKmH: 46.1,
      maxSpeedKmH: 98.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      bluetoothDeviceName: 'BMW iDrive Cockpit Audio',
      createdAt: now - dayMs * 6,
      updatedAt: now - dayMs * 6,
      coordinates: [],
    },
    // September 2026 trips
    {
      id: 'trip_seed_09_25',
      title: 'Bay Area Regional Conference',
      startTime: now - dayMs * 29,
      endTime: now - dayMs * 29 + 4200000,
      durationSeconds: 4200,
      distanceKm: 64.2,
      category: 'business',
      purpose: 'Industry Tech Summit 2026',
      notes: 'Keynote presentation attendance',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Home Residence',
      endAddress: 'Convention Expo Arena',
      avgSpeedKmH: 55.0,
      maxSpeedKmH: 110.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      createdAt: now - dayMs * 29,
      updatedAt: now - dayMs * 29,
      coordinates: [],
    },
    {
      id: 'trip_seed_09_14',
      title: 'Family Coastal Weekend Gateway',
      startTime: now - dayMs * 40,
      endTime: now - dayMs * 40 + 7200000,
      durationSeconds: 7200,
      distanceKm: 98.4,
      category: 'personal',
      purpose: 'Family Vacation Drive',
      notes: 'Pacific coast highway drive',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Home Residence',
      endAddress: 'Monterey Bay Resort',
      avgSpeedKmH: 49.2,
      maxSpeedKmH: 95.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: false,
      createdAt: now - dayMs * 40,
      updatedAt: now - dayMs * 40,
      coordinates: [],
    },
    // August 2026 trips
    {
      id: 'trip_seed_08_20',
      title: 'Silicon Valley Branch Consultations',
      startTime: now - dayMs * 65,
      endTime: now - dayMs * 65 + 3600000 * 2,
      durationSeconds: 7200,
      distanceKm: 88.0,
      category: 'business',
      purpose: 'Multi-office coordination',
      notes: 'Palo Alto & San Jose campuses',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ',
      endAddress: 'South Bay Campus',
      avgSpeedKmH: 44.0,
      maxSpeedKmH: 105.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      createdAt: now - dayMs * 65,
      updatedAt: now - dayMs * 65,
      coordinates: [],
    },
    {
      id: 'trip_seed_08_08',
      title: 'Weekend Mountain Trail',
      startTime: now - dayMs * 77,
      endTime: now - dayMs * 77 + 5400000,
      durationSeconds: 5400,
      distanceKm: 46.5,
      category: 'personal',
      purpose: 'Hiking & Outdoor Recreation',
      notes: 'Mount Tamalpais summit parking',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Home Residence',
      endAddress: 'Summit Trailhead',
      avgSpeedKmH: 31.0,
      maxSpeedKmH: 70.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: false,
      createdAt: now - dayMs * 77,
      updatedAt: now - dayMs * 77,
      coordinates: [],
    },
    // July 2026 trips
    {
      id: 'trip_seed_07_12',
      title: 'Summer Client Roadshow',
      startTime: now - dayMs * 104,
      endTime: now - dayMs * 104 + 10800000,
      durationSeconds: 10800,
      distanceKm: 142.0,
      category: 'business',
      purpose: 'Regional Client Demonstrations',
      notes: 'Visited 4 accounts across the bay',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ',
      endAddress: 'Regional Client Offices',
      avgSpeedKmH: 47.3,
      maxSpeedKmH: 115.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      createdAt: now - dayMs * 104,
      updatedAt: now - dayMs * 104,
      coordinates: [],
    },
    // May 2026 trips
    {
      id: 'trip_seed_05_19',
      title: 'Spring Vendor Summit',
      startTime: now - dayMs * 158,
      endTime: now - dayMs * 158 + 4800000,
      durationSeconds: 4800,
      distanceKm: 76.5,
      category: 'business',
      purpose: 'Hardware Vendor Review',
      notes: 'Hardware contracts signed',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ',
      endAddress: 'Silicon Valley Hotel',
      avgSpeedKmH: 57.3,
      maxSpeedKmH: 108.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      createdAt: now - dayMs * 158,
      updatedAt: now - dayMs * 158,
      coordinates: [],
    },
    // 2025 trips for yearly comparison chart
    {
      id: 'trip_seed_2025_11',
      title: 'Annual Client Conferences 2025',
      startTime: new Date('2025-11-15T09:00:00Z').getTime(),
      endTime: new Date('2025-11-15T12:30:00Z').getTime(),
      durationSeconds: 12600,
      distanceKm: 184.5,
      category: 'business',
      purpose: 'Annual Regional Assembly',
      notes: '2025 wrap-up meetings',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Corporate HQ',
      endAddress: 'West Coast Convention Center',
      avgSpeedKmH: 52.7,
      maxSpeedKmH: 114.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: true,
      createdAt: new Date('2025-11-15T13:00:00Z').getTime(),
      updatedAt: new Date('2025-11-15T13:00:00Z').getTime(),
      coordinates: [],
    },
    {
      id: 'trip_seed_2025_08',
      title: 'Summer Interstate Family Holiday',
      startTime: new Date('2025-08-10T08:00:00Z').getTime(),
      endTime: new Date('2025-08-10T14:00:00Z').getTime(),
      durationSeconds: 21600,
      distanceKm: 340.0,
      category: 'personal',
      purpose: 'Summer Roadtrip',
      notes: 'National Park Tour',
      vehicleName: 'Primary Fleet Vehicle',
      startAddress: 'Home Residence',
      endAddress: 'National Park Entrance',
      avgSpeedKmH: 56.6,
      maxSpeedKmH: 110.0,
      syncedToCloud: true,
      status: 'confirmed',
      bluetoothTriggered: false,
      createdAt: new Date('2025-08-10T15:00:00Z').getTime(),
      updatedAt: new Date('2025-08-10T15:00:00Z').getTime(),
      coordinates: [],
    },
  ];

  return sampleTrips;
}

class StorageService {
  public getTrips(): Trip[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(TRIPS_STORAGE_KEY);
      if (!data) {
        const seeded = generateSeedTrips();
        this.saveTrips(seeded);
        return seeded;
      }
      return JSON.parse(data);
    } catch {
      return generateSeedTrips();
    }
  }

  public saveTrips(trips: Trip[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
    } catch (err) {
      console.error('Error saving trips to storage:', err);
    }
  }

  public addTrip(trip: Trip): void {
    const trips = this.getTrips();
    const existingIndex = trips.findIndex((t) => t.id === trip.id);
    if (existingIndex >= 0) {
      trips[existingIndex] = trip;
    } else {
      trips.unshift(trip);
    }
    this.saveTrips(trips);
  }

  public updateTrip(id: string, updates: Partial<Trip>): Trip | null {
    const trips = this.getTrips();
    const index = trips.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = trips[index];
    const updated: Trip = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    trips[index] = updated;
    this.saveTrips(trips);
    return updated;
  }

  public deleteTrip(id: string): boolean {
    const trips = this.getTrips();
    const filtered = trips.filter((t) => t.id !== id);
    if (filtered.length !== trips.length) {
      this.saveTrips(filtered);
      return true;
    }
    return false;
  }

  public confirmTripToCloud(id: string, updates?: Partial<Trip>): Trip | null {
    return this.updateTrip(id, {
      ...updates,
      status: 'confirmed',
      syncedToCloud: true,
    });
  }

  public getSettings(): UserSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!data) {
        this.saveSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public saveSettings(settings: UserSettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving settings to storage:', err);
    }
  }
}

export const storageService = new StorageService();
