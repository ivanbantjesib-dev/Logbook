import React, { useMemo, useState } from 'react';
import { Trip } from '../types/trip';
import { downloadCsvReport, ExportFilterOptions } from '../services/csvExport';
import {
  Download,
  Calendar,
  Briefcase,
  User,
  TrendingUp,
  FileSpreadsheet,
  Car,
  PieChart,
  BarChart3,
  Layers,
} from 'lucide-react';

interface DashboardProps {
  trips: Trip[];
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const Dashboard: React.FC<DashboardProps> = ({ trips }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [exportCategory, setExportCategory] = useState<'all' | 'business' | 'personal'>('all');
  const [hoveredMonthIdx, setHoveredMonthIdx] = useState<number | null>(null);

  const confirmedTrips = useMemo(() => {
    return trips.filter((t) => t.status === 'confirmed');
  }, [trips]);

  // Available years from trips
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(2026);
    years.add(2025);
    confirmedTrips.forEach((t) => {
      const y = new Date(t.startTime).getFullYear();
      if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [confirmedTrips]);

  // Filter trips for selected year
  const yearTrips = useMemo(() => {
    return confirmedTrips.filter((t) => {
      const d = new Date(t.startTime);
      return d.getFullYear() === selectedYear;
    });
  }, [confirmedTrips, selectedYear]);

  // Aggregate stats for selected year
  const yearStats = useMemo(() => {
    let totalKm = 0;
    let businessKm = 0;
    let personalKm = 0;

    yearTrips.forEach((t) => {
      totalKm += t.distanceKm;
      if (t.category === 'business') {
        businessKm += t.distanceKm;
      } else {
        personalKm += t.distanceKm;
      }
    });

    const businessPct = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;
    const personalPct = totalKm > 0 ? (personalKm / totalKm) * 100 : 0;
    const avgDistance = yearTrips.length > 0 ? totalKm / yearTrips.length : 0;

    return {
      totalKm,
      businessKm,
      personalKm,
      businessPct,
      personalPct,
      tripCount: yearTrips.length,
      avgDistance,
    };
  }, [yearTrips]);

  // All-time overall summary stats
  const allTimeStats = useMemo(() => {
    let totalKm = 0;
    let businessKm = 0;
    let personalKm = 0;

    confirmedTrips.forEach((t) => {
      totalKm += t.distanceKm;
      if (t.category === 'business') {
        businessKm += t.distanceKm;
      } else {
        personalKm += t.distanceKm;
      }
    });

    const businessPct = totalKm > 0 ? (businessKm / totalKm) * 100 : 0;
    const personalPct = totalKm > 0 ? (personalKm / totalKm) * 100 : 0;

    return {
      totalKm,
      businessKm,
      personalKm,
      businessPct,
      personalPct,
      tripCount: confirmedTrips.length,
    };
  }, [confirmedTrips]);

  // Monthly breakdown for selected year (12 months)
  const monthlyData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      monthIdx: i,
      name: MONTH_NAMES[i],
      businessKm: 0,
      personalKm: 0,
      totalKm: 0,
      tripCount: 0,
    }));

    yearTrips.forEach((t) => {
      const m = new Date(t.startTime).getMonth();
      if (m >= 0 && m < 12) {
        months[m].totalKm += t.distanceKm;
        months[m].tripCount += 1;
        if (t.category === 'business') {
          months[m].businessKm += t.distanceKm;
        } else {
          months[m].personalKm += t.distanceKm;
        }
      }
    });

    // Find max monthly distance to scale bars
    let maxMonthlyKm = 10;
    months.forEach((m) => {
      if (m.totalKm > maxMonthlyKm) maxMonthlyKm = m.totalKm;
    });

    return { months, maxMonthlyKm };
  }, [yearTrips]);

  // Multi-Year breakdown to visualize total kilometers per year
  const yearlyData = useMemo(() => {
    const yearMap = new Map<number, { year: number; totalKm: number; businessKm: number; personalKm: number; tripCount: number }>();

    availableYears.forEach((yr) => {
      yearMap.set(yr, { year: yr, totalKm: 0, businessKm: 0, personalKm: 0, tripCount: 0 });
    });

    confirmedTrips.forEach((t) => {
      const yr = new Date(t.startTime).getFullYear();
      if (yearMap.has(yr)) {
        const entry = yearMap.get(yr)!;
        entry.totalKm += t.distanceKm;
        entry.tripCount += 1;
        if (t.category === 'business') {
          entry.businessKm += t.distanceKm;
        } else {
          entry.personalKm += t.distanceKm;
        }
      }
    });

    const list = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
    let maxYearlyKm = 50;
    list.forEach((item) => {
      if (item.totalKm > maxYearlyKm) maxYearlyKm = item.totalKm;
    });

    return { list, maxYearlyKm };
  }, [availableYears, confirmedTrips]);

  const handleExportCsv = (allTime: boolean = false) => {
    const options: ExportFilterOptions = {
      year: allTime ? 'all' : selectedYear,
      category: exportCategory,
    };
    downloadCsvReport(confirmedTrips, options, allTime ? 'aerotrack_all_logged_trips' : `aerotrack_trips_${selectedYear}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Year Selector & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Trip Analytics & Mileage Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualization of monthly and annual driving volume in kilometers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            {availableYears.map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                  selectedYear === yr
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Export Category Filter */}
          <select
            value={exportCategory}
            onChange={(e) => setExportCategory(e.target.value as 'all' | 'business' | 'personal')}
            aria-label="Export Category Filter"
            className="h-9 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Categories</option>
            <option value="business">Business Only</option>
            <option value="personal">Personal Only</option>
          </select>

          {/* Export All CSV Button */}
          <button
            onClick={() => handleExportCsv(false)}
            className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary of Business vs Personal Mileage */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <span>Business vs. Personal Mileage Summary ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Proportion of total distance categorized by driving purpose
            </p>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            All-Time Total: <strong className="text-white">{allTimeStats.totalKm.toFixed(1)} km</strong> ({allTimeStats.tripCount} trips)
          </div>
        </div>

        {/* Proportional Split Bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5">
            <div
              style={{ width: `${Math.max(yearStats.businessPct, yearStats.totalKm > 0 ? 3 : 0)}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-lg transition-all duration-500"
              title={`Business: ${yearStats.businessKm.toFixed(1)} km (${yearStats.businessPct.toFixed(1)}%)`}
            />
            <div
              style={{ width: `${Math.max(yearStats.personalPct, yearStats.totalKm > 0 ? 3 : 0)}%` }}
              className="h-full bg-gradient-to-r from-cyan-400 to-sky-500 rounded-r-lg transition-all duration-500"
              title={`Personal: ${yearStats.personalKm.toFixed(1)} km (${yearStats.personalPct.toFixed(1)}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Business: {yearStats.businessKm.toFixed(1)} km ({yearStats.businessPct.toFixed(1)}%)</span>
            </div>
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Personal: {yearStats.personalKm.toFixed(1)} km ({yearStats.personalPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards: Total, Business, Personal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Total Distance ({selectedYear})</span>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                {yearStats.totalKm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-mono text-slate-400">KM</span>
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              {yearStats.tripCount} confirmed trips · {yearStats.avgDistance.toFixed(1)} km avg
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Business Kilometers</span>
              <Briefcase className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums tracking-tight">
                {yearStats.businessKm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-mono text-slate-400">KM</span>
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              {yearStats.businessPct.toFixed(1)}% of total distance
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Personal Kilometers</span>
              <User className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-cyan-400 tabular-nums tracking-tight">
                {yearStats.personalKm.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              </span>
              <span className="text-xs font-mono text-slate-400">KM</span>
            </div>
            <div className="text-xs text-slate-400 mt-1.5">
              {yearStats.personalPct.toFixed(1)}% of total distance
            </div>
          </div>
        </div>
      </div>

      {/* 1. Monthly Kilometers Driven Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Total Kilometers Driven Per Month ({selectedYear})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Monthly breakdown showing Business vs. Personal driving distance
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
              <span className="text-slate-300">Business km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-cyan-500" />
              <span className="text-slate-300">Personal km</span>
            </div>
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div className="relative h-64 w-full select-none">
          <div className="absolute inset-0 flex items-end justify-between gap-1.5 sm:gap-2 pt-6 pb-8 px-1 sm:px-2">
            {monthlyData.months.map((m) => {
              const bHeight = monthlyData.maxMonthlyKm > 0 ? (m.businessKm / monthlyData.maxMonthlyKm) * 100 : 0;
              const pHeight = monthlyData.maxMonthlyKm > 0 ? (m.personalKm / monthlyData.maxMonthlyKm) * 100 : 0;
              const isHovered = hoveredMonthIdx === m.monthIdx;

              return (
                <div
                  key={m.monthIdx}
                  onMouseEnter={() => setHoveredMonthIdx(m.monthIdx)}
                  onMouseLeave={() => setHoveredMonthIdx(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip on Hover */}
                  {isHovered && m.totalKm > 0 && (
                    <div className="absolute top-0 z-20 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-lg shadow-xl text-xs font-mono text-slate-200 pointer-events-none">
                      <div className="font-bold text-white mb-0.5">{m.name} {selectedYear}</div>
                      <div className="text-emerald-400">Business: {m.businessKm.toFixed(1)} km</div>
                      <div className="text-cyan-400">Personal: {m.personalKm.toFixed(1)} km</div>
                      <div className="text-slate-200 font-bold border-t border-slate-800 pt-0.5 mt-0.5">
                        Total: {m.totalKm.toFixed(1)} km ({m.tripCount} trips)
                      </div>
                    </div>
                  )}

                  {/* Bars Container */}
                  <div className="w-full max-w-[28px] flex items-end gap-1 h-[170px] bg-slate-950/60 rounded-t-lg p-0.5">
                    {/* Business Bar */}
                    <div
                      style={{ height: `${Math.max(bHeight, bHeight > 0 ? 4 : 0)}%` }}
                      className={`w-1/2 bg-emerald-500 rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${
                        isHovered ? 'shadow-md shadow-emerald-500/50' : ''
                      }`}
                    />
                    {/* Personal Bar */}
                    <div
                      style={{ height: `${Math.max(pHeight, pHeight > 0 ? 4 : 0)}%` }}
                      className={`w-1/2 bg-cyan-500 rounded-t-sm transition-all duration-300 group-hover:brightness-125 ${
                        isHovered ? 'shadow-md shadow-cyan-500/50' : ''
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[10px] sm:text-[11px] font-mono font-medium text-slate-400 mt-2">
                    {m.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid guidelines */}
          <div className="absolute left-0 right-0 top-6 border-b border-slate-800/60 pointer-events-none" />
          <div className="absolute left-0 right-0 top-1/2 border-b border-slate-800/60 pointer-events-none" />
        </div>

        {/* Monthly Ledger Table */}
        <div className="pt-2 border-t border-slate-800 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 font-semibold border-b border-slate-800">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Trips</th>
                <th className="py-2.5 px-3 text-right text-emerald-400">Business (km)</th>
                <th className="py-2.5 px-3 text-right text-cyan-400">Personal (km)</th>
                <th className="py-2.5 px-3 text-right text-white font-bold">Total (km)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 font-mono">
              {monthlyData.months
                .filter((m) => m.totalKm > 0)
                .map((m) => (
                  <tr key={m.monthIdx} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-2 px-3 font-sans font-medium text-slate-200">
                      {m.name} {selectedYear}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 tabular-nums">
                      {m.tripCount}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400 tabular-nums">
                      {m.businessKm.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-right text-cyan-400 tabular-nums">
                      {m.personalKm.toFixed(1)}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                      {m.totalKm.toFixed(1)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Total Kilometers Driven Per Year Chart */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Total Kilometers Driven Per Year</span>
            </h3>
            <p className="text-xs text-slate-400">
              Multi-year annual driving volume comparison in kilometers
            </p>
          </div>
        </div>

        {/* Yearly Bar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {yearlyData.list.map((item) => {
            const pctOfMax = yearlyData.maxYearlyKm > 0 ? (item.totalKm / yearlyData.maxYearlyKm) * 100 : 0;
            const isCurrent = item.year === selectedYear;

            return (
              <div
                key={item.year}
                onClick={() => setSelectedYear(item.year)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-slate-950 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold font-mono text-white">{item.year}</span>
                  <span className="text-xs text-slate-400 font-mono">{item.tripCount} trips</span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-3">
                  <span className="text-2xl font-black font-mono text-white tabular-nums">
                    {item.totalKm.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">KM</span>
                </div>

                {/* Relative progress bar */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden mb-3 border border-slate-800">
                  <div
                    style={{ width: `${Math.max(pctOfMax, 5)}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-emerald-400">Biz: {item.businessKm.toFixed(1)} km</span>
                  <span className="text-cyan-400">Pers: {item.personalKm.toFixed(1)} km</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CSV Exporting Callout Panel */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Complete Trip Database (CSV)</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Exports a formatted CSV document including date, time, distance in kilometers, trip category, duration, and departure/arrival locations.
          </p>
        </div>

        <button
          onClick={() => handleExportCsv(true)}
          className="h-11 px-5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export All Trips (CSV)</span>
        </button>
      </div>
    </div>
  );
};
