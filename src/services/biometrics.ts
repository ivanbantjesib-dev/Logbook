class BiometricService {
  /**
   * Checks whether WebAuthn biometric authentication is available on this device/browser.
   */
  public async isBiometricAvailable(): Promise<boolean> {
    if (
      typeof window === 'undefined' ||
      !window.PublicKeyCredential ||
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
    ) {
      return false;
    }

    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Prompts the device's native biometric authenticator (TouchID, FaceID, Windows Hello, Android Biometrics).
   */
  public async authenticateWithBiometrics(promptReason: string = 'Unlock driving logs'): Promise<{ success: boolean; error?: string }> {
    const isAvail = await this.isBiometricAvailable();

    if (!isAvail) {
      // Return false so caller falls back to PIN authentication smoothly
      return { success: false, error: 'Biometric authenticator unavailable on this system.' };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const options: CredentialRequestOptions = {
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname || 'localhost',
        },
      };

      const assertion = await navigator.credentials.get(options);
      if (assertion) {
        return { success: true };
      }
      return { success: false, error: 'Biometric verification cancelled.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Biometric verification was rejected.';
      return { success: false, error: message };
    }
  }

  /**
   * Registers a new biometric credential on this device.
   */
  public async enrollBiometrics(userId: string = 'driver-primary'): Promise<{ success: boolean; credentialId?: string; error?: string }> {
    if (!await this.isBiometricAvailable()) {
      return { success: false, error: 'Platform biometrics not supported on this browser.' };
    }

    try {
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      const userBuffer = new TextEncoder().encode(userId);

      const createOptions: CredentialCreationOptions = {
        publicKey: {
          challenge,
          rp: {
            name: 'AeroTrack Driving Vault',
            id: window.location.hostname || 'localhost',
          },
          user: {
            id: userBuffer,
            name: 'driver@aerotrack.internal',
            displayName: 'Primary Vehicle Operator',
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      };

      const newCred = (await navigator.credentials.create(createOptions)) as PublicKeyCredential | null;
      if (newCred) {
        return { success: true, credentialId: newCred.id };
      }
      return { success: false, error: 'Registration was cancelled.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Biometric enrollment failed.';
      return { success: false, error: message };
    }
  }
}

export const biometricService = new BiometricService();
