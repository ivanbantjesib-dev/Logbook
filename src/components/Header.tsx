import React from 'react';
import { ViewTab } from '../types/trip';
import {
  Navigation,
  FileSpreadsheet,
  BarChart3,
  Bluetooth,
  Lock,
  Unlock,
  Settings,
  Car,
} from 'lucide-react';

interface HeaderProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isLocked: boolean;
  onLockVault: () => void;
  onOpenSettings: () => void;
  isTripActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  isLocked,
  onLockVault,
  onOpenSettings,
  isTripActive,
}) => {
  return (
    <>
      {/* Desktop Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4 clean links) — Zone 3 (1 primary action) */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
              <Car className="w-5 h-5" />
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSelectTab('live');
              }}
              className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors"
            >
              AeroTrack
            </a>
          </div>

          {/* Zone 2: 4 clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <button
              onClick={() => onSelectTab('live')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentTab === 'live' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              <span>Cockpit HUD</span>
              {isTripActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            <button
              onClick={() => onSelectTab('history')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'history' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Trip Logs
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentTab === 'dashboard' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              Analytics
            </button>

            <button
              onClick={() => onSelectTab('bluetooth')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 ${
                currentTab === 'bluetooth' ? 'text-emerald-400 font-semibold' : ''
              }`}
            >
              <span>Bluetooth Auto</span>
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
              title="Settings & Preferences"
              aria-label="Settings & Preferences"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onLockVault}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                isLocked
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {isLocked ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Vault Locked</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Lock Vault</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Ergonomic Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5">
        <div className="grid grid-cols-4 items-center h-14">
          <button
            onClick={() => onSelectTab('live')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'live' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Navigation className="w-5 h-5" />
              {isTripActive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </div>
            <span className="text-[10px] mt-1 tracking-tight">Cockpit</span>
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'history' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Logs</span>
          </button>

          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Stats</span>
          </button>

          <button
            onClick={() => onSelectTab('bluetooth')}
            className={`flex flex-col items-center justify-center h-full transition-colors ${
              currentTab === 'bluetooth' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bluetooth className="w-5 h-5" />
            <span className="text-[10px] mt-1 tracking-tight">Auto-Drive</span>
          </button>
        </div>
      </div>
    </>
  );
};
