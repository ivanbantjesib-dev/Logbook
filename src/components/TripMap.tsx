import React, { useMemo, useState } from 'react';
import { Coordinate } from '../types/trip';
import { Navigation, ZoomIn, ZoomOut, RotateCcw, MapPin, Gauge } from 'lucide-react';

interface TripMapProps {
  coordinates: Coordinate[];
  currentLocation?: Coordinate | null;
  isLive?: boolean;
  startAddress?: string;
  endAddress?: string;
  className?: string;
}

export const TripMap: React.FC<TripMapProps> = ({
  coordinates,
  currentLocation,
  isLive = false,
  startAddress,
  endAddress,
  className = 'h-72 w-full',
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredPoint, setHoveredPoint] = useState<Coordinate | null>(null);

  // Compute bounding box and normalized points
  const { pathData, points, bounds, startPoint, endPoint } = useMemo(() => {
    const allCoords: Coordinate[] = [...coordinates];
    if (currentLocation && !allCoords.find((c) => c.lat === currentLocation.lat && c.lng === currentLocation.lng)) {
      allCoords.push(currentLocation);
    }

    if (allCoords.length === 0) {
      return { pathData: '', points: [], bounds: null, startPoint: null, endPoint: null };
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    allCoords.forEach((pt) => {
      if (pt.lat < minLat) minLat = pt.lat;
      if (pt.lat > maxLat) maxLat = pt.lat;
      if (pt.lng < minLng) minLng = pt.lng;
      if (pt.lng > maxLng) maxLng = pt.lng;
    });

    // Provide padding around bounds
    const latSpan = Math.max(maxLat - minLat, 0.008);
    const lngSpan = Math.max(maxLng - minLng, 0.008);
    const pad = 0.15; // 15% margin

    const bMinLat = minLat - latSpan * pad;
    const bMaxLat = maxLat + latSpan * pad;
    const bMinLng = minLng - lngSpan * pad;
    const bMaxLng = maxLng + lngSpan * pad;

    const width = 800;
    const height = 450;

    const mapped = allCoords.map((c) => {
      const x = ((c.lng - bMinLng) / (bMaxLng - bMinLng)) * width;
      // Invert Y since latitude increases upwards
      const y = height - ((c.lat - bMinLat) / (bMaxLat - bMinLat)) * height;
      return { x, y, raw: c };
    });

    let d = '';
    mapped.forEach((pt, i) => {
      d += i === 0 ? `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}` : ` L ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    });

    return {
      pathData: d,
      points: mapped,
      bounds: { minLat, maxLat, minLng, maxLng, width, height },
      startPoint: mapped[0],
      endPoint: mapped[mapped.length - 1],
    };
  }, [coordinates, currentLocation]);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.3, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.3, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-slate-950 border border-slate-800/80 select-none ${className}`}>
      {/* Background Cartography Grid */}
      <svg
        className="absolute inset-0 h-full w-full opacity-20 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="carto-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#carto-grid)" />
      </svg>

      {/* Map Content Viewport */}
      {bounds && points.length > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center p-3">
          <svg
            viewBox={`0 0 ${bounds.width} ${bounds.height}`}
            className="w-full h-full transition-transform duration-300 ease-out"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <defs>
              <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="60%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Path glow shadow */}
            <path
              d={pathData}
              fill="none"
              stroke="#06B6D4"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.25"
            />

            {/* Core Route Line */}
            <path
              d={pathData}
              fill="none"
              stroke="url(#routeGlow)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* Interactive Waypoint Nodes */}
            {points.map((pt, idx) => (
              <circle
                key={idx}
                cx={pt.x}
                cy={pt.y}
                r={idx === 0 || idx === points.length - 1 ? 5 : 3}
                fill={idx === 0 ? '#10B981' : idx === points.length - 1 ? '#F43F5E' : '#38BDF8'}
                stroke="#0B0F17"
                strokeWidth="1.5"
                className="cursor-pointer transition-transform hover:scale-150"
                onMouseEnter={() => setHoveredPoint(pt.raw)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}

            {/* Start Pin */}
            {startPoint && (
              <g transform={`translate(${startPoint.x}, ${startPoint.y})`}>
                <circle r="9" fill="#10B981" opacity="0.3" />
                <circle r="5" fill="#10B981" stroke="#0B0F17" strokeWidth="1.5" />
                <text x="8" y="-4" fill="#6EE7B7" fontSize="10" fontWeight="600">START</text>
              </g>
            )}

            {/* Current Position / Live Tracking Arrow or End Pin */}
            {isLive && currentLocation && endPoint ? (
              <g transform={`translate(${endPoint.x}, ${endPoint.y})`}>
                <circle r="14" fill="#06B6D4" opacity="0.2" className="animate-ping" />
                <circle r="8" fill="#06B6D4" stroke="#ffffff" strokeWidth="2" />
                <path
                  d="M 0 -7 L 5 5 L 0 2 L -5 5 Z"
                  fill="#ffffff"
                  transform={`rotate(${currentLocation.heading || 0})`}
                />
              </g>
            ) : (
              endPoint && (
                <g transform={`translate(${endPoint.x}, ${endPoint.y})`}>
                  <circle r="9" fill="#F43F5E" opacity="0.3" />
                  <circle r="5" fill="#F43F5E" stroke="#0B0F17" strokeWidth="1.5" />
                  <text x="8" y="-4" fill="#FDA4AF" fontSize="10" fontWeight="600">END</text>
                </g>
              )
            )}
          </svg>
        </div>
      ) : (
        /* Empty or Fallback Schematic when coordinates are minimal */
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
            <Navigation className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-slate-300">
            {isLive ? 'Waiting for GPS satellite lock...' : 'Route Corridor Logged'}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {startAddress || endAddress
              ? `${startAddress || 'Origin'} → ${endAddress || 'Destination'}`
              : 'Trip coordinates and road vector telemetry recorded in dark cockpit mode.'}
          </p>
        </div>
      )}

      {/* Top Map HUD Controls & Coordinate Badge */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg pointer-events-auto">
          {isLive ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-medium text-emerald-400 tracking-wider">LIVE GPS TRACKING</span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-mono font-medium text-slate-300 tracking-wider">ROUTE TELEMETRY</span>
            </>
          )}
          {coordinates.length > 0 && (
            <span className="text-xs font-mono text-slate-500">
              · {coordinates.length} waypoints
            </span>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-lg pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title="Reset Map Zoom"
            aria-label="Reset Map Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hovered Waypoint Telemetry Toast */}
      {hoveredPoint && (
        <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-cyan-500/30 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-200 backdrop-blur-md shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Gauge className="w-3.5 h-3.5" />
            <span>{hoveredPoint.speed != null ? `${Math.round(hoveredPoint.speed)} km/h` : '-- km/h'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">
            {hoveredPoint.lat.toFixed(4)}°, {hoveredPoint.lng.toFixed(4)}°
          </span>
          {hoveredPoint.accuracy != null && (
            <>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">±{Math.round(hoveredPoint.accuracy)}m</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
