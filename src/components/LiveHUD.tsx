import React, { useState, useEffect, useRef } from 'react';
import { Trip, TripCategory, Coordinate } from '../types/trip';
import {
  calculateHaversineDistanceKm,
  isCoordinateAccurate,
  calculateBearing,
  SIMULATION_ROUTES,
  SimulationPreset,
} from '../services/gpsTracking';
import { TripMap } from './TripMap';
import {
  Play,
  Square,
  Pause,
  Navigation,
  Gauge,
  Clock,
  Compass,
  Radio,
  Briefcase,
  User,
  Sparkles,
  Satellite,
} from 'lucide-react';

interface LiveHUDProps {
  isTripActive: boolean;
  activeTrip: Trip | null;
  defaultCategory: TripCategory;
  onStartTrip: (category: TripCategory, bluetoothDeviceName?: string) => void;
  onStopTrip: (trip: Trip) => void;
  onUpdateActiveTrip: (trip: Trip) => void;
}

export const LiveHUD: React.FC<LiveHUDProps> = ({
  isTripActive,
  activeTrip,
  defaultCategory,
  onStartTrip,
  onStopTrip,
  onUpdateActiveTrip,
}) => {
  const [currentSpeedKmH, setCurrentSpeedKmH] = useState<number>(0);
  const [maxSpeedKmH, setMaxSpeedKmH] = useState<number>(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [currentCategory, setCurrentCategory] = useState<TripCategory>(defaultCategory);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simPreset, setSimPreset] = useState<SimulationPreset>(SIMULATION_ROUTES[0]);

  const watchIdRef = useRef<number | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const activeTripRef = useRef<Trip | null>(activeTrip);
  activeTripRef.current = activeTrip;

  // Real Geolocation Tracking setup
  useEffect(() => {
    if (isTripActive && !isSimulating && !isPaused) {
      if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude, speed, heading: h, altitude, accuracy } = pos.coords;
            const speedKmh = speed != null ? Math.max(0, speed * 3.6) : 0;

            const newCoord: Coordinate = {
              lat: latitude,
              lng: longitude,
              speed: speedKmh,
              heading: h || 0,
              altitude: altitude || 0,
              accuracy: accuracy || 5,
              timestamp: pos.timestamp,
            };

            setGpsAccuracy(accuracy || 5);
            setCurrentSpeedKmH(speedKmh);
            if (h != null) setHeading(h);

            // Filter coordinate
            const currentTrip = activeTripRef.current;
            if (!currentTrip) return;

            const lastCoord = currentTrip.coordinates[currentTrip.coordinates.length - 1] || null;
            const filterCheck = isCoordinateAccurate(newCoord, lastCoord, 40);

            if (filterCheck.valid) {
              let addedDist = 0;
              if (lastCoord) {
                addedDist = calculateHaversineDistanceKm(
                  lastCoord.lat,
                  lastCoord.lng,
                  newCoord.lat,
                  newCoord.lng
                );
              }

              const newDist = currentTrip.distanceKm + addedDist;
              const newMaxSpeed = Math.max(currentTrip.maxSpeedKmH, speedKmh);
              const newCoords = [...currentTrip.coordinates, newCoord];
              const now = Date.now();
              const durationSec = Math.max(1, Math.floor((now - currentTrip.startTime) / 1000));
              const avgSpd = durationSec > 0 ? newDist / (durationSec / 3600) : 0;

              setMaxSpeedKmH(newMaxSpeed);

              onUpdateActiveTrip({
                ...currentTrip,
                distanceKm: newDist,
                maxSpeedKmH: newMaxSpeed,
                avgSpeedKmH: avgSpd,
                durationSeconds: durationSec,
                coordinates: newCoords,
                category: currentCategory,
                updatedAt: now,
              });
            }
          },
          (err) => {
            console.warn('GPS position watch warning:', err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 1000,
            timeout: 10000,
          }
        );
      }
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTripActive, isSimulating, isPaused, currentCategory, onUpdateActiveTrip]);

  // Simulation mode runner
  useEffect(() => {
    if (isTripActive && isSimulating && !isPaused) {
      let ptIndex = 0;
      const pts = simPreset.points;

      simIntervalRef.current = window.setInterval(() => {
        const currentTrip = activeTripRef.current;
        if (!currentTrip) return;

        const targetPoint = pts[ptIndex % pts.length];
        const speedVariance = (Math.random() - 0.5) * 6;
        const currentSpd = Math.max(0, targetPoint.baseSpeedKmH + speedVariance);

        const lastCoord = currentTrip.coordinates[currentTrip.coordinates.length - 1];
        let calculatedBearing = 45;
        if (lastCoord) {
          calculatedBearing = calculateBearing(lastCoord.lat, lastCoord.lng, targetPoint.lat, targetPoint.lng);
        }

        const newCoord: Coordinate = {
          lat: targetPoint.lat + (Math.random() - 0.5) * 0.0005,
          lng: targetPoint.lng + (Math.random() - 0.5) * 0.0005,
          speed: currentSpd,
          heading: calculatedBearing,
          accuracy: 4 + Math.random() * 3,
          timestamp: Date.now(),
        };

        let addedKm = 0;
        if (lastCoord) {
          addedKm = calculateHaversineDistanceKm(lastCoord.lat, lastCoord.lng, newCoord.lat, newCoord.lng);
        } else {
          addedKm = 0.05;
        }

        const nextDist = currentTrip.distanceKm + addedKm;
        const nextMax = Math.max(currentTrip.maxSpeedKmH, currentSpd);
        const durationSec = Math.floor((Date.now() - currentTrip.startTime) / 1000);
        const avg = durationSec > 0 ? nextDist / (durationSec / 3600) : 0;

        setCurrentSpeedKmH(currentSpd);
        setMaxSpeedKmH(nextMax);
        setHeading(calculatedBearing);
        setGpsAccuracy(4);

        onUpdateActiveTrip({
          ...currentTrip,
          distanceKm: nextDist,
          maxSpeedKmH: nextMax,
          avgSpeedKmH: avg,
          durationSeconds: durationSec,
          coordinates: [...currentTrip.coordinates, newCoord],
          updatedAt: Date.now(),
        });

        ptIndex++;
      }, 1500);
    } else {
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    }

    return () => {
      if (simIntervalRef.current !== null) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, [isTripActive, isSimulating, isPaused, simPreset, onUpdateActiveTrip]);

  const handleStartManualDrive = (asSimulation: boolean = false) => {
    setIsSimulating(asSimulation);
    setIsPaused(false);
    onStartTrip(currentCategory);
  };

  const handleStopDrive = () => {
    if (activeTrip) {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      setIsSimulating(false);
      onStopTrip(activeTrip);
    }
  };

  // Safe compact timer formatting designed for mobile screens
  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs === 0) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${hrs}h ${mins.toString().padStart(2, '0')}m`;
  };

  const currentDist = activeTrip?.distanceKm || 0;
  const currentDuration = activeTrip?.durationSeconds || 0;

  return (
    <div className="space-y-6">
      {/* Top Cockpit Header Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Live Cockpit HUD
              </h2>
              {isTripActive && (
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  LOGGING ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Precision GPS trip computer in kilometers
            </p>
          </div>
        </div>

        {/* Category Selector (Business vs Personal) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
          <button
            onClick={() => {
              setCurrentCategory('business');
              if (activeTrip) {
                onUpdateActiveTrip({ ...activeTrip, category: 'business' });
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentCategory === 'business'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Business</span>
          </button>
          <button
            onClick={() => {
              setCurrentCategory('personal');
              if (activeTrip) {
                onUpdateActiveTrip({ ...activeTrip, category: 'personal' });
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              currentCategory === 'personal'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Personal</span>
          </button>
        </div>
      </div>

      {/* Main Gauges Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Giant Distance Odometer Card */}
        <div className="lg:col-span-2 p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
          {/* Ambient night glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Top meta strip */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-6">
            <div className="flex items-center gap-2">
              <Satellite className="w-4 h-4 text-emerald-400" />
              <span>
                GPS:{' '}
                <strong className="text-slate-200">
                  {gpsAccuracy ? `±${Math.round(gpsAccuracy)}m` : 'High Lock'}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Heading: <strong className="text-slate-200">{Math.round(heading)}°</strong></span>
            </div>
          </div>

          {/* Giant Tabular Odometer */}
          <div className="text-center py-4">
            <span className="text-xs uppercase tracking-widest font-semibold text-slate-400 block mb-2">
              Accurate Trip Distance
            </span>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tight text-white tabular-nums">
                {currentDist.toFixed(2)}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">
                KM
              </span>
            </div>
          </div>

          {/* Secondary Telemetry Strip - Optimized for mobile phone screens so duration never overflows */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-6 border-t border-slate-800/80">
            {/* Speed block */}
            <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-850 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1 truncate">Speed</span>
              <div className="flex items-baseline justify-center gap-0.5 truncate">
                <span className="text-base sm:text-xl font-bold font-mono text-cyan-400 tabular-nums">
                  {Math.round(currentSpeedKmH)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">km/h</span>
              </div>
            </div>

            {/* Duration block: Responsive typography and compact format preventing overflow on mobile */}
            <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-850 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1 truncate">Duration</span>
              <div className="flex items-center justify-center gap-1 text-white font-mono font-bold text-sm sm:text-lg md:text-xl tabular-nums truncate">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:inline" />
                <span className="truncate">{formatTimer(currentDuration)}</span>
              </div>
            </div>

            {/* Max speed block */}
            <div className="text-center p-2.5 sm:p-3 rounded-xl bg-slate-950/60 border border-slate-850 min-w-0 overflow-hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-400 block mb-1 truncate">Max Speed</span>
              <div className="flex items-baseline justify-center gap-0.5 truncate">
                <span className="text-base sm:text-xl font-bold font-mono text-slate-200 tabular-nums">
                  {Math.round(maxSpeedKmH)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Driving Action Controls & Simulation Panel */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">
              Drive Controls
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Control GPS telemetry recording or activate realistic test simulations.
            </p>

            {/* Primary Action Button */}
            {!isTripActive ? (
              <div className="space-y-3">
                <button
                  onClick={() => handleStartManualDrive(false)}
                  className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start Live Drive</span>
                </button>

                <div className="relative py-2 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <span className="relative bg-slate-900 px-3 text-[11px] font-mono text-slate-400">
                    OR TEST SIMULATION
                  </span>
                </div>

                {/* Simulation Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-slate-300">
                    Select Test Driving Route:
                  </label>
                  <select
                    value={simPreset.id}
                    onChange={(e) => {
                      const found = SIMULATION_ROUTES.find((r) => r.id === e.target.value);
                      if (found) setSimPreset(found);
                    }}
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {SIMULATION_ROUTES.map((route) => (
                      <option key={route.id} value={route.id}>
                        {route.name} ({route.description})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => handleStartManualDrive(true)}
                    className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Run Route Simulation</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleStopDrive}
                  className="w-full h-14 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-base flex items-center justify-center gap-2.5 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>End Drive & Confirm</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`flex-1 h-11 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPaused
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Pause className="w-4 h-4" />
                    <span>{isPaused ? 'Resume Logging' : 'Pause'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Upon stopping, you can verify and edit trip distance, category, and notes before cloud storage.
                </p>
              </div>
            )}
          </div>

          {/* Quick Notice */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <Radio className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Bluetooth auto-start is monitored in background. Connect your vehicle audio to begin recording hands-free.
            </span>
          </div>
        </div>
      </div>

      {/* Live Route Map Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Live Route Telemetry & Waypoint Vector
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {activeTrip?.coordinates.length || 0} GPS coordinates mapped
          </span>
        </div>

        <TripMap
          coordinates={activeTrip?.coordinates || []}
          currentLocation={
            activeTrip?.coordinates[activeTrip.coordinates.length - 1] || null
          }
          isLive={isTripActive}
          className="h-80 w-full"
        />
      </div>
    </div>
  );
};
