import { Capacitor } from '@capacitor/core';
import { NativeBiometric, BiometryType } from '@capgo/capacitor-native-biometric';

const CREDENTIAL_SERVER = 'com.thermoneural.app'; // Identifier for Keychain

export interface BiometricStatus {
    isAvailable: boolean;
    biometryType: BiometryType;
    hasCredentials: boolean;
}

/**
 * Check if biometric authentication is available on the device.
 */
export async function checkBiometricAvailability(): Promise<BiometricStatus> {
    if (!Capacitor.isNativePlatform()) {
        return { isAvailable: false, biometryType: BiometryType.NONE, hasCredentials: false };
    }

    try {
        const result = await NativeBiometric.isAvailable();
        let hasCredentials = false;
        try {
            // Check if we've stored credentials before
            await NativeBiometric.getCredentials({ server: CREDENTIAL_SERVER });
            hasCredentials = true;
        } catch {
            hasCredentials = false;
        }
        return {
            isAvailable: result.isAvailable,
            biometryType: result.biometryType,
            hasCredentials,
        };
    } catch (error) {
        console.error('Biometric check failed:', error);
        return { isAvailable: false, biometryType: BiometryType.NONE, hasCredentials: false };
    }
}

/**
 * Store user credentials securely after a successful login.
 * This allows us to auto-login with biometrics later.
 */
export async function storeCredentials(email: string, password: string): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) return false;

    try {
        await NativeBiometric.setCredentials({
            username: email,
            password: password,
            server: CREDENTIAL_SERVER,
        });
        return true;
    } catch (error) {
        console.error('Failed to store credentials:', error);
        return false;
    }
}

/**
 * Retrieve stored credentials after biometric verification.
 */
export async function getBiometricCredentials(): Promise<{ email: string; password: string } | null> {
    if (!Capacitor.isNativePlatform()) return null;

    try {
        // First, verify the user's identity
        await NativeBiometric.verifyIdentity({
            reason: 'Log in to ThermoNeural',
            title: 'ThermoNeural',
            subtitle: 'Use biometrics to sign in',
            description: 'Place your finger on the sensor or look at the camera.',
        });

        // If successful, get the stored credentials
        const credentials = await NativeBiometric.getCredentials({ server: CREDENTIAL_SERVER });
        return {
            email: credentials.username,
            password: credentials.password,
        };
    } catch (error) {
        console.error('Biometric verification failed:', error);
        return null;
    }
}

/**
 * Delete stored credentials (e.g., on logout).
 */
export async function deleteCredentials(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;

    try {
        await NativeBiometric.deleteCredentials({ server: CREDENTIAL_SERVER });
    } catch (error) {
        console.error('Failed to delete credentials:', error);
    }
}
