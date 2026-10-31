/**
 * @she-raksha/schemas — Canonical Shared Enums
 *
 * Single source of truth for all enumerations shared across
 * schemas, mobile, web, and backend packages.
 *
 * SKILL.MD Rule: Share one unified TriggerMode enum across the entire monorepo.
 */

// ---------------------------------------------------------------------------
// TriggerMode — Unified SOS Activation Mode Enum (FR-SOS-001)
// ---------------------------------------------------------------------------
export enum TriggerMode {
  /** 4 rapid presses of the hardware power/side button */
  HARDWARE_TAP_FOUR_PRESS = 'HARDWARE_TAP_FOUR_PRESS',
  /** 2.5g sustained accelerometer shake (DFD 3.1 default); 3.8g for fall profile */
  SHAKE_ACCELEROMETER = 'SHAKE_ACCELEROMETER',
  /** Edge on-device TFLite scream/duress audio classifier */
  VOICE_DURESS_TFLITE = 'VOICE_DURESS_TFLITE',
  /** High-impact fall detection (3.8g IMU jerk profile) */
  FALL_DETECTION = 'FALL_DETECTION',
  /** Periodic check-in expiry — no heartbeat received within window */
  DEAD_MAN_SWITCH = 'DEAD_MAN_SWITCH',
  /** User-initiated tap of the on-screen SOS button */
  MANUAL_BUTTON = 'MANUAL_BUTTON',
}

/** Zod-compatible array of all TriggerMode values for runtime validation */
export const TRIGGER_MODE_VALUES = [
  TriggerMode.HARDWARE_TAP_FOUR_PRESS,
  TriggerMode.SHAKE_ACCELEROMETER,
  TriggerMode.VOICE_DURESS_TFLITE,
  TriggerMode.FALL_DETECTION,
  TriggerMode.DEAD_MAN_SWITCH,
  TriggerMode.MANUAL_BUTTON,
] as const;

export type TriggerModeValue = (typeof TRIGGER_MODE_VALUES)[number];

// ---------------------------------------------------------------------------
// SOSStatus — Incident lifecycle state machine
// ---------------------------------------------------------------------------
export enum SOSStatus {
  INITIATED = 'INITIATED',
  DISPATCHING = 'DISPATCHING',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
  ESCALATED = 'ESCALATED',
}

export const SOS_STATUS_VALUES = [
  SOSStatus.INITIATED,
  SOSStatus.DISPATCHING,
  SOSStatus.ACKNOWLEDGED,
  SOSStatus.RESOLVED,
  SOSStatus.CANCELLED,
  SOSStatus.ESCALATED,
] as const;

// ---------------------------------------------------------------------------
// DispatchRail — Multi-rail SOS dispatch channel (FR-SOS-001 to FR-SOS-005)
// ---------------------------------------------------------------------------
export enum DispatchRail {
  /** Rail A: Bi-directional TLS 1.3 WebSocket stream + FCM/APNs push */
  RAIL_A_WSS = 'RAIL_A_WSS',
  /** Rail B: Base91-compressed GSM-7 SMS via Twilio/SMPP (<140 bytes, <160 chars) */
  RAIL_B_SMS = 'RAIL_B_SMS',
  /** Rail C: BLE 5.2 Extended Advertising mesh relay (50-100m) */
  RAIL_C_BLE = 'RAIL_C_BLE',
}

export const DISPATCH_RAIL_VALUES = [
  DispatchRail.RAIL_A_WSS,
  DispatchRail.RAIL_B_SMS,
  DispatchRail.RAIL_C_BLE,
] as const;

// ---------------------------------------------------------------------------
// DispatchStatus — Per-rail delivery acknowledgement
// ---------------------------------------------------------------------------
export enum DispatchStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
}

export const DISPATCH_STATUS_VALUES = [
  DispatchStatus.PENDING,
  DispatchStatus.SENT,
  DispatchStatus.DELIVERED,
  DispatchStatus.FAILED,
  DispatchStatus.TIMEOUT,
] as const;

// ---------------------------------------------------------------------------
// MediaType — Evidence capture types (NFR-SEC-001)
// ---------------------------------------------------------------------------
export enum MediaType {
  /** AAC 128kbps audio */
  AUDIO_AAC = 'AUDIO_AAC',
  /** H.265 1080p 30fps video */
  VIDEO_H265 = 'VIDEO_H265',
  /** GPS NMEA + altitude + HDOP + cell tower telemetry */
  SENSOR_TELEMETRY = 'SENSOR_TELEMETRY',
}

export const MEDIA_TYPE_VALUES = [
  MediaType.AUDIO_AAC,
  MediaType.VIDEO_H265,
  MediaType.SENSOR_TELEMETRY,
] as const;

