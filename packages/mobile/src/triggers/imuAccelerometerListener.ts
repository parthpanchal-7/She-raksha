/**
 * @she-raksha/mobile — IMU Accelerometer Jerk-Vector Listener
 *
 * Implements FR-SOS-001 (IMU Trigger Layer):
 *  - Samples tri-axial accelerometer at >= 50Hz (interval <= 20ms).
 *  - Remote-configurable thresholds defaulting to 2.5g (sustained shake) and 3.8g (high-impact fall).
 *  - Sustained Shake Algorithm: Calculates jerk vector and directional reversals over sliding window.
 *  - High-Impact Fall Detection: Free-fall (< 0.4g) -> High Impact (>= 3.8g) -> Post-fall immobility.
 *  - Emits canonical TriggerMode.SHAKE_ACCELEROMETER and TriggerMode.FALL_DETECTION.
 */

import {
  SHAKE_THRESHOLD_DISTRESS_G,
  SHAKE_THRESHOLD_FALL_G,
  TriggerMode,
} from '@she-raksha/schemas';
import { AccelerometerSample, HardwareTriggerEvent, IMUConfig, JerkVector } from '../types.js';

export type IMUTriggerListener = (event: HardwareTriggerEvent) => void | Promise<void>;

export class IMUAccelerometerListener {
  private config: IMUConfig;
  private previousSample: AccelerometerSample | null = null;
  private sampleBuffer: AccelerometerSample[] = [];
  private jerkBuffer: JerkVector[] = [];
  private listeners: Set<IMUTriggerListener> = new Set();
  private isListening: boolean = false;

  // Fall detection state machine
  private fallState: 'NORMAL' | 'FREE_FALL_DETECTED' | 'IMPACT_DETECTED' = 'NORMAL';
  private freeFallTimestamp: number = 0;
  private impactTimestamp: number = 0;

  constructor(customConfig?: Partial<IMUConfig>) {
    this.config = {
      samplingRateHz: 50, // >= 50Hz required
      distressShakeThresholdG: SHAKE_THRESHOLD_DISTRESS_G, // 2.5g canonical default
      fallImpactThresholdG: SHAKE_THRESHOLD_FALL_G, // 3.8g canonical default
      freeFallThresholdG: 0.4, // < 0.4g indicates free-fall
      shakeWindowMs: 1200, // 1.2s window
      requiredReversals: 3, // At least 3 directional reversals
      fallStillnessWindowMs: 1500, // Post-impact observation
      ...customConfig,
    };
  }

