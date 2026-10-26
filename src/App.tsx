import React, { useState, useCallback } from 'react';
import { Trip, TripCategory, UserSettings, ViewTab } from './types/trip';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import { Header } from './components/Header';
import { LiveHUD } from './components/LiveHUD';
import { TripHistory } from './components/TripHistory';
import { Dashboard } from './components/Dashboard';
import { BluetoothManager } from './components/BluetoothManager';
import { TripConfirmModal } from './components/TripConfirmModal';
import { TripEditModal } from './components/TripEditModal';
import { ManualTripModal } from './components/ManualTripModal';
import { SettingsModal } from './components/SettingsModal';
import { BiometricLockScreen } from './components/BiometricLockScreen';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [trips, setTrips] = useState<Trip[]>(() => storageService.getTrips());
  const [currentTab, setCurrentTab] = useState<ViewTab>('live');

  // Biometric lock status
  const [isLocked, setIsLocked] = useState<boolean>(() => settings.biometricLockEnabled);

  // Active Live Drive State
  const [isTripActive, setIsTripActive] = useState<boolean>(false);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  // Modals state
  const [pendingConfirmTrip, setPendingConfirmTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isManualTripModalOpen, setIsManualTripModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Save settings helper
  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    showToast('Preferences updated successfully');
  };

  // Start Trip
  const handleStartTrip = useCallback(
    (category: TripCategory, bluetoothDeviceName?: string) => {
      const now = Date.now();
      const newTrip: Trip = {
        id: `trip_${now}`,
        title: category === 'business' ? 'Business Drive' : 'Personal Drive',
        startTime: now,
        endTime: now,
        durationSeconds: 0,
        distanceKm: 0,
        category,
        purpose: category === 'business' ? 'Business Client Route' : 'Personal Transit',
        notes: bluetoothDeviceName ? `Auto-started via ${bluetoothDeviceName}` : '',
        vehicleName: 'Primary Vehicle',
        startAddress: 'Departure Point',
        endAddress: 'In Transit...',
        coordinates: [],
        avgSpeedKmH: 0,
        maxSpeedKmH: 0,
        syncedToCloud: false,
        status: 'pending_confirmation',
        bluetoothTriggered: !!bluetoothDeviceName,
        bluetoothDeviceName,
        createdAt: now,
        updatedAt: now,
      };

      setActiveTrip(newTrip);
      setIsTripActive(true);
      notificationService.notifyTripStart(bluetoothDeviceName);
      showToast(
        bluetoothDeviceName
          ? `🚗 Trip started automatically via ${bluetoothDeviceName}`
          : '🚗 Driving logger active in dark cockpit mode'
      );
    },
    [showToast]
  );

  // Stop Trip -> Triggers Confirmation Modal
  const handleStopTrip = useCallback(
    (tripToStop: Trip) => {
      const now = Date.now();
      const finalDuration = Math.max(1, Math.floor((now - tripToStop.startTime) / 1000));
      const finalAvg =
        finalDuration > 0 ? tripToStop.distanceKm / (finalDuration / 3600) : 0;

      const completedTrip: Trip = {
        ...tripToStop,
        endTime: now,
        durationSeconds: finalDuration,
        avgSpeedKmH: finalAvg,
        status: 'pending_confirmation',
        updatedAt: now,
      };

      setIsTripActive(false);
      setActiveTrip(null);
      setPendingConfirmTrip(completedTrip);

      notificationService.notifyTripEnd(completedTrip.distanceKm, () => {
        setPendingConfirmTrip(completedTrip);
      });

      showToast(`🏁 Trip complete (${completedTrip.distanceKm.toFixed(2)} km). Please review & confirm.`);
    },
    [showToast]
  );

  // Confirm Trip and Save to Cloud Database
  const handleConfirmTrip = (confirmed: Trip) => {
    storageService.confirmTripToCloud(confirmed.id, confirmed);
    setTrips(storageService.getTrips());
    setPendingConfirmTrip(null);
    showToast('✓ Trip data confirmed and stored to cloud database');
  };

  // Discard Trip
  const handleDiscardTrip = (tripId: string) => {
    storageService.deleteTrip(tripId);
    setTrips(storageService.getTrips());
    setPendingConfirmTrip(null);
    showToast('Trip was discarded');
  };

  // Edit Past Trip
  const handleSaveEditedTrip = (updated: Trip) => {
    storageService.updateTrip(updated.id, updated);
    setTrips(storageService.getTrips());
    setEditingTrip(null);
    showToast('✓ Driving record updated');
  };

  // Delete Past Trip
  const handleDeletePastTrip = (tripId: string) => {
    storageService.deleteTrip(tripId);
    setTrips(storageService.getTrips());
    setEditingTrip(null);
    showToast('Trip deleted from database');
  };

  // Add Manual Past Trip
  const handleSaveManualTrip = (newTrip: Trip) => {
    storageService.addTrip(newTrip);
    setTrips(storageService.getTrips());
    setIsManualTripModalOpen(false);
    showToast('✓ Manual driving log saved to cloud');
  };

  // Reset sample seed trips
  const handleResetSeedData = () => {
    localStorage.removeItem('aerotrack_trips_v1');
    const fresh = storageService.getTrips();
    setTrips(fresh);
    showToast('Sample trips re-seeded');
  };

  // If vault is locked and user tries to access protected records, show lock screen
  const isProtectedTab = currentTab === 'history' || currentTab === 'dashboard';

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans pb-20 md:pb-10">
      {/* Biometric Lock Overlay */}
      {isLocked && isProtectedTab && (
        <BiometricLockScreen
          configuredPin={settings.biometricPin}
          onUnlock={() => setIsLocked(false)}
        />
      )}

      {/* Primary Top Bar & Mobile Bottom Tab Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
        }}
        isLocked={isLocked}
        onLockVault={() => setIsLocked(!isLocked)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        isTripActive={isTripActive}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentTab === 'live' && (
          <LiveHUD
            isTripActive={isTripActive}
            activeTrip={activeTrip}
            defaultCategory={settings.defaultCategory}
            onStartTrip={handleStartTrip}
            onStopTrip={handleStopTrip}
            onUpdateActiveTrip={(t) => setActiveTrip(t)}
          />
        )}

        {currentTab === 'history' && !isLocked && (
          <TripHistory
            trips={trips}
            onEditTrip={(trip) => setEditingTrip(trip)}
            onDeleteTrip={handleDeletePastTrip}
            onAddManualTrip={() => setIsManualTripModalOpen(true)}
          />
        )}

        {currentTab === 'dashboard' && !isLocked && (
          <Dashboard trips={trips} />
        )}

        {currentTab === 'bluetooth' && (
          <BluetoothManager
            pairedDevices={settings.pairedDevices}
            onUpdateDevices={(newDevices) => {
              const updated = { ...settings, pairedDevices: newDevices };
              setSettings(updated);
              storageService.saveSettings(updated);
            }}
            onAutoStartTrip={(dev) => handleStartTrip(settings.defaultCategory, dev.name)}
            onAutoEndTrip={() => {
              if (activeTrip) {
                handleStopTrip(activeTrip);
              }
            }}
            isTripActive={isTripActive}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-cyan-500/30 text-white text-xs font-medium shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Trip Confirmation Modal (Prompted at end of drive before cloud save) */}
      {pendingConfirmTrip && (
        <TripConfirmModal
          trip={pendingConfirmTrip}
          onConfirm={handleConfirmTrip}
          onDiscard={handleDiscardTrip}
        />
      )}

      {/* Edit Past Trip Modal */}
      {editingTrip && (
        <TripEditModal
          trip={editingTrip}
          onSave={handleSaveEditedTrip}
          onDelete={handleDeletePastTrip}
          onClose={() => setEditingTrip(null)}
        />
      )}

      {/* Manual Trip Entry Modal */}
      {isManualTripModalOpen && (
        <ManualTripModal
          defaultCategory={settings.defaultCategory}
          onSave={handleSaveManualTrip}
          onClose={() => setIsManualTripModalOpen(false)}
        />
      )}

      {/* Settings Modal - with direct CSV Export trigger */}
      {isSettingsModalOpen && (
        <SettingsModal
          settings={settings}
          trips={trips}
          onSaveSettings={handleSaveSettings}
          onResetSeedData={handleResetSeedData}
          onClose={() => setIsSettingsModalOpen(false)}
        />
      )}
    </div>
  );
}
