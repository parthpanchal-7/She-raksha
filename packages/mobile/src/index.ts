/**
 * @she-raksha/mobile — Public API
 *
 * Mobile Edge Hardware Triggers, TFLite Voice Classifier,
 * Multi-Rail Failover Engine (WSS -> Base91 SMS -> BLE 5.2 Mesh)
 * and SQLCipher Offline Synchronization Queue.
 */

export const MOBILE_VERSION = '1.0.0';
export const DEFAULT_SHAKE_THRESHOLD_G = 2.5;
export const FALL_DETECTION_THRESHOLD_G = 3.8;
export const RAIL_A_TIMEOUT_MS = 5000;

// 1. Shared Types
export * from './types.js';

// 2. Hardware, IMU & Audio Triggers (FR-SOS-001)
export * from './triggers/index.js';

// 3. Multi-Rail Failover & BLE 5.2 Mesh (FR-SOS-002, NFR-REL-002)
export * from './failover/index.js';

// 4. SQLCipher Offline Queue & SOSLog.sol Sync (FR-SOS-005)
export * from './queue/index.js';

// 5. 5-Second Evidence Vault & In-RAM Zero-Plaintext Pipeline (FR-EV-001, FR-EV-002, NFR-SEC-002)
export * from './vault/index.js';

// 6. Zero-Knowledge Bystander Groth16 Prover (Circom 2.1, NFR-PERF-003)
export * from './prover/index.js';

// 7. UI Components, Haptics & Brand Screens (FR-SOS-001..004, BNSS §173, BSA §63)
export * from './ui/index.js';
export * from './screens/index.js';
