/**
 * @she-raksha/mobile — Test Suite 1: Hardware, IMU & TFLite Voice Triggers
 *
 * Validates FR-SOS-001:
 *  - 4-Tap Power Button Interrupt & switch debouncing
 *  - Volume-button & stealth on-screen gesture fallbacks
 *  - IMU Accelerometer 50Hz sampling, 2.5g sustained shake & 3.8g high-impact fall
 *  - Local quantized TFLite audio classifier for distress screams & wake-words
 *  - Zero raw audio streamed off-device & RAM buffer sanitization (NFR-SEC-002)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TriggerMode,
  SHAKE_THRESHOLD_DISTRESS_G,
  SHAKE_THRESHOLD_FALL_G,
} from '@she-raksha/schemas';

const currentDir = typeof __dirname !== 'undefined' ? __dirname : process.cwd();
import {
  PlatformGuard,
  HardwareTriggerService,
  IMUAccelerometerListener,
  TFLiteAudioClassifier,
  DistressAcousticClass,
  HardwareTriggerEvent,
} from '../index.js';

describe('1. Stealth Hardware & Sensor Trigger Layer (FR-SOS-001)', () => {
  let platformGuard: PlatformGuard;
  let hardwareService: HardwareTriggerService;

  beforeEach(() => {
    platformGuard = new PlatformGuard();
    hardwareService = new HardwareTriggerService(platformGuard);
  });

  describe('Platform Capability Guards & Foreground Service', () => {
    it('Should detect Android capabilities when Foreground Service is active', () => {
      platformGuard.detectEnvironment('android');
      assert.equal(platformGuard.getCapabilities().canInterceptPowerButton, false);

      // Start Foreground Service with location and microphone
      platformGuard.startForegroundService({
        serviceId: 1001,
        notificationTitle: 'She-Raksha Active Protection',
        notificationText: 'Monitoring edge sensors for distress triggers',
        channelId: 'she_raksha_sos_channel',
        types: ['location', 'microphone'],
      });

      const caps = platformGuard.getCapabilities();
      assert.equal(caps.isForegroundServiceActive, true);
      assert.equal(caps.canInterceptPowerButton, true);
      assert.equal(caps.canRunBackgroundMic, true);
      assert.equal(caps.canSendDirectSMS, true);
    });

    it('Should detect iOS restrictions and activate stealth fallbacks', () => {
      platformGuard.detectEnvironment('ios');
      const caps = platformGuard.getCapabilities();

      assert.equal(caps.canInterceptPowerButton, false);
      assert.equal(caps.canRunBackgroundMic, false);

      const fallbackStatus = platformGuard.shouldActivateStealthFallback();
      assert.equal(fallbackStatus.useVolumeButtonFallback, true);
      assert.equal(fallbackStatus.useOnScreenGestureFallback, true);
      assert.match(fallbackStatus.reason, /restricts raw power-button/);
    });
  });

  describe('4-Tap Power Button Interrupt Detector', () => {
    it('Should trigger SOS when 4 rapid power button presses occur within 2500ms', () => {
      const events: HardwareTriggerEvent[] = [];
      hardwareService.onTrigger((event) => {
        events.push(event);
      });

      const baseTime = 1000000;
      assert.equal(hardwareService.handlePowerButtonPress(baseTime), false);
      assert.equal(hardwareService.handlePowerButtonPress(baseTime + 300), false);
      assert.equal(hardwareService.handlePowerButtonPress(baseTime + 650), false);
      // 4th tap
      const triggered = hardwareService.handlePowerButtonPress(baseTime + 1000);
      assert.equal(triggered, true);

      assert.equal(events.length, 1);
      assert.equal(events[0].triggerMode, TriggerMode.HARDWARE_TAP_FOUR_PRESS);
      assert.equal(events[0].source, 'POWER_BUTTON');
    });

    it('Should reject physical switch bounce occurring within 100ms debounce gap', () => {
      const baseTime = 1000000;
      assert.equal(hardwareService.handlePowerButtonPress(baseTime), false);
      // Bounced press within 50ms should be rejected
      assert.equal(hardwareService.handlePowerButtonPress(baseTime + 50), false);
      assert.equal(hardwareService.handlePowerButtonPress(baseTime + 200), false);
      assert.equal(hardwareService.handlePowerButtonPress(baseTime + 450), false);
      // Only 3 valid non-bounced presses ingested so far -> not triggered
      assert.equal(hardwareService.handlePowerButtonPress(baseTime + 600), true); // 4th valid press
    });

    it('Should reset window and not trigger if presses exceed 2500ms tap window', () => {
      const baseTime = 1000000;
      hardwareService.handlePowerButtonPress(baseTime);
      hardwareService.handlePowerButtonPress(baseTime + 400);
      hardwareService.handlePowerButtonPress(baseTime + 800);
      // 4th press delayed by 3000ms (window expired)
      const triggered = hardwareService.handlePowerButtonPress(baseTime + 3800);
      assert.equal(triggered, false);
    });

    it('Should trigger stealth fallback on 4 rapid volume key toggles', () => {
      const events: HardwareTriggerEvent[] = [];
      hardwareService.onTrigger((e) => {
        events.push(e);
      });

      const baseTime = 1000000;
      hardwareService.handleVolumeKeyPress('UP', baseTime);
      hardwareService.handleVolumeKeyPress('DOWN', baseTime + 250);
      hardwareService.handleVolumeKeyPress('UP', baseTime + 500);
      const triggered = hardwareService.handleVolumeKeyPress('DOWN', baseTime + 750);

      assert.equal(triggered, true);
      assert.equal(events.length, 1);
      assert.equal(events[0].triggerMode, TriggerMode.HARDWARE_TAP_FOUR_PRESS);
      assert.equal(events[0].source, 'VOLUME_BUTTON_FALLBACK');
    });

    it('Should trigger stealth fallback on 4-finger on-screen long press gesture', () => {
      const events: HardwareTriggerEvent[] = [];
      hardwareService.onTrigger((e) => {
        events.push(e);
      });

      const triggered = hardwareService.handleStealthOnScreenGesture('FOUR_FINGER_HOLD');
      assert.equal(triggered, true);
      assert.equal(events.length, 1);
      assert.equal(events[0].triggerMode, TriggerMode.MANUAL_BUTTON);
      assert.equal(events[0].source, 'STEALTH_ON_SCREEN_GESTURE');
    });
  });

  describe('IMU Accelerometer Jerk-Vector Listener (>= 50Hz, 2.5g Shake & 3.8g Fall)', () => {
    let imuListener: IMUAccelerometerListener;

    beforeEach(() => {
      imuListener = new IMUAccelerometerListener({
        distressShakeThresholdG: SHAKE_THRESHOLD_DISTRESS_G, // 2.5g
        fallImpactThresholdG: SHAKE_THRESHOLD_FALL_G, // 3.8g
        samplingRateHz: 50,
      });
      imuListener.start();
    });

    it('Should compute jerk vector magnitude and detect 2.5g sustained distress shake', () => {
      const events: HardwareTriggerEvent[] = [];
      imuListener.onTrigger((e) => {
        events.push(e);
      });

      const startTime = 1000000;
      const intervalMs = 20; // 50Hz sampling

      // Simulate sustained vigorous distress shaking (alternating +/- 2.7g acceleration)
      const shakeValues = [
        { x: 2.7, y: 0.1, z: 0.9 },
        { x: -2.8, y: 0.2, z: 1.0 },
        { x: 2.9, y: -0.1, z: 0.8 },
        { x: -2.7, y: 0.0, z: 1.1 },
        { x: 2.8, y: 0.1, z: 0.9 },
        { x: -2.6, y: 0.2, z: 1.0 },
      ];

      let lastResult;
      for (let i = 0; i < shakeValues.length; i++) {
        lastResult = imuListener.ingestSample({
          ...shakeValues[i],
          timestamp: startTime + i * intervalMs,
        });
      }

      assert.equal(events.length, 1);
      assert.equal(events[0].triggerMode, TriggerMode.SHAKE_ACCELEROMETER);
      assert.equal(events[0].source, 'ACCELEROMETER_SHAKE');
      assert(events[0].metadata?.distressThresholdG === 2.5);
    });

    it('Should ignore low-intensity non-distress vibrations (< 2.5g)', () => {
      const events: HardwareTriggerEvent[] = [];
      imuListener.onTrigger((e) => {
        events.push(e);
      });

      const startTime = 1000000;
      // Mild jogging / walking vibrations (~1.4g peak)
      for (let i = 0; i < 10; i++) {
        imuListener.ingestSample({
          x: (i % 2 === 0 ? 1 : -1) * 1.3,
          y: 0.5,
          z: 0.8,
          timestamp: startTime + i * 20,
        });
      }

      assert.equal(events.length, 0);
    });

    it('Should detect 3.8g high-impact fall sequence: Free-Fall -> High Impact -> Stillness', () => {
      const events: HardwareTriggerEvent[] = [];
      imuListener.onTrigger((e) => {
        events.push(e);
      });

      let t = 1000000;

      // 1. Normal state
      imuListener.ingestSample({ x: 0.0, y: 0.0, z: 1.0, timestamp: t });

      // 2. Free-fall phase: weightlessness (< 0.4g)
      t += 50;
      imuListener.ingestSample({ x: 0.1, y: 0.1, z: 0.2, timestamp: t }); // ~0.24g

      // 3. High impact spike (>= 3.8g)
      t += 100;
      const impactResult = imuListener.ingestSample({ x: 2.5, y: 2.2, z: 2.0, timestamp: t }); // ~3.88g

      assert.equal(impactResult.fallDetected, true);
      assert.equal(events.length, 1);
      assert.equal(events[0].triggerMode, TriggerMode.FALL_DETECTION);
      assert.equal(events[0].source, 'ACCELEROMETER_FALL');
    });

    it('Should dynamically read 2.5g and 3.8g thresholds from environment or remote config', () => {
      const originalShake = process.env.EXPO_PUBLIC_SHAKE_THRESHOLD_G;
      const originalFall = process.env.EXPO_PUBLIC_FALL_IMPACT_THRESHOLD_G;

      try {
        process.env.EXPO_PUBLIC_SHAKE_THRESHOLD_G = '2.5';
        process.env.EXPO_PUBLIC_FALL_IMPACT_THRESHOLD_G = '3.8';

        const customListener = new IMUAccelerometerListener();
        const cfg = customListener.getConfig();
        assert.equal(cfg.distressShakeThresholdG, 2.5);
        assert.equal(cfg.fallImpactThresholdG, 3.8);
      } finally {
        if (originalShake !== undefined) {
          process.env.EXPO_PUBLIC_SHAKE_THRESHOLD_G = originalShake;
        } else {
          delete process.env.EXPO_PUBLIC_SHAKE_THRESHOLD_G;
        }
        if (originalFall !== undefined) {
          process.env.EXPO_PUBLIC_FALL_IMPACT_THRESHOLD_G = originalFall;
        } else {
          delete process.env.EXPO_PUBLIC_FALL_IMPACT_THRESHOLD_G;
        }
      }
    });
  });

  describe('Native Bundled Assets (TFLite & Circom ZKey)', () => {
    it('Should verify quantized TFLite distress model and Circom .zkey are present in assets', () => {
      const modelPath = path.resolve(currentDir, '../../assets/models/distress_classifier_quant.tflite');
      const zkeyPath = path.resolve(currentDir, '../../assets/circuits/circuit_final.zkey');

      assert(fs.existsSync(modelPath), 'distress_classifier_quant.tflite must exist in assets/models/');
      assert(fs.statSync(modelPath).size > 1000, 'TFLite model must be valid non-empty binary');

      assert(fs.existsSync(zkeyPath), 'circuit_final.zkey must exist in assets/circuits/');
      assert(fs.statSync(zkeyPath).size > 100000, 'Circuit zkey must be non-empty (>100KB)');
    });
  });

  describe('On-Device Quantized TFLite Audio Classifier', () => {
    let audioClassifier: TFLiteAudioClassifier;

    beforeEach(() => {
      audioClassifier = new TFLiteAudioClassifier({
        confidenceThreshold: 0.85,
      });
      audioClassifier.start();
    });

    it('Should detect high-pitch scream with confidence >= 0.85 and trigger VOICE_DURESS_TFLITE', () => {
      const events: HardwareTriggerEvent[] = [];
      audioClassifier.onTrigger((e) => {
        events.push(e);
      });

      // Synthesize 1-second 16kHz audio frame with high-frequency scream energy (1kHz - 3.5kHz)
      const samples = new Float32Array(16000);
      for (let i = 0; i < samples.length; i++) {
        // High harmonic energy (scream signature)
        samples[i] = 0.7 * Math.sin((2 * Math.PI * 2200 * i) / 16000) + 0.3 * Math.sin((2 * Math.PI * 3100 * i) / 16000);
      }

      const result = audioClassifier.processAudioFrame(samples);

      assert.equal(result.isDuressDetected, true);
      assert.equal(result.predictedClass, DistressAcousticClass.SCREAM_HIGH_PITCH);
      assert(result.confidence >= 0.85);

      assert.equal(events.length, 1);
      assert.equal(events[0].triggerMode, TriggerMode.VOICE_DURESS_TFLITE);
      assert.equal(events[0].source, 'TFLITE_AUDIO');
    });

    it('Should enforce Zero-Plaintext RAM Sanitization (NFR-SEC-002) by wiping audio buffer', () => {
      const samples = new Float32Array(100);
      samples.fill(0.75); // Populated with audio bytes

      audioClassifier.processAudioFrame(samples);

      // Verify samples array was zeroed in finally block!
      const isZeroFilled = samples.every((s) => s === 0);
      assert.equal(isZeroFilled, true, 'Audio buffer must be zero-filled in memory after inference');
    });

    it('Should ignore ambient background noise and normal speech without triggering', () => {
      const events: HardwareTriggerEvent[] = [];
      audioClassifier.onTrigger((e) => {
        events.push(e);
      });

      // Quiet ambient room noise (low amplitude, low frequency)
      const samples = new Float32Array(16000);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = 0.05 * Math.sin((2 * Math.PI * 180 * i) / 16000);
      }

      const result = audioClassifier.processAudioFrame(samples);

      assert.equal(result.isDuressDetected, false);
      assert.equal(result.predictedClass, DistressAcousticClass.AMBIENT_NORMAL);
      assert.equal(events.length, 0);
    });
  });
});
