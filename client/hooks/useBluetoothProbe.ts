import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Interface for the ThermoKey Probe Data
 * Extending to support multiple readings (Temp/Pressure)
 */
export interface ProbeData {
    temperature_f?: number;
    pressure_psi?: number;
    humidity_rh?: number;
    timestamp: number;
}

interface UseBluetoothProbeOptions {
    serviceUuid?: string | number; // Default: Environmental Sensing (0x181A)
    characteristicUuid?: string | number; // Default: Temperature (0x2A6E)
    simulate?: boolean; // Enable demo mode
}

export function useBluetoothProbe({
    serviceUuid = 0x181a,
    characteristicUuid = 0x2a6e,
    simulate = false,
}: UseBluetoothProbeOptions = {}) {
    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [data, setData] = useState<ProbeData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Simulation Timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (simulate && isConnected) {
            interval = setInterval(() => {
                // Simulating realistic HVAC readings
                // Outdoor Dry Bulb: 65-95F
                // Pressure (R410A Suction): 100-130 PSI
                setData({
                    temperature_f: Number((75 + Math.random() * 5).toFixed(1)),
                    pressure_psi: Number((118 + Math.random() * 2).toFixed(1)),
                    timestamp: Date.now(),
                });
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [simulate, isConnected]);

    const connect = useCallback(async () => {
        setError(null);

        // 1. Simulation Mode
        if (simulate) {
            toast.info("🔌 Demo Mode: Simulating connection...");
            setTimeout(() => {
                setIsConnected(true);
                setDevice({ name: "ThermoKey Demo", id: "demo-123" } as BluetoothDevice);
                toast.success("Connected to ThermoKey (Demo)");
            }, 1000);
            return;
        }

        // 2. Browser Compatibility Check
        if (!navigator.bluetooth) {
            const msg = "Web Bluetooth is not supported in this browser. Try Chrome or Bluefy (iOS).";
            setError(msg);
            toast.error("Bluetooth Error", { description: msg });
            return;
        }

        // 3. Physical Connection
        try {
            toast.loading("Scanning for ThermoKey...");

            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true, // For broad compatibility during prototyping
                optionalServices: [serviceUuid],
            });

            setDevice(device);

            if (device.gatt) {
                const server = await device.gatt.connect();
                setIsConnected(server.connected);

                // Listen for disconnect
                device.addEventListener('gattserverdisconnected', () => {
                    setIsConnected(false);
                    toast.warning("ThermoKey Disconnected");
                });

                toast.success(`Connected to ${device.name || 'Device'}`);

                // Note: Real characteristic reading logic would go here
                // For Phase 1 (Prototype), we rely on Simulation or simple connect check
            }
        } catch (err: any) {
            console.error(err);
            // Ignore user cancellation errors
            if (err.name !== 'NotFoundError' && err.message !== 'User cancelled the requestDevice() chooser.') {
                setError(err.message);
                toast.error("Connection Failed", { description: err.message });
            }
        }
    }, [serviceUuid, simulate]);

    const disconnect = useCallback(() => {
        if (simulate) {
            setIsConnected(false);
            setDevice(null);
            setData(null);
            toast.info("Disconnected from Demo Device");
            return;
        }

        if (device?.gatt?.connected) {
            device.gatt.disconnect();
        }
    }, [device, simulate]);

    return {
        connect,
        disconnect,
        isConnected,
        device,
        data,
        error
    };
}
