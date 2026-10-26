import React, { useState, useMemo } from 'react';
import { Trip } from '../types/trip';
import { TripMap } from './TripMap';
import { downloadCsvReport } from '../services/csvExport';
import {
  Search,
  Filter,
  Download,
  Edit3,
  MapPin,
  Briefcase,
  User,
  ChevronDown,
  ChevronUp,
  Bluetooth,
  Plus,
} from 'lucide-react';

interface TripHistoryProps {
  trips: Trip[];
  onEditTrip: (trip: Trip) => void;
  onDeleteTrip: (tripId: string) => void;
  onAddManualTrip: () => void;
}

export const TripHistory: React.FC<TripHistoryProps> = ({
  trips,
  onEditTrip,
  onDeleteTrip,
  onAddManualTrip,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'business' | 'personal'>('all');
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const confirmedTrips = useMemo(() => {
    return trips.filter((t) => t.status === 'confirmed');
  }, [trips]);

  const filteredTrips = useMemo(() => {
    return confirmedTrips.filter((t) => {
      // Category match
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }
      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesPurpose = t.purpose?.toLowerCase().includes(query);
        const matchesOrigin = t.startAddress?.toLowerCase().includes(query);
        const matchesDest = t.endAddress?.toLowerCase().includes(query);
        const matchesNotes = t.notes?.toLowerCase().includes(query);
        const matchesVehicle = t.vehicleName?.toLowerCase().includes(query);
        if (!matchesPurpose && !matchesOrigin && !matchesDest && !matchesNotes && !matchesVehicle) {
          return false;
        }
      }
      return true;
    });
  }, [confirmedTrips, categoryFilter, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedTripId((prev) => (prev === id ? null : id));
  };

  const handleExportFiltered = () => {
    downloadCsvReport(filteredTrips, { category: categoryFilter }, `aerotrack_trips_${categoryFilter}`);
  };

  // Compact duration formatter preventing mobile overflow
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by purpose, location, vehicle..."
              className="w-full h-10 pl-9 pr-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Category Filter segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({confirmedTrips.length})
            </button>
            <button
              onClick={() => setCategoryFilter('business')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === 'business'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Briefcase className="w-3 h-3 text-emerald-400" />
              <span>Business</span>
            </button>
            <button
              onClick={() => setCategoryFilter('personal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                categoryFilter === 'personal'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <User className="w-3 h-3 text-cyan-400" />
              <span>Personal</span>
            </button>
          </div>
        </div>

        {/* Action CTAs: Export & Add Manual Trip */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onAddManualTrip}
            className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Trip</span>
          </button>

          <button
            onClick={handleExportFiltered}
            className="h-9 px-3.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Filter className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-200">No driving records found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm || categoryFilter !== 'all'
              ? 'Try adjusting your search criteria or category filter.'
              : 'Start your first drive in the Live Cockpit or pair a Bluetooth auto-trigger.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map((trip) => {
            const startDate = new Date(trip.startTime);
            const isExpanded = expandedTripId === trip.id;

            return (
              <div
                key={trip.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all hover:border-slate-700/80"
              >
                {/* Primary Trip Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Block: Date, Purpose, Route info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5 flex-wrap">
                      <span className="font-semibold text-slate-300">
                        {startDate.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">
                        {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-slate-300 font-mono">
                        {formatDuration(trip.durationSeconds)}
                      </span>
                      {trip.bluetoothTriggered && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-cyan-400 inline-flex items-center gap-1 font-mono">
                            <Bluetooth className="w-3 h-3" />
                            <span>Auto</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h4 className="text-base font-bold text-white tracking-tight truncate">
                      {trip.purpose || trip.title || 'Recorded Drive'}
                    </h4>

                    {/* Route line */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{trip.startAddress || 'Origin'}</span>
                      <span className="text-slate-600">→</span>
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{trip.endAddress || 'Destination'}</span>
                    </div>
                  </div>

                  {/* Middle Block: Distance & Category */}
                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800 min-w-0">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black font-mono text-white tabular-nums tracking-tight">
                        {trip.distanceKm.toFixed(2)}
                      </span>
                      <span className="text-xs font-mono font-medium text-slate-400">km</span>
                    </div>

                    <div className="text-xs font-semibold mt-0.5">
                      {trip.category === 'business' ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span>Business</span>
                        </span>
                      ) : (
                        <span className="text-cyan-400 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>Personal</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Block: Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onEditTrip(trip)}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors cursor-pointer"
                      title="Edit Trip Details"
                      aria-label="Edit Trip Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => toggleExpand(trip.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      aria-label="Toggle Route Map"
                    >
                      <span>Map</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Map View and Detailed Telemetry */}
                {isExpanded && (
                  <div className="border-t border-slate-800 p-4 sm:p-5 bg-slate-950/40 space-y-4">
                    <TripMap
                      coordinates={trip.coordinates}
                      startAddress={trip.startAddress}
                      endAddress={trip.endAddress}
                      className="h-56 w-full"
                    />

                    {/* Secondary details */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block truncate">Avg / Max Speed</span>
                        <span className="font-mono font-semibold text-slate-200 mt-0.5 block truncate">
                          {trip.avgSpeedKmH.toFixed(1)} / {trip.maxSpeedKmH.toFixed(1)} km/h
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block truncate">Assigned Vehicle</span>
                        <span className="font-medium text-slate-200 mt-0.5 block truncate">
                          {trip.vehicleName || 'Primary Vehicle'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block truncate">Route Coordinates</span>
                        <span className="font-mono font-semibold text-slate-200 mt-0.5 block truncate">
                          {trip.coordinates.length} waypoints
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                        <span className="text-slate-500 block truncate">Classification</span>
                        <span className="font-semibold text-slate-200 mt-0.5 block truncate capitalize">
                          {trip.category}
                        </span>
                      </div>
                    </div>

                    {trip.notes && (
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                        <span className="text-slate-500 font-medium mr-1.5">Notes:</span>
                        {trip.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
