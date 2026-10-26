import React, { useState } from 'react';
import { Trip, TripCategory } from '../types/trip';
import { TripMap } from './TripMap';
import {
  CloudUpload,
  Briefcase,
  User,
  Clock,
  Gauge,
  MapPin,
  Check,
  Trash2,
  Car,
  FileText,
} from 'lucide-react';

interface TripConfirmModalProps {
  trip: Trip;
  onConfirm: (confirmedTrip: Trip) => void;
  onDiscard: (tripId: string) => void;
}

export const TripConfirmModal: React.FC<TripConfirmModalProps> = ({
  trip,
  onConfirm,
  onDiscard,
}) => {
  const [category, setCategory] = useState<TripCategory>(trip.category || 'business');
  const [purpose, setPurpose] = useState<string>(trip.purpose || (category === 'business' ? 'Client On-Site Visit' : 'Personal Commute'));
  const [notes, setNotes] = useState<string>(trip.notes || '');
  const [distanceKmInput, setDistanceKmInput] = useState<string>(trip.distanceKm.toFixed(2));
  const [startAddress, setStartAddress] = useState<string>(trip.startAddress || 'Origin');
  const [endAddress, setEndAddress] = useState<string>(trip.endAddress || 'Destination');
  const [vehicleName, setVehicleName] = useState<string>(trip.vehicleName || 'Primary Vehicle');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const parsedDistance = parseFloat(distanceKmInput) || trip.distanceKm;

  const handleSaveToCloud = () => {
    setIsSaving(true);

    const updated: Trip = {
      ...trip,
      distanceKm: parsedDistance,
      category,
      purpose,
      notes,
      startAddress,
      endAddress,
      vehicleName,
      status: 'confirmed',
      syncedToCloud: true,
      updatedAt: Date.now(),
    };

    setTimeout(() => {
      setIsSaving(false);
      onConfirm(updated);
    }, 400);
  };

  // Compact duration formatting that fits inside mobile blocks without wrapping or clipping
  const formatDurationCompact = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs === 0) {
      return `${mins}m ${secs}s`;
    }
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CloudUpload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Trip Confirmation
              </h3>
              <p className="text-xs text-slate-400">
                Verify trip telemetry before storing to cloud database
              </p>
            </div>
          </div>

          {trip.bluetoothTriggered && (
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-lg shrink-0">
              Auto-stopped
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Map Preview */}
          <div className="rounded-2xl overflow-hidden border border-slate-800">
            <TripMap
              coordinates={trip.coordinates}
              startAddress={startAddress}
              endAddress={endAddress}
              className="h-48 w-full"
            />
          </div>

          {/* Quick Metrics Bar - Mobile-optimized, no tax calculations, protected duration */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 min-w-0 overflow-hidden">
              <span className="text-xs text-slate-500 font-medium block truncate">Distance (km)</span>
              <div className="flex items-baseline gap-1 mt-1 truncate">
                <input
                  type="number"
                  step="0.01"
                  value={distanceKmInput}
                  onChange={(e) => setDistanceKmInput(e.target.value)}
                  className="w-16 sm:w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-sm sm:text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-mono">km</span>
              </div>
            </div>

            {/* Duration block - compact and protected against overflow */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 min-w-0 overflow-hidden">
              <span className="text-xs text-slate-500 font-medium block truncate">Duration</span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono font-semibold text-xs sm:text-sm truncate">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{formatDurationCompact(trip.durationSeconds)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 min-w-0 overflow-hidden">
              <span className="text-xs text-slate-500 font-medium block truncate">Avg Speed</span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono font-semibold text-xs sm:text-sm truncate">
                <Gauge className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{trip.avgSpeedKmH.toFixed(1)} km/h</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 min-w-0 overflow-hidden">
              <span className="text-xs text-slate-500 font-medium block truncate">Max Speed</span>
              <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-mono font-semibold text-xs sm:text-sm truncate">
                <span className="text-cyan-400 text-xs font-bold">TOP:</span>
                <span className="truncate">{trip.maxSpeedKmH.toFixed(1)} km/h</span>
              </div>
            </div>
          </div>

          {/* Categorization & Purpose */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Trip Classification
              </label>
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCategory('business')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    category === 'business'
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Business Mileage</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategory('personal')}
                  className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    category === 'personal'
                      ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Personal Trip</span>
                </button>
              </div>
            </div>

            {/* Purpose & Client details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Trip Purpose / Project Name
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Client Site Visit, Commute, Supplier"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Vehicle Assigned
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={vehicleName}
                    onChange={(e) => setVehicleName(e.target.value)}
                    placeholder="e.g. Primary Car, Company Fleet"
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <Car className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Departure Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={startAddress}
                    onChange={(e) => setStartAddress(e.target.value)}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-emerald-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Arrival Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={endAddress}
                    onChange={(e) => setEndAddress(e.target.value)}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <MapPin className="w-4 h-4 text-rose-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Trip Notes / Comments
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes, stops, route observations..."
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onDiscard(trip.id)}
            className="px-4 py-2.5 rounded-xl border border-slate-800 hover:border-rose-900/50 hover:bg-rose-950/30 text-rose-400 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Discard Trip</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToCloud}
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Syncing to Cloud...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Confirm & Save to Cloud</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
