import React, { useState } from 'react';
import { Trip, TripCategory } from '../types/trip';
import { Briefcase, User, MapPin, Check, Trash2, X, Car, FileText } from 'lucide-react';

interface TripEditModalProps {
  trip: Trip;
  onSave: (updatedTrip: Trip) => void;
  onDelete: (tripId: string) => void;
  onClose: () => void;
}

export const TripEditModal: React.FC<TripEditModalProps> = ({
  trip,
  onSave,
  onDelete,
  onClose,
}) => {
  const [category, setCategory] = useState<TripCategory>(trip.category);
  const [purpose, setPurpose] = useState<string>(trip.purpose);
  const [notes, setNotes] = useState<string>(trip.notes || '');
  const [distanceKmInput, setDistanceKmInput] = useState<string>(trip.distanceKm.toFixed(2));
  const [startAddress, setStartAddress] = useState<string>(trip.startAddress || '');
  const [endAddress, setEndAddress] = useState<string>(trip.endAddress || '');
  const [vehicleName, setVehicleName] = useState<string>(trip.vehicleName || 'Primary Vehicle');

  const parsedDistance = parseFloat(distanceKmInput) || trip.distanceKm;

  const handleSave = () => {
    const updated: Trip = {
      ...trip,
      distanceKm: parsedDistance,
      category,
      purpose,
      notes,
      startAddress,
      endAddress,
      vehicleName,
      updatedAt: Date.now(),
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Edit Trip Details
            </h3>
            <p className="text-xs text-slate-400">
              Update distance in kilometers, category, or route notes
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-4">
          {/* Classification */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Trip Category
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setCategory('business')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  category === 'business'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Business Mileage</span>
              </button>
              <button
                type="button"
                onClick={() => setCategory('personal')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  category === 'personal'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Personal</span>
              </button>
            </div>
          </div>

          {/* Distance */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <label className="block text-xs text-slate-400 mb-1">Trip Distance (Kilometers)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={distanceKmInput}
                onChange={(e) => setDistanceKmInput(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-700 text-base font-bold font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-slate-400 font-mono font-bold">KM</span>
            </div>
          </div>

          {/* Purpose & Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Purpose / Project
              </label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Assigned Vehicle
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <Car className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Departure Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={startAddress}
                  onChange={(e) => setStartAddress(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <MapPin className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-3.5" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Arrival Address
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={endAddress}
                  onChange={(e) => setEndAddress(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
                <MapPin className="w-3.5 h-3.5 text-rose-400 absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
            <div className="relative">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional trip notes..."
                className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3.5" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onDelete(trip.id)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Trip</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
