import React, { useState } from 'react';
import { UserSettings, TripCategory, Trip } from '../types/trip';
import { biometricService } from '../services/biometrics';
import { notificationService } from '../services/notificationService';
import { downloadCsvReport } from '../services/csvExport';
import {
  Settings,
  Fingerprint,
  Bell,
  Check,
  X,
  RefreshCw,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsModalProps {
  settings: UserSettings;
  trips: Trip[];
  onSaveSettings: (settings: UserSettings) => void;
  onResetSeedData: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  trips,
  onSaveSettings,
  onResetSeedData,
  onClose,
}) => {
  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  const handleTestBiometric = async () => {
    setBiometricFeedback('Prompting device authenticator...');
    const res = await biometricService.authenticateWithBiometrics('Test biometrics for AeroTrack');
    if (res.success) {
      setBiometricFeedback('Biometric authentication verified successfully!');
    } else {
      setBiometricFeedback(`Result: ${res.error || 'Cancelled or not supported'}`);
    }
  };

  const handleTestNotification = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      notificationService.notify({
        title: '🔔 AeroTrack Notification Test',
        body: 'Push notifications are operational for trip auto-start & trip review alerts.',
      });
      setNotificationFeedback('Test notification dispatched!');
    } else {
      setNotificationFeedback('Notification permission not granted in browser.');
    }
  };

  const handleExportAllCsv = () => {
    downloadCsvReport(trips, { category: 'all', year: 'all' }, 'aerotrack_all_logged_trips');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              AeroTrack Preferences & Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Data Export Option directly in Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Data Export & Backup</span>
            </h4>
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white block">Export All Trip Data (CSV)</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Includes date, time, distance in kilometers, duration, and trip category.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportAllCsv}
                className="h-9 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shrink-0 active:scale-95 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Units & Classification */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Measurement & Classification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Distance Unit</label>
                <div className="h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 flex items-center justify-between">
                  <span>Kilometers (km)</span>
                  <span className="text-[10px] text-slate-500 font-sans">Locked</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Default Classification</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultCategory: 'business' })}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formData.defaultCategory === 'business'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'text-slate-400'
                    }`}
                  >
                    Business
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, defaultCategory: 'personal' })}
                    className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      formData.defaultCategory === 'personal'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400'
                    }`}
                  >
                    Personal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Biometric Security */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-4 h-4 text-emerald-400" />
                  <span>Biometric Authentication</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Require FaceID, TouchID, or PIN to unlock sensitive driving logs
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.biometricLockEnabled}
                  onChange={(e) => setFormData({ ...formData, biometricLockEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>

            {formData.biometricLockEnabled && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Fallback 4-Digit PIN</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={formData.biometricPin}
                      onChange={(e) => setFormData({ ...formData, biometricPin: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono tracking-widest text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleTestBiometric}
                      className="w-full h-10 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Test Biometrics</span>
                    </button>
                  </div>
                </div>

                {biometricFeedback && (
                  <p className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded-lg border border-cyan-800/40">
                    {biometricFeedback}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Push Notifications */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>Push Notifications</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alerts on trip auto-start and prompts to review trip details when stopping
                </p>
              </div>

              <button
                type="button"
                onClick={handleTestNotification}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 cursor-pointer"
              >
                Send Test Alert
              </button>
            </div>

            {notificationFeedback && (
              <p className="text-[11px] font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/40">
                {notificationFeedback}
              </p>
            )}
          </div>

          {/* Reset sample data */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400 block">Sample Driving Logs</span>
              <span className="text-[11px] text-slate-500">Restore default trip records</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onResetSeedData();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Sample Trips</span>
            </button>
          </div>

          {/* Footer Save */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
