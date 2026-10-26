import React, { useState, useEffect } from 'react';
import { BluetoothDeviceConfig } from '../types/trip';
import { bluetoothService } from '../services/bluetoothService';
import { notificationService } from '../services/notificationService';
import {
  Bluetooth,
  Radio,
  Power,
  Bell,
  CheckCircle,
  AlertTriangle,
  Car,
  Sliders,
  Play,
  Square,
  Sparkles,
} from 'lucide-react';

interface BluetoothManagerProps {
  pairedDevices: BluetoothDeviceConfig[];
  onUpdateDevices: (devices: BluetoothDeviceConfig[]) => void;
  onAutoStartTrip: (device: BluetoothDeviceConfig) => void;
  onAutoEndTrip: (device: BluetoothDeviceConfig) => void;
  isTripActive: boolean;
}

export const BluetoothManager: React.FC<BluetoothManagerProps> = ({
  pairedDevices,
  onUpdateDevices,
  onAutoStartTrip,
  onAutoEndTrip,
  isTripActive,
}) => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [activeDevice, setActiveDevice] = useState<BluetoothDeviceConfig | null>(null);

  useEffect(() => {
    setIsSupported(bluetoothService.isSupported());
    setNotificationStatus(notificationService.getPermissionStatus());

    const unsubscribe = bluetoothService.subscribe((status) => {
      setStatusMessage(status.message);
      if (status.event === 'connected' && status.device) {
        setActiveDevice(status.device);
        if (status.device.autoStart && !isTripActive) {
          onAutoStartTrip(status.device);
        }
      } else if (status.event === 'disconnected') {
        const dev = status.device || activeDevice;
        setActiveDevice(null);
        if (dev && dev.autoStop && isTripActive) {
          onAutoEndTrip(dev);
        }
      }
    });

    return () => unsubscribe();
  }, [isTripActive, activeDevice, onAutoStartTrip, onAutoEndTrip]);

  const handleRequestHardwareDevice = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const newDev = await bluetoothService.requestBluetoothDevice();
      if (newDev) {
        // Add to paired list if not already present
        const exists = pairedDevices.find((d) => d.id === newDev.id);
        if (!exists) {
          onUpdateDevices([...pairedDevices, newDev]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bluetooth pairing error';
      setStatusMessage(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleToggleAutoStart = (deviceId: string) => {
    const updated = pairedDevices.map((d) =>
      d.id === deviceId ? { ...d, autoStart: !d.autoStart } : d
    );
    onUpdateDevices(updated);
  };

  const handleToggleAutoStop = (deviceId: string) => {
    const updated = pairedDevices.map((d) =>
      d.id === deviceId ? { ...d, autoStop: !d.autoStop } : d
    );
    onUpdateDevices(updated);
  };

  const handleSimulateConnect = async (dev: BluetoothDeviceConfig) => {
    await bluetoothService.connectDevice(dev, true);
    setActiveDevice(dev);
    notificationService.notifyTripStart(dev.name);
    if (!isTripActive && dev.autoStart) {
      onAutoStartTrip(dev);
    }
  };

  const handleSimulateDisconnect = (dev: BluetoothDeviceConfig) => {
    bluetoothService.disconnect();
    setActiveDevice(null);
    if (isTripActive && dev.autoStop) {
      onAutoEndTrip(dev);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationStatus(granted ? 'granted' : 'denied');
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bluetooth className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Bluetooth Auto-Drive Automation
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automatically start logging when vehicle connects, and trigger trip confirmation when the engine turns off.
          </p>
        </div>

        {/* Push Notification Setup */}
        <div className="flex items-center gap-3">
          {notificationStatus === 'granted' ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-xl">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Push Alerts Active</span>
            </div>
          ) : (
            <button
              onClick={handleEnableNotifications}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Enable Push Notifications</span>
            </button>
          )}

          <button
            onClick={handleRequestHardwareDevice}
            disabled={isConnecting}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{isConnecting ? 'Scanning...' : 'Pair New Bluetooth Device'}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs font-mono text-cyan-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Simulator Quick Testing Console */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">
              Bluetooth Trigger Simulator (Instant Test)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Current Status:{' '}
            <span className={activeDevice ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
              {activeDevice ? `Connected (${activeDevice.name})` : 'Disconnected'}
            </span>
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Test the automated trigger cycle without sitting in your car. Clicking <strong>Connect</strong> simulates vehicle ignition & bluetooth pairing (fires auto-trip start notification). Clicking <strong>Disconnect</strong> simulates turning off vehicle ignition (triggers trip stop and opens confirmation drawer).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {pairedDevices.map((dev) => {
            const isConnected = activeDevice?.id === dev.id;

            return (
              <div
                key={dev.id}
                className={`p-4 rounded-xl border transition-all ${
                  isConnected
                    ? 'bg-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-bold text-white">{dev.name}</span>
                  </div>
                  {isConnected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  {!isConnected ? (
                    <button
                      onClick={() => handleSimulateConnect(dev)}
                      className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Connect (Auto-Start)</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSimulateDisconnect(dev)}
                      className="flex-1 py-2 px-3 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Disconnect (Auto-Stop)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Paired Vehicle Profiles Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3">
          Configured Bluetooth Automation Triggers
        </h3>

        <div className="divide-y divide-slate-800">
          {pairedDevices.map((dev) => (
            <div
              key={dev.id}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-semibold text-slate-200 text-sm">{dev.name}</div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  ID: {dev.id} · Signal: {dev.signalStrength || 'strong'}
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Auto Start Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dev.autoStart}
                    onChange={() => handleToggleAutoStart(dev.id)}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Auto-Start on Connect</span>
                </label>

                {/* Auto Stop Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dev.autoStop}
                    onChange={() => handleToggleAutoStop(dev.id)}
                    className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span className="text-slate-300">Auto-Stop on Disconnect</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
