/**
 * @she-raksha/mobile — Stealth Hardware & Sensor Trigger Service
 *
 * Implements FR-SOS-001:
 *  - 4-Tap Power Button Interrupt detector with sliding window and debouncing.
 *  - Volume-button toggle interrupt fallback for OS-restricted environments.
 *  - Stealth on-screen gesture fallback (4-finger long press or rapid 4-tap stealth pattern).
 *  - Dispatches canonical TriggerMode with zero PII logging.
 */

import { TriggerMode } from '@she-raksha/schemas';
import { HardwareTriggerEvent, TriggerSource } from '../types.js';
import { PlatformGuard } from './platformGuard.js';

export type TriggerListener = (event: HardwareTriggerEvent) => void | Promise<void>;

export interface HardwareTriggerOptions {
  tapWindowMs?: number; // Maximum time to complete 4 taps (default: 2500ms)
  minDebounceMs?: number; // Minimum gap between taps to reject switch bounce (default: 100ms)
  volumeToggleCount?: number; // Number of volume toggles for fallback (default: 4)
  volumeWindowMs?: number; // Maximum time for volume sequence (default: 2000ms)
}

export class HardwareTriggerService {
  private powerButtonPressTimes: number[] = [];
  private volumeKeyEvents: Array<{ key: 'UP' | 'DOWN'; timestamp: number }> = [];
  private listeners: Set<TriggerListener> = new Set();
  private isArmed: boolean = true;
  private readonly tapWindowMs: number;
  private readonly minDebounceMs: number;
  private readonly volumeToggleCount: number;
  private readonly volumeWindowMs: number;
  private platformGuard: PlatformGuard;

  constructor(platformGuard?: PlatformGuard, options?: HardwareTriggerOptions) {
    this.platformGuard = platformGuard || new PlatformGuard();
    this.tapWindowMs = options?.tapWindowMs ?? 2500;
    this.minDebounceMs = options?.minDebounceMs ?? 100;
    this.volumeToggleCount = options?.volumeToggleCount ?? 4;
    this.volumeWindowMs = options?.volumeWindowMs ?? 2000;
  }

  /**
   * Registers a listener to be notified when an SOS trigger condition is met.
   */
  public onTrigger(listener: TriggerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Arm or disarm trigger detection (e.g. when app enters background without permissions).
   */
  public setArmed(armed: boolean): void {
    this.isArmed = armed;
    if (!armed) {
      this.resetCounters();
    }
  }

  public getArmed(): boolean {
    return this.isArmed;
  }

  /**
   * Ingests a raw hardware power-button press event.
   * If 4 presses occur within tapWindowMs (with >= minDebounceMs between presses),
   * an SOS trigger event is immediately dispatched.
   */
  public handlePowerButtonPress(timestamp: number = Date.now()): boolean {
    if (!this.isArmed) return false;

    // Reject switch bounce
    const lastPress = this.powerButtonPressTimes[this.powerButtonPressTimes.length - 1];
    if (lastPress && timestamp - lastPress < this.minDebounceMs) {
      return false;
    }

    // Slide window: discard presses older than tapWindowMs
    this.powerButtonPressTimes.push(timestamp);
    const windowStart = timestamp - this.tapWindowMs;
    this.powerButtonPressTimes = this.powerButtonPressTimes.filter((t) => t >= windowStart);

    if (this.powerButtonPressTimes.length >= 4) {
      this.powerButtonPressTimes = [];
      this.dispatchTrigger({
        triggerMode: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
        source: 'POWER_BUTTON',
        timestamp,
        metadata: { tapCount: 4, windowMs: this.tapWindowMs },
      });
      return true;
    }

    return false;
  }

  /**
   * Ingests a volume key press as a stealth fallback when power-button interception is restricted.
   */
  public handleVolumeKeyPress(key: 'UP' | 'DOWN', timestamp: number = Date.now()): boolean {
    if (!this.isArmed) return false;

    // Slide window for volume keys
    this.volumeKeyEvents.push({ key, timestamp });
    const windowStart = timestamp - this.volumeWindowMs;
    this.volumeKeyEvents = this.volumeKeyEvents.filter((e) => e.timestamp >= windowStart);

    if (this.volumeKeyEvents.length >= this.volumeToggleCount) {
      this.volumeKeyEvents = [];
      this.dispatchTrigger({
        triggerMode: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
        source: 'VOLUME_BUTTON_FALLBACK',
        timestamp,
        metadata: { toggleCount: this.volumeToggleCount, windowMs: this.volumeWindowMs },
      });
      return true;
    }

    return false;
  }

  /**
   * Ingests a stealth on-screen gesture (e.g. 4-finger long press or rapid 4-corner tap).
   */
  public handleStealthOnScreenGesture(
    gestureType: 'FOUR_FINGER_HOLD' | 'QUAD_CORNER_TAP',
    timestamp: number = Date.now()
  ): boolean {
    if (!this.isArmed) return false;

    this.dispatchTrigger({
      triggerMode: TriggerMode.MANUAL_BUTTON,
      source: 'STEALTH_ON_SCREEN_GESTURE',
      timestamp,
      metadata: { gestureType },
    });
    return true;
  }

  /**
   * Resets all internal sequence counters.
   */
  public resetCounters(): void {
    this.powerButtonPressTimes = [];
    this.volumeKeyEvents = [];
  }

  private dispatchTrigger(event: HardwareTriggerEvent): void {
    for (const listener of this.listeners) {
      try {
        const result = listener(event);
        if (result instanceof Promise) {
          result.catch(() => {
            /* Handled in caller */
          });
        }
      } catch {
        /* Ignore listener exceptions */
      }
    }
  }
}
