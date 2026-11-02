/**
 * @she-raksha/mobile — Platform Capability Guard
 *
 * Implements Android Foreground Service & iOS platform capability guards:
 *  - Evaluates raw power-button, background mic, direct SMS, and BLE advertising capabilities.
 *  - Manages Android Foreground Service lifecycle with LOCATION & MICROPHONE types.
 *  - Automatically activates stealth fallbacks (volume-button / on-screen gesture)
 *    when OS sandbox policies restrict raw hardware interrupts.
 */

import { PlatformCapabilities, ForegroundServiceConfig } from '../types.js';

export class PlatformGuard {
  private capabilities: PlatformCapabilities;
  private activeForegroundServiceConfig: ForegroundServiceConfig | null = null;

  constructor(customCapabilities?: Partial<PlatformCapabilities>) {
    this.capabilities = {
      os: 'headless',
      canInterceptPowerButton: false,
      canRunBackgroundMic: true,
      canSendDirectSMS: false,
      canAdvertiseBLEBackground: true,
      isForegroundServiceActive: false,
      isBatteryOptimizationExempt: false,
      ...customCapabilities,
    };
  }

  /**
   * Initializes platform capabilities based on current runtime environment.
   */
  public detectEnvironment(runtimeOs?: 'android' | 'ios' | 'headless'): PlatformCapabilities {
    const os = runtimeOs || this.capabilities.os;
    if (os === 'android') {
      this.capabilities = {
        os: 'android',
        // In Android, raw power button requires AccessibilityService or Foreground Service
        canInterceptPowerButton: this.capabilities.isForegroundServiceActive,
        canRunBackgroundMic: this.capabilities.isForegroundServiceActive,
        canSendDirectSMS: true, // Native SMSManager available
        canAdvertiseBLEBackground: true, // BluetoothLeAdvertiser supported
        isForegroundServiceActive: this.capabilities.isForegroundServiceActive,
        isBatteryOptimizationExempt: this.capabilities.isBatteryOptimizationExempt,
      };
    } else if (os === 'ios') {
      this.capabilities = {
        os: 'ios',
        // iOS strictly sandboxes raw power-button interception and background mic without active call/recording session
        canInterceptPowerButton: false,
        canRunBackgroundMic: false,
        canSendDirectSMS: false, // MFMessageComposeViewController requires user interaction on standard iOS
        canAdvertiseBLEBackground: false, // CoreBluetooth background advertising has strict restrictions
        isForegroundServiceActive: false,
        isBatteryOptimizationExempt: false,
      };
    } else {
      // Headless / Test environment
      this.capabilities.os = 'headless';
    }
    return { ...this.capabilities };
  }

  /**
   * Starts an Android Foreground Service with location and microphone permissions.
   */
  public startForegroundService(config: ForegroundServiceConfig): boolean {
    if (this.capabilities.os === 'ios') {
      throw new Error('Foreground Service is an Android-specific capability.');
    }

    this.activeForegroundServiceConfig = { ...config };
    this.capabilities.isForegroundServiceActive = true;
    this.capabilities.canInterceptPowerButton = true;
    this.capabilities.canRunBackgroundMic = true;
    return true;
  }

  /**
   * Stops the active Foreground Service.
   */
  public stopForegroundService(): boolean {
    this.activeForegroundServiceConfig = null;
    this.capabilities.isForegroundServiceActive = false;
    if (this.capabilities.os === 'android') {
      this.capabilities.canInterceptPowerButton = false;
      this.capabilities.canRunBackgroundMic = false;
    }
    return true;
  }

  /**
   * Checks whether stealth fallback triggers should be activated.
   */
  public shouldActivateStealthFallback(): {
    useVolumeButtonFallback: boolean;
    useOnScreenGestureFallback: boolean;
    reason: string;
  } {
    if (!this.capabilities.canInterceptPowerButton) {
      return {
        useVolumeButtonFallback: true,
        useOnScreenGestureFallback: true,
        reason: `OS (${this.capabilities.os}) restricts raw power-button interrupt. Stealth volume-button and on-screen gesture fallbacks engaged.`,
      };
    }
    return {
      useVolumeButtonFallback: false,
      useOnScreenGestureFallback: false,
      reason: 'Raw power-button interrupt capability active via Android Foreground Service.',
    };
  }

  /**
   * Sets battery optimization exemption status (e.g. REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).
   */
  public setBatteryOptimizationExempt(exempt: boolean): void {
    this.capabilities.isBatteryOptimizationExempt = exempt;
  }

  public getCapabilities(): PlatformCapabilities {
    return { ...this.capabilities };
  }

  public getActiveServiceConfig(): ForegroundServiceConfig | null {
    return this.activeForegroundServiceConfig;
  }
}
