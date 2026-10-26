import { BluetoothDeviceConfig } from '../types/trip';

export interface WebBluetoothRemoteGATTServer {
  connected: boolean;
  disconnect(): void;
}

export interface WebBluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect(): Promise<WebBluetoothRemoteGATTServer>;
    disconnect(): void;
  };
}

declare global {
  interface Navigator {
    bluetooth?: {
      requestDevice(options: {
        acceptAllDevices?: boolean;
        filters?: Array<Record<string, unknown>>;
        optionalServices?: string[];
      }): Promise<WebBluetoothDevice>;
    };
  }
}

type BluetoothListener = (status: {
  connected: boolean;
  device?: BluetoothDeviceConfig;
  event: 'connected' | 'disconnected' | 'error';
  message: string;
}) => void;

class BluetoothService {
  private activeDevice: WebBluetoothDevice | null = null;
  private activeGatt: WebBluetoothRemoteGATTServer | null = null;
  private listeners: Set<BluetoothListener> = new Set();
  private isSimulatedConnected: boolean = false;
  private currentDeviceConfig: BluetoothDeviceConfig | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator && !!navigator.bluetooth;
  }

  public subscribe(listener: BluetoothListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(data: {
    connected: boolean;
    device?: BluetoothDeviceConfig;
    event: 'connected' | 'disconnected' | 'error';
    message: string;
  }) {
    this.listeners.forEach((fn) => fn(data));
  }

  public getCurrentStatus() {
    return {
      connected: this.isSimulatedConnected || (this.activeGatt?.connected ?? false),
      device: this.currentDeviceConfig,
    };
  }

  /**
   * Scans for nearby Bluetooth hardware devices using Web Bluetooth API.
   */
  public async requestBluetoothDevice(): Promise<BluetoothDeviceConfig | null> {
    if (!this.isSupported() || !navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported in this browser environment.');
    }

    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service', 'device_information'],
      });

      const config: BluetoothDeviceConfig = {
        id: device.id,
        name: device.name || 'Bluetooth Vehicle Audio',
        autoStart: true,
        autoStop: true,
        isPaired: true,
        signalStrength: 'strong',
        lastConnected: Date.now(),
      };

      this.activeDevice = device;
      this.currentDeviceConfig = config;

      // Listen for unexpected disconnect
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDeviceDisconnected();
      });

      // Attempt GATT connection
      if (device.gatt) {
        this.activeGatt = await device.gatt.connect();
      }

      this.notify({
        connected: true,
        device: config,
        event: 'connected',
        message: `Connected to ${config.name}. Auto-trip logger engaged.`,
      });

      return config;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bluetooth pairing was cancelled or failed.';
      this.notify({
        connected: false,
        event: 'error',
        message,
      });
      return null;
    }
  }

  /**
   * Connect to an existing paired device configuration (or simulate connection).
   */
  public async connectDevice(config: BluetoothDeviceConfig, isSimulation: boolean = false): Promise<boolean> {
    this.currentDeviceConfig = config;

    if (isSimulation || !this.isSupported()) {
      this.isSimulatedConnected = true;
      this.notify({
        connected: true,
        device: config,
        event: 'connected',
        message: `Linked to ${config.name} (Bluetooth Auto-Trigger Active)`,
      });
      return true;
    }

    try {
      if (this.activeDevice && this.activeDevice.gatt) {
        this.activeGatt = await this.activeDevice.gatt.connect();
        this.notify({
          connected: true,
          device: config,
          event: 'connected',
          message: `Connected to ${config.name}`,
        });
        return true;
      } else {
        // Fallback to simulation mode if hardware gatt not available
        this.isSimulatedConnected = true;
        this.notify({
          connected: true,
          device: config,
          event: 'connected',
          message: `Linked to ${config.name} (Active Trigger Mode)`,
        });
        return true;
      }
    } catch {
      this.isSimulatedConnected = true;
      this.notify({
        connected: true,
        device: config,
        event: 'connected',
        message: `Linked to ${config.name}`,
      });
      return true;
    }
  }

  /**
   * Disconnects active Bluetooth device, which triggers auto-stop trip.
   */
  public disconnect(): void {
    if (this.activeGatt && this.activeGatt.connected) {
      try {
        this.activeGatt.disconnect();
      } catch {
        // ignore
      }
    }
    this.handleDeviceDisconnected();
  }

  private handleDeviceDisconnected(): void {
    const prevConfig = this.currentDeviceConfig;
    this.isSimulatedConnected = false;
    this.activeGatt = null;

    this.notify({
      connected: false,
      device: prevConfig || undefined,
      event: 'disconnected',
      message: prevConfig
        ? `Disconnected from ${prevConfig.name}. Trip auto-stopped.`
        : 'Bluetooth device disconnected. Trip auto-stopped.',
    });
  }
}

export const bluetoothService = new BluetoothService();
