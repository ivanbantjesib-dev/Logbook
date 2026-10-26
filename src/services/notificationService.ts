export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClick?: () => void;
}

class NotificationService {
  private hasPermission: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasPermission = Notification.permission === 'granted';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    } catch {
      return false;
    }
  }

  public notify(payload: NotificationPayload): void {
    // 1. Play soft subtle audio chime if audio context allows
    this.playAudioCue();

    // 2. Mobile vibration feedback if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 80, 120]);
      } catch {
        // ignore vibration block
      }
    }

    // 3. System Push Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(payload.title, {
          body: payload.body,
          tag: payload.tag || 'trip_alert',
        });

        if (payload.onClick) {
          notif.onclick = () => {
            window.focus();
            payload.onClick?.();
            notif.close();
          };
        }
      } catch (err) {
        console.warn('System push notification failed:', err);
      }
    }
  }

  public notifyTripStart(deviceName?: string): void {
    const deviceText = deviceName ? ` via ${deviceName}` : '';
    this.notify({
      title: '🚗 Trip Started Automatically',
      body: `AeroTrack is recording your route and distance${deviceText}. Driving in dark cockpit mode.`,
      tag: 'trip_start',
    });
  }

  public notifyTripEnd(distanceKm: number, onConfirmClick?: () => void): void {
    this.notify({
      title: '🏁 Trip Finished Automatically',
      body: `Logged ${distanceKm.toFixed(2)} km. Tap to review and confirm trip details before cloud saving.`,
      tag: 'trip_stop',
      onClick: onConfirmClick,
    });
  }

  private playAudioCue(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio cue is optional, ignore if autoplay restricted
    }
  }
}

export const notificationService = new NotificationService();