// ---------------------------------------------------------------------------
// EFIRStatus — eFIR lifecycle under BNSS §173
// ---------------------------------------------------------------------------
export enum EFIRStatus {
  /** Initial registration; 72-hr signing window open */
  PENDING_SIGN = 'PENDING_SIGN',
  /** Signed by survivor within 72 hrs (BNSS §173 compliant) */
  SIGNED = 'SIGNED',
  /** Acknowledged by Police SHO/SP */
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  /** 72-hr window expired without sign — §173(4) escalation triggered */
  DEADLINE_BREACHED = 'DEADLINE_BREACHED',
  /** SP + NGO dossier dispatched (§173(4) escalation complete) */
  ESCALATED_SP = 'ESCALATED_SP',
}

export const EFIR_STATUS_VALUES = [
  EFIRStatus.PENDING_SIGN,
  EFIRStatus.SIGNED,
  EFIRStatus.ACKNOWLEDGED,
  EFIRStatus.DEADLINE_BREACHED,
  EFIRStatus.ESCALATED_SP,
] as const;

// ---------------------------------------------------------------------------
// BNSSection — Indian Bharatiya Nyaya Sanhita statutory classifications
// ---------------------------------------------------------------------------
export enum BNSSection {
  /** §74 — Assault on woman with intent to outrage modesty */
  SECTION_74 = 'BNS_74',
  /** §75 — Sexual harassment */
  SECTION_75 = 'BNS_75',
  /** §78 — Stalking */
  SECTION_78 = 'BNS_78',
  /** §351(2) — Criminal intimidation */
  SECTION_351_2 = 'BNS_351_2',
}

export const BNS_SECTION_VALUES = [
  BNSSection.SECTION_74,
  BNSSection.SECTION_75,
  BNSSection.SECTION_78,
  BNSSection.SECTION_351_2,
] as const;

// ---------------------------------------------------------------------------
// OfflineQueueStatus — SQLCipher offline_queue state
// ---------------------------------------------------------------------------
export enum OfflineQueueStatus {
  QUEUED = 'QUEUED',
  RETRYING = 'RETRYING',
  DELIVERED = 'DELIVERED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export const OFFLINE_QUEUE_STATUS_VALUES = [
  OfflineQueueStatus.QUEUED,
  OfflineQueueStatus.RETRYING,
  OfflineQueueStatus.DELIVERED,
  OfflineQueueStatus.DEAD_LETTER,
] as const;

// ---------------------------------------------------------------------------
// OfflinePayloadType — Types of payloads stored in offline_queue
// ---------------------------------------------------------------------------
export enum OfflinePayloadType {
  SOS_ALERT = 'SOS_ALERT',
  EVIDENCE_CHUNK = 'EVIDENCE_CHUNK',
  EFIR_SUBMISSION = 'EFIR_SUBMISSION',
  ZK_PROOF = 'ZK_PROOF',
  GUARDIAN_UPDATE = 'GUARDIAN_UPDATE',
}

export const OFFLINE_PAYLOAD_TYPE_VALUES = [
  OfflinePayloadType.SOS_ALERT,
  OfflinePayloadType.EVIDENCE_CHUNK,
  OfflinePayloadType.EFIR_SUBMISSION,
  OfflinePayloadType.ZK_PROOF,
  OfflinePayloadType.GUARDIAN_UPDATE,
] as const;

// ---------------------------------------------------------------------------
// Shake-threshold constants (SKILL.MD canonical rule)
// ---------------------------------------------------------------------------
export const SHAKE_THRESHOLD_DISTRESS_G = 2.5 as const;
export const SHAKE_THRESHOLD_FALL_G = 3.8 as const;

// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------
/** BNSS §173 statutory deadline in seconds (72 hours) */
export const BNSS_173_DEADLINE_SECONDS = 259_200 as const;
/** Optional NGO early-warning webhook trigger in seconds (48 hours) */
export const NGO_EARLY_WARNING_SECONDS = 172_800 as const;
/** Rail A WebSocket ACK timeout before Rail B SMS fallback */
export const RAIL_A_ACK_TIMEOUT_MS = 5_000 as const;
/** Guardian active dispatch radius default ceiling in meters */
export const GUARDIAN_DEFAULT_RADIUS_METERS = 2_000 as const;
/** Guardian active proximity radius for matching in meters */
export const GUARDIAN_DISPATCH_RADIUS_METERS = 800 as const;
/** Maximum SMS payload in bytes (Rail B GSM-7 Base91) */
export const SMS_MAX_BYTES = 140 as const;
/** Evidence chunk duration in seconds */
export const EVIDENCE_CHUNK_SECONDS = 5 as const;

