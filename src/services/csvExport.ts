import { Trip } from '../types/trip';

export interface ExportFilterOptions {
  category?: 'all' | 'business' | 'personal';
  year?: number | 'all';
  month?: number | 'all'; // 0-11
}

function escapeCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export function generateCsvContent(trips: Trip[], options?: ExportFilterOptions): string {
  let filtered = trips.filter((t) => t.status === 'confirmed');

  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter((t) => t.category === options.category);
  }

  if (options?.year && options.year !== 'all') {
    filtered = filtered.filter((t) => {
      const d = new Date(t.startTime);
      return d.getFullYear() === options.year;
    });
  }

  if (options?.month !== undefined && options.month !== 'all') {
    filtered = filtered.filter((t) => {
      const d = new Date(t.startTime);
      return d.getMonth() === options.month;
    });
  }

  // Sort chronologically descending
  filtered.sort((a, b) => b.startTime - a.startTime);

  // Core columns without route coordinates, average speed, and max speed
  const headers = [
    'Date',
    'Time',
    'Distance (km)',
    'Trip Category',
    'Duration',
    'Departure Location',
    'Arrival Location',
    'Purpose',
    'Vehicle',
    'Bluetooth Auto-Triggered',
    'Notes',
  ];

  const rows = filtered.map((trip) => {
    const startDate = new Date(trip.startTime);
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    return [
      escapeCsvField(dateStr),
      escapeCsvField(timeStr),
      escapeCsvField(trip.distanceKm.toFixed(2)),
      escapeCsvField(trip.category === 'business' ? 'Business' : 'Personal'),
      escapeCsvField(formatDuration(trip.durationSeconds)),
      escapeCsvField(trip.startAddress || 'Origin'),
      escapeCsvField(trip.endAddress || 'Destination'),
      escapeCsvField(trip.purpose || 'General Trip'),
      escapeCsvField(trip.vehicleName || 'Primary Vehicle'),
      escapeCsvField(trip.bluetoothTriggered ? 'Yes' : 'No'),
      escapeCsvField(trip.notes || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function downloadCsvReport(trips: Trip[], options?: ExportFilterOptions, filenamePrefix: string = 'aerotrack_trips'): void {
  const csv = generateCsvContent(trips, options);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
