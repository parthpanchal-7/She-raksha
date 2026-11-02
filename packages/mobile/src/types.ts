/**
 * @she-raksha/mobile — Type Definitions
 *
 * Core interfaces for Mobile Edge Hardware Triggers, TFLite Audio Classifier,
 * Multi-Rail Failover Engine (WSS -> Base91 SMS -> BLE 5.2 Mesh),
 * and SQLCipher Offline Synchronization Queue.
 */

import { TriggerMode, DispatchRail, DispatchStatus, OfflinePayloadType, OfflineQueueStatus } from '@she-raksha/schemas';

// ============================================================================
// 1. Hardware & Platform Trigger Types
// ============================================================================

export type TriggerSource =
  | 'POWER_BUTTON'
  | 'VOLUME_BUTTON_FALLBACK'
  | 'STEALTH_ON_SCREEN_GESTURE'
  | 'ACCELEROMETER_SHAKE'
  | 'ACCELEROMETER_FALL'
  | 'TFLITE_AUDIO'
  | 'MANUAL_UI';

export interface HardwareTriggerEvent {
  triggerMode: TriggerMode;
  source: TriggerSource;
  timestamp: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface PlatformCapabilities {
  os: 'android' | 'ios' | 'headless';
  canInterceptPowerButton: boolean;
  canRunBackgroundMic: boolean;
  canSendDirectSMS: boolean;
  canAdvertiseBLEBackground: boolean;
  isForegroundServiceActive: boolean;
  isBatteryOptimizationExempt: boolean;
}

export interface ForegroundServiceConfig {
  serviceId: number;
  notificationTitle: string;
  notificationText: string;
  channelId: string;
  types: Array<'location' | 'microphone' | 'connectedDevice'>;
}

// ============================================================================
// 2. IMU Accelerometer Types (>= 50Hz)
// ============================================================================

export interface AccelerometerSample {
  x: number; // in g (1g = 9.80665 m/s^2)
  y: number;
  z: number;
  timestamp: number; // in ms
}

export interface JerkVector {
  jx: number;
  jy: number;
  jz: number;
  magnitude: number;
  timestamp: number;
}

export interface IMUConfig {
  /** Sampling frequency in Hz (must be >= 50Hz) */
  samplingRateHz: number;
  /** Distress shake threshold in g (defaults to 2.5g) */
  distressShakeThresholdG: number;
  /** High-impact fall detection threshold in g (defaults to 3.8g) */
  fallImpactThresholdG: number;
  /** Free-fall threshold in g (defaults to 0.4g) */
  freeFallThresholdG: number;
  /** Window for sustained shake detection in ms (e.g. 1200ms) */
  shakeWindowMs: number;
  /** Number of directional reversals required for sustained shake */
  requiredReversals: number;
  /** Post-fall stillness observation window in ms (e.g. 2000ms) */
  fallStillnessWindowMs: number;
}

// ============================================================================
// 3. TFLite Audio Classifier Types
// ============================================================================

export enum DistressAcousticClass {
  AMBIENT_NORMAL = 'AMBIENT_NORMAL',
  SCREAM_HIGH_PITCH = 'SCREAM_HIGH_PITCH',
  DURESS_WAKE_WORD = 'DURESS_WAKE_WORD',
  DISTRESS_SOBBING = 'DISTRESS_SOBBING',
}

export interface AudioClassificationResult {
  predictedClass: DistressAcousticClass;
  confidence: number;
  probabilities: Record<DistressAcousticClass, number>;
  inferenceLatencyMs: number;
  isDuressDetected: boolean;
  timestamp: number;
}

export interface AudioClassifierConfig {
  sampleRateHz: number; // 16,000 Hz
  frameSizeSamples: number; // 16,000 (1 second)
  confidenceThreshold: number; // 0.85
  numMelBins: number; // 40
  minFrequencyHz: number; // 300
  maxFrequencyHz: number; // 8,000
}

// ============================================================================
// 4. Dynamic Network Evaluator & Multi-Rail Failover Types
// ============================================================================

export type NetworkInterfaceType = 'WIFI' | 'CELLULAR_5G' | 'CELLULAR_4G' | 'CELLULAR_3G' | 'CELLULAR_2G' | 'NONE';

export interface NetworkEvaluationResult {
  isOnline: boolean;
  activeInterface: NetworkInterfaceType;
  rttMs: number;
  cellularSignalBars: number; // 0 to 4
  isFastPathAvailable: boolean; // RTT <= 150ms
  evaluatedAt: number;
}

export interface NetworkEvaluatorConfig {
  gatewayProbeUrl?: string;
  evaluationTimeoutMs: number; // 150ms hard limit
}

export interface CryptographicServerAck {
  ackToken: string;
  serverTimestamp: number;
  signature: string;
  responderNodeId: string;
}

export interface RailDispatchResult {
  rail: DispatchRail;
  status: DispatchStatus;
  latencyMs: number;
  payloadSize: number;
  serverAck?: CryptographicServerAck;
  smsMessageText?: string;
  recipients?: string[];
  error?: string;
}

export interface MultiRailFailoverResult {
  incidentId: string;
  primaryRailAttempted: DispatchRail;
  finalSuccessfulRail: DispatchRail | 'NONE';
  railHistory: RailDispatchResult[];
  failoverTriggered: boolean;
  totalDurationMs: number;
  bleMeshBroadcastInitiated: boolean;
}

export interface FailoverEngineConfig {
  railATimeoutMs: number; // 5,000 ms hardware timer
  networkEvalTimeoutMs: number; // 150 ms
  maxSmsRecipients: number; // 5 emergency contacts + 1 ERSS-112
  erss112GatewayNumber: string;
  enableSimultaneousBleMesh: boolean;
}

// ============================================================================
// 5. BLE 5.2 Extended Advertising Mesh Types
// ============================================================================

export enum BLEMeshFrameType {
  DISTRESS_BEACON = 0x01,
  PEER_RELAY_ACK = 0x02,
  MESH_HEARTBEAT = 0x03,
}

export interface BLEMeshPacket {
  serviceUuid: string; // '0xFD63'
  protocolVersion: number; // 1
  frameType: BLEMeshFrameType;
  hopLimit: number; // TTL (e.g. 3)
  nodeId: string; // 8-byte hex device identifier
  incidentDigest: string; // 16-byte hex truncated session hash
  geohash6: string; // 6-character geohash (e.g. 'ttnf7z')
  timestampSeconds: number;
  batteryPct: number;
  triggerCode: number;
  rawPayloadHex: string;
}

export interface BLEMeshConfig {
  serviceUuid: string;
  defaultTtl: number;
  broadcastIntervalMs: number;
  txPowerDbm: number;
  maxSeenCacheSize: number;
}

// ============================================================================
// 6. SQLCipher Offline Sync Queue Types
// ============================================================================

export interface OfflineQueueRecord {
  queueId?: number;
  payloadBlob: Uint8Array;
  payloadType: OfflinePayloadType;
  incidentId?: string;
  status: OfflineQueueStatus;
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  deliveredAt?: string;
  lastError?: string;
  priority: number; // 1 (Highest / SOS) to 5 (Lowest)
  payloadBytes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SQLCipherQueueConfig {
  encryptionKeyHex: string; // 64-char hex key from enclave
  dbPath?: string;
  maxRetries?: number;
  baseBackoffSeconds?: number;
  maxBackoffSeconds?: number;
}

export interface QueueDrainResult {
  processedCount: number;
  deliveredCount: number;
  retriedCount: number;
  deadLetterCount: number;
  errors: Array<{ queueId: number; error: string }>;
}
