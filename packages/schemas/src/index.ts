/**
 * @she-raksha/schemas — Public API
 *
 * Canonical DFD Data Contracts, Unified Enums & Multi-Tier Database Schemas
 * for the She-Raksha decentralized women's safety platform.
 *
 * Exports:
 *   - Shared enums (TriggerMode, SOSStatus, EFIRStatus, etc.)
 *   - Zod validators for all 6 DFD data contracts
 *   - Inferred TypeScript types for all 6 contracts
 *   - JSON Schema (Draft 2020-12) definitions for all 6 contracts
 *   - Schema registries for programmatic validation routing
 *   - SQLCipher DDL string + pragma builder for on-device DB
 *   - Canonical constants (BNSS_173_DEADLINE_SECONDS, etc.)
 */

// ---------------------------------------------------------------------------
// Shared Enums & Constants
// ---------------------------------------------------------------------------
export {
  TriggerMode,
  TRIGGER_MODE_VALUES,
  type TriggerModeValue,
  SOSStatus,
  SOS_STATUS_VALUES,
  DispatchRail,
  DISPATCH_RAIL_VALUES,
  DispatchStatus,
  DISPATCH_STATUS_VALUES,
  MediaType,
  MEDIA_TYPE_VALUES,
  EFIRStatus,
  EFIR_STATUS_VALUES,
  BNSSection,
  BNS_SECTION_VALUES,
  OfflineQueueStatus,
  OFFLINE_QUEUE_STATUS_VALUES,
  OfflinePayloadType,
  OFFLINE_PAYLOAD_TYPE_VALUES,
  // Canonical constants (SKILL.MD single source of truth)
  BNSS_173_DEADLINE_SECONDS,
  NGO_EARLY_WARNING_SECONDS,
  RAIL_A_ACK_TIMEOUT_MS,
  GUARDIAN_DEFAULT_RADIUS_METERS,
  GUARDIAN_DISPATCH_RADIUS_METERS,
  SMS_MAX_BYTES,
  EVIDENCE_CHUNK_SECONDS,
  SHAKE_THRESHOLD_DISTRESS_G,
  SHAKE_THRESHOLD_FALL_G,
} from './enums.js';

// ---------------------------------------------------------------------------
// Zod Validators & TypeScript Types (6 DFD Data Contracts)
// ---------------------------------------------------------------------------
export {
  // 1. IncidentCapturePayload
  IncidentCapturePayloadSchema,
  type IncidentCapturePayload,
  // 2. EncryptedEvidenceRecord
  EncryptedEvidenceRecordSchema,
  type EncryptedEvidenceRecord,
  // 3. SOSAlertPacket
  SOSAlertPacketSchema,
  type SOSAlertPacket,
  // 4. ZKProofSubmission
  ZKProofSubmissionSchema,
  type ZKProofSubmission,
  // 5. eFIRRecord
  EFIRRecordSchema,
  type EFIRRecord,
  // 6. BSA63CertificatePack
  BSA63CertificatePackSchema,
  type BSA63CertificatePack,
  // Schema registry
  SCHEMA_REGISTRY,
  type SchemaName,
} from './validators.js';

// ---------------------------------------------------------------------------
// JSON Schema (Draft 2020-12) Definitions
// ---------------------------------------------------------------------------
export {
  IncidentCapturePayloadJSONSchema,
  EncryptedEvidenceRecordJSONSchema,
  SOSAlertPacketJSONSchema,
  ZKProofSubmissionJSONSchema,
  EFIRRecordJSONSchema,
  BSA63CertificatePackJSONSchema,
  JSON_SCHEMA_REGISTRY,
} from './json-schemas.js';

// ---------------------------------------------------------------------------
// On-Device SQLCipher DDL & Pragma Builder
// ---------------------------------------------------------------------------
export {
  SQLCIPHER_DDL,
  buildSQLCipherPragmas,
  SQLCIPHER_HKDF_INFO,
  TABLE_LOCAL_CAPTURES,
  TABLE_OFFLINE_QUEUE,
} from './sqlcipher/index.js';

// ---------------------------------------------------------------------------
// Package version
// ---------------------------------------------------------------------------
export const SCHEMAS_VERSION = '1.0.0';