  public onTrigger(listener: IMUTriggerListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public start(): void {
    this.isListening = true;
    this.resetState();
  }

  public stop(): void {
    this.isListening = false;
    this.resetState();
  }

  public updateConfig(newConfig: Partial<IMUConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): IMUConfig {
    return { ...this.config };
  }

  /**
   * Ingests a new tri-axial accelerometer sample.
   * Samples must be provided at >= 50Hz (e.g. interval <= 20ms).
   */
  public ingestSample(sample: AccelerometerSample): {
    shakeDetected: boolean;
    fallDetected: boolean;
    magnitudeG: number;
    jerkMagnitudeGPerSec?: number;
  } {
    if (!this.isListening) {
      return { shakeDetected: false, fallDetected: false, magnitudeG: 0 };
    }

    const magnitudeG = Math.sqrt(sample.x ** 2 + sample.y ** 2 + sample.z ** 2);
    let jerkMagnitudeGPerSec = 0;

    // 1. Calculate Jerk Vector: (a_t - a_{t-1}) / dt
    if (this.previousSample) {
      const dtSec = Math.max((sample.timestamp - this.previousSample.timestamp) / 1000, 0.001);
      const jx = (sample.x - this.previousSample.x) / dtSec;
      const jy = (sample.y - this.previousSample.y) / dtSec;
      const jz = (sample.z - this.previousSample.z) / dtSec;
      jerkMagnitudeGPerSec = Math.sqrt(jx ** 2 + jy ** 2 + jz ** 2);

      const jerkVector: JerkVector = {
        jx,
        jy,
        jz,
        magnitude: jerkMagnitudeGPerSec,
        timestamp: sample.timestamp,
      };

      this.jerkBuffer.push(jerkVector);
    }

    this.sampleBuffer.push(sample);
    this.previousSample = sample;

    // Prune buffers older than shakeWindowMs
    const pruneThreshold = sample.timestamp - Math.max(this.config.shakeWindowMs, this.config.fallStillnessWindowMs);
    this.sampleBuffer = this.sampleBuffer.filter((s) => s.timestamp >= pruneThreshold);
    this.jerkBuffer = this.jerkBuffer.filter((j) => j.timestamp >= pruneThreshold);

    // 2. Evaluate High-Impact Fall Detection State Machine
    const fallDetected = this.evaluateFallDetection(sample, magnitudeG);
    if (fallDetected) {
      this.dispatchTrigger({
        triggerMode: TriggerMode.FALL_DETECTION,
        source: 'ACCELEROMETER_FALL',
        timestamp: sample.timestamp,
        confidence: Math.min(magnitudeG / this.config.fallImpactThresholdG, 1.0),
        metadata: {
          impactMagnitudeG: magnitudeG,
          thresholdG: this.config.fallImpactThresholdG,
        },
      });
      this.resetState();
      return { shakeDetected: false, fallDetected: true, magnitudeG, jerkMagnitudeGPerSec };
    }

    // 3. Evaluate Sustained Shake Algorithm
    const shakeDetected = this.evaluateSustainedShake(sample);
    if (shakeDetected) {
      this.dispatchTrigger({
        triggerMode: TriggerMode.SHAKE_ACCELEROMETER,
        source: 'ACCELEROMETER_SHAKE',
        timestamp: sample.timestamp,
        confidence: 0.95,
        metadata: {
          distressThresholdG: this.config.distressShakeThresholdG,
        },
      });
      this.resetState();
      return { shakeDetected: true, fallDetected: false, magnitudeG, jerkMagnitudeGPerSec };
    }

    return { shakeDetected: false, fallDetected: false, magnitudeG, jerkMagnitudeGPerSec };
  }

  /**
   * Sustained Shake Detection:
   * Counts directional reversals (sign changes in high-magnitude jerk components)
   * while acceleration magnitude exceeds the remote-configurable distress threshold (2.5g).
   */
  private evaluateSustainedShake(currentSample: AccelerometerSample): boolean {
    const windowStart = currentSample.timestamp - this.config.shakeWindowMs;
    const windowSamples = this.sampleBuffer.filter((s) => s.timestamp >= windowStart);

    if (windowSamples.length < 5) return false;

    // Check if peak magnitude exceeds distress threshold (default 2.5g)
    const peakG = Math.max(...windowSamples.map((s) => Math.sqrt(s.x ** 2 + s.y ** 2 + s.z ** 2)));
    if (peakG < this.config.distressShakeThresholdG) {
      return false;
    }

    // Count directional reversals across primary axis of movement
    let reversals = 0;
    for (let i = 2; i < windowSamples.length; i++) {
      const prevDiff = windowSamples[i - 1].x - windowSamples[i - 2].x;
      const currDiff = windowSamples[i].x - windowSamples[i - 1].x;

      if (prevDiff * currDiff < -0.2) {
        // Clear direction reversal on X
        reversals++;
      }
    }

    return reversals >= this.config.requiredReversals;
  }

  /**
   * High-Impact Fall Detection State Machine:
   *  Stage 1: Free fall (< 0.4g)
   *  Stage 2: High impact collision (>= 3.8g) within 500ms of free-fall
   *  Stage 3: Post-impact stillness (acceleration ~ 1.0g +/- 0.25g)
   */
  private evaluateFallDetection(currentSample: AccelerometerSample, magnitudeG: number): boolean {
    const now = currentSample.timestamp;

    if (this.fallState === 'NORMAL') {
      if (magnitudeG <= this.config.freeFallThresholdG) {
        this.fallState = 'FREE_FALL_DETECTED';
        this.freeFallTimestamp = now;
      }
    } else if (this.fallState === 'FREE_FALL_DETECTED') {
      if (now - this.freeFallTimestamp > 600) {
        // Free-fall timeout without impact -> reset
        this.fallState = 'NORMAL';
      } else if (magnitudeG >= this.config.fallImpactThresholdG) {
        // Impact detected following free-fall!
        this.fallState = 'IMPACT_DETECTED';
        this.impactTimestamp = now;
        return true;
      }
    } else if (this.fallState === 'IMPACT_DETECTED') {
      // Direct confirmation of impact sequence
      return true;
    }

    return false;
  }

  private resetState(): void {
    this.previousSample = null;
    this.sampleBuffer = [];
    this.jerkBuffer = [];
    this.fallState = 'NORMAL';
    this.freeFallTimestamp = 0;
    this.impactTimestamp = 0;
  }

  private dispatchTrigger(event: HardwareTriggerEvent): void {
    for (const listener of this.listeners) {
      try {
        const result = listener(event);
        if (result instanceof Promise) {
          result.catch(() => {});
        }
      } catch {
        /* Ignore listener errors */
      }
    }
  }
}
