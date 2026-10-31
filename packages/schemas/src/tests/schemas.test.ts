/**
 * @she-raksha/schemas — Schema Validation Unit Tests
 *
 * Tests all 6 DFD data contracts, shared enums, and canonical constants.
 * Uses Node.js built-in test runner (node:test + node:assert).
 *
 * Run: pnpm --filter @she-raksha/schemas test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  TriggerMode,
  TRIGGER_MODE_VALUES,
  SOSStatus,
  DispatchRail,
  DispatchStatus,
  EFIRStatus,
  BNSSection,
  OfflineQueueStatus,
  OfflinePayloadType,
  BNSS_173_DEADLINE_SECONDS,
  NGO_EARLY_WARNING_SECONDS,
  RAIL_A_ACK_TIMEOUT_MS,
  GUARDIAN_DEFAULT_RADIUS_METERS,
  GUARDIAN_DISPATCH_RADIUS_METERS,
  SMS_MAX_BYTES,
  EVIDENCE_CHUNK_SECONDS,
  SHAKE_THRESHOLD_DISTRESS_G,
  SHAKE_THRESHOLD_FALL_G,
} from '../enums.js';

import {
  IncidentCapturePayloadSchema,
  EncryptedEvidenceRecordSchema,
  SOSAlertPacketSchema,
  ZKProofSubmissionSchema,
  EFIRRecordSchema,
  BSA63CertificatePackSchema,
  SCHEMA_REGISTRY,
} from '../validators.js';

import {
  IncidentCapturePayloadJSONSchema,
  EncryptedEvidenceRecordJSONSchema,
  SOSAlertPacketJSONSchema,
  ZKProofSubmissionJSONSchema,
  EFIRRecordJSONSchema,
  BSA63CertificatePackJSONSchema,
  JSON_SCHEMA_REGISTRY,
} from '../json-schemas.js';

// ---------------------------------------------------------------------------
// Test Fixtures
// ---------------------------------------------------------------------------

const VALID_INCIDENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const VALID_EFIR_ID = '770e8400-e29b-41d4-a716-446655440002';
const VALID_CERT_ID = '880e8400-e29b-41d4-a716-446655440003';
const VALID_SHA256 = 'a'.repeat(64);
const VALID_IPFS_CID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';
const VALID_ETH_ADDR = '0x742d35Cc6634C0532925a3b8D4C2C4e4d79e3f52';
const VALID_TX_HASH = '0x' + 'a'.repeat(64);
const VALID_GEOHASH = 'ttnf7z';
const VALID_IV = 'a'.repeat(24);
const VALID_AUTH_TAG = 'b'.repeat(32);
const VALID_SIG = '0x' + 'c'.repeat(130);
const VALID_BN128 = '0x' + '1'.repeat(64);
const NOW = new Date().toISOString();

// 72 hours from NOW (BNSS §173 statutory deadline)
const DEADLINE_72H = new Date(Date.now() + 259_200_000).toISOString();
// 48 hours from NOW (NGO early warning)
const WARNING_48H = new Date(Date.now() + 172_800_000).toISOString();

// ---------------------------------------------------------------------------
// 1. Enum Tests
// ---------------------------------------------------------------------------

describe('Shared Enums', () => {
  it('TriggerMode has all 6 required values', () => {
    assert.equal(TRIGGER_MODE_VALUES.length, 6);
    assert.ok(TRIGGER_MODE_VALUES.includes(TriggerMode.HARDWARE_TAP_FOUR_PRESS));
    assert.ok(TRIGGER_MODE_VALUES.includes(TriggerMode.SHAKE_ACCELEROMETER));
    assert.ok(TRIGGER_MODE_VALUES.includes(TriggerMode.VOICE_DURESS_TFLITE));
    assert.ok(TRIGGER_MODE_VALUES.includes(TriggerMode.FALL_DETECTION));
    assert.ok(TRIGGER_MODE_VALUES.includes(TriggerMode.DEAD_MAN_SWITCH));
    assert.ok(TRIGGER_MODE_VALUES.includes(TriggerMode.MANUAL_BUTTON));
  });

  it('TriggerMode string values match canonical SKILL.MD spec', () => {
    assert.equal(TriggerMode.HARDWARE_TAP_FOUR_PRESS, 'HARDWARE_TAP_FOUR_PRESS');
    assert.equal(TriggerMode.SHAKE_ACCELEROMETER, 'SHAKE_ACCELEROMETER');
    assert.equal(TriggerMode.VOICE_DURESS_TFLITE, 'VOICE_DURESS_TFLITE');
    assert.equal(TriggerMode.FALL_DETECTION, 'FALL_DETECTION');
    assert.equal(TriggerMode.DEAD_MAN_SWITCH, 'DEAD_MAN_SWITCH');
    assert.equal(TriggerMode.MANUAL_BUTTON, 'MANUAL_BUTTON');
  });

  it('SOSStatus has INITIATED, DISPATCHING, ACKNOWLEDGED, RESOLVED, CANCELLED, ESCALATED', () => {
    assert.equal(SOSStatus.INITIATED, 'INITIATED');
    assert.equal(SOSStatus.DISPATCHING, 'DISPATCHING');
    assert.equal(SOSStatus.ACKNOWLEDGED, 'ACKNOWLEDGED');
    assert.equal(SOSStatus.RESOLVED, 'RESOLVED');
    assert.equal(SOSStatus.CANCELLED, 'CANCELLED');
    assert.equal(SOSStatus.ESCALATED, 'ESCALATED');
  });

  it('DispatchRail covers all 3 SOS rails', () => {
    assert.equal(DispatchRail.RAIL_A_WSS, 'RAIL_A_WSS');
    assert.equal(DispatchRail.RAIL_B_SMS, 'RAIL_B_SMS');
    assert.equal(DispatchRail.RAIL_C_BLE, 'RAIL_C_BLE');
  });

  it('EFIRStatus has all statutory states including DEADLINE_BREACHED and ESCALATED_SP', () => {
    assert.equal(EFIRStatus.PENDING_SIGN, 'PENDING_SIGN');
    assert.equal(EFIRStatus.SIGNED, 'SIGNED');
    assert.equal(EFIRStatus.ACKNOWLEDGED, 'ACKNOWLEDGED');
    assert.equal(EFIRStatus.DEADLINE_BREACHED, 'DEADLINE_BREACHED');
    assert.equal(EFIRStatus.ESCALATED_SP, 'ESCALATED_SP');
  });

  it('BNSSection covers all 4 canonical Indian statutory sections', () => {
    assert.equal(BNSSection.SECTION_74, 'BNS_74');
    assert.equal(BNSSection.SECTION_75, 'BNS_75');
    assert.equal(BNSSection.SECTION_78, 'BNS_78');
    assert.equal(BNSSection.SECTION_351_2, 'BNS_351_2');
  });

  it('OfflineQueueStatus and OfflinePayloadType are defined', () => {
    assert.equal(OfflineQueueStatus.QUEUED, 'QUEUED');
    assert.equal(OfflinePayloadType.SOS_ALERT, 'SOS_ALERT');
  });
});

// ---------------------------------------------------------------------------
// 2. Canonical Constants Tests
// ---------------------------------------------------------------------------

describe('Canonical Constants (SKILL.MD)', () => {
  it('BNSS §173 deadline is exactly 259,200 seconds (72 hours)', () => {
    assert.equal(BNSS_173_DEADLINE_SECONDS, 259_200);
  });

  it('NGO early-warning is 172,800 seconds (48 hours)', () => {
    assert.equal(NGO_EARLY_WARNING_SECONDS, 172_800);
  });

  it('Rail A ACK timeout is 5,000ms', () => {
    assert.equal(RAIL_A_ACK_TIMEOUT_MS, 5_000);
  });

  it('Guardian default radius is 2,000m and dispatch radius is 800m', () => {
    assert.equal(GUARDIAN_DEFAULT_RADIUS_METERS, 2_000);
    assert.equal(GUARDIAN_DISPATCH_RADIUS_METERS, 800);
  });

  it('SMS max bytes is 140 (Rail B GSM-7 compliance)', () => {
    assert.equal(SMS_MAX_BYTES, 140);
  });

  it('Evidence chunk duration is 5 seconds', () => {
    assert.equal(EVIDENCE_CHUNK_SECONDS, 5);
  });

  it('Shake distress threshold is 2.5g and fall threshold is 3.8g', () => {
    assert.equal(SHAKE_THRESHOLD_DISTRESS_G, 2.5);
    assert.equal(SHAKE_THRESHOLD_FALL_G, 3.8);
  });
});

// ---------------------------------------------------------------------------
// 3. IncidentCapturePayload Validator Tests
// ---------------------------------------------------------------------------

describe('IncidentCapturePayload Zod Validator', () => {
  const validPayload = {
    incidentId: VALID_INCIDENT_ID,
    userSmartAccountAddress: VALID_ETH_ADDR,
    triggeredAt: NOW,
    triggerMode: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
    sessionMerkleRoot: VALID_SHA256,
    totalChunks: 12,
    captureWindowSeconds: 60,
    spatialBucket: VALID_GEOHASH,
    sessionKeyId: VALID_USER_ID,
    evidenceChunkCIDs: [VALID_IPFS_CID],
    evidenceMerkleRoot: VALID_SHA256,
    schemaVersion: '1.0.0' as const,
  };

  it('accepts a valid IncidentCapturePayload', () => {
    const result = IncidentCapturePayloadSchema.safeParse(validPayload);
    assert.ok(result.success, `Validation failed: ${JSON.stringify(!result.success ? result.error.issues : [])}`);
  });

  it('rejects missing incidentId', () => {
    const { incidentId: _, ...rest } = validPayload;
    const result = IncidentCapturePayloadSchema.safeParse(rest);
    assert.ok(!result.success);
  });

  it('rejects invalid EthAddress (missing 0x prefix)', () => {
    const result = IncidentCapturePayloadSchema.safeParse({
      ...validPayload,
      userSmartAccountAddress: '742d35Cc6634C0532925a3b8D4C2C4e4d79e3f52',
    });
    assert.ok(!result.success);
  });

  it('rejects geohash longer than 6 chars', () => {
    const result = IncidentCapturePayloadSchema.safeParse({
      ...validPayload,
      spatialBucket: 'ttnf7z1',
    });
    assert.ok(!result.success);
  });

  it('rejects invalid triggerMode', () => {
    const result = IncidentCapturePayloadSchema.safeParse({
      ...validPayload,
      triggerMode: 'INVALID_MODE',
    });
    assert.ok(!result.success);
  });

  it('rejects SHA256 with wrong length (63 chars)', () => {
    const result = IncidentCapturePayloadSchema.safeParse({
      ...validPayload,
      sessionMerkleRoot: 'a'.repeat(63),
    });
    assert.ok(!result.success);
  });

  it('accepts all 6 valid TriggerMode values', () => {
    for (const mode of TRIGGER_MODE_VALUES) {
      const result = IncidentCapturePayloadSchema.safeParse({
        ...validPayload,
        triggerMode: mode,
      });
      assert.ok(result.success, `TriggerMode '${mode}' should be valid`);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. EncryptedEvidenceRecord Validator Tests
// ---------------------------------------------------------------------------

describe('EncryptedEvidenceRecord Zod Validator', () => {
  const validRecord = {
    incidentId: VALID_INCIDENT_ID,
    chunkIndex: 0,
    mediaType: 'AUDIO_AAC' as const,
    ivHex: VALID_IV,
    authTagHex: VALID_AUTH_TAG,
    plaintextSha256: VALID_SHA256,
    ciphertextSha256: 'b'.repeat(64),
    ipfsCID: VALID_IPFS_CID,
    ciphertextBytes: 640_000,
    chunkDurationSeconds: 5,
    encryptedAt: NOW,
    isAnchoredOnChain: false,
    schemaVersion: '1.0.0' as const,
  };

  it('accepts a valid EncryptedEvidenceRecord', () => {
    const result = EncryptedEvidenceRecordSchema.safeParse(validRecord);
    assert.ok(result.success, `Validation failed: ${JSON.stringify(!result.success ? result.error.issues : [])}`);
  });

  it('rejects IV with wrong length (23 chars instead of 24)', () => {
    const result = EncryptedEvidenceRecordSchema.safeParse({
      ...validRecord,
      ivHex: 'a'.repeat(23),
    });
    assert.ok(!result.success);
  });

  it('rejects auth tag with wrong length (31 chars instead of 32)', () => {
    const result = EncryptedEvidenceRecordSchema.safeParse({
      ...validRecord,
      authTagHex: 'a'.repeat(31),
    });
    assert.ok(!result.success);
  });

  it('rejects invalid mediaType', () => {
    const result = EncryptedEvidenceRecordSchema.safeParse({
      ...validRecord,
      mediaType: 'MP4_VIDEO',
    });
    assert.ok(!result.success);
  });

  it('accepts all 3 valid mediaType values', () => {
    for (const mediaType of ['AUDIO_AAC', 'VIDEO_H265', 'SENSOR_TELEMETRY'] as const) {
      const result = EncryptedEvidenceRecordSchema.safeParse({ ...validRecord, mediaType });
      assert.ok(result.success, `mediaType '${mediaType}' should be valid`);
    }
  });

  it('sets isAnchoredOnChain default to false', () => {
    const result = EncryptedEvidenceRecordSchema.safeParse(validRecord);
    assert.ok(result.success);
    if (result.success) {
      assert.equal(result.data.isAnchoredOnChain, false);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. SOSAlertPacket Validator Tests
// ---------------------------------------------------------------------------

describe('SOSAlertPacket Zod Validator', () => {
  const validPacket = {
    packetId: VALID_USER_ID,
    incidentId: VALID_INCIDENT_ID,
    createdAt: NOW,
    triggerMode: TriggerMode.MANUAL_BUTTON,
    status: SOSStatus.INITIATED,
    smsBase91Payload: 'aB3#kQ9xPz',
    smartAccountSignature: VALID_SIG,
    signerAddress: VALID_ETH_ADDR,
    dispatchRails: [
      { rail: DispatchRail.RAIL_A_WSS, status: DispatchStatus.PENDING },
    ],
    spatialBucket: VALID_GEOHASH,
    evidenceMerkleRoot: VALID_SHA256,
    schemaVersion: '1.0.0' as const,
  };

  it('accepts a valid SOSAlertPacket', () => {
    const result = SOSAlertPacketSchema.safeParse(validPacket);
    assert.ok(result.success, `Validation failed: ${JSON.stringify(!result.success ? result.error.issues : [])}`);
  });

  it('rejects empty dispatchRails array', () => {
    const result = SOSAlertPacketSchema.safeParse({ ...validPacket, dispatchRails: [] });
    assert.ok(!result.success);
  });

  it('accepts all 3 dispatch rails simultaneously', () => {
    const result = SOSAlertPacketSchema.safeParse({
      ...validPacket,
      dispatchRails: [
        { rail: DispatchRail.RAIL_A_WSS, status: DispatchStatus.TIMEOUT },
        { rail: DispatchRail.RAIL_B_SMS, status: DispatchStatus.SENT },
        { rail: DispatchRail.RAIL_C_BLE, status: DispatchStatus.PENDING },
      ],
    });
    assert.ok(result.success);
  });

  it('rejects signature with wrong format (missing 0x)', () => {
    const result = SOSAlertPacketSchema.safeParse({
      ...validPacket,
      smartAccountSignature: 'c'.repeat(130),
    });
    assert.ok(!result.success);
  });
});

// ---------------------------------------------------------------------------
// 6. ZKProofSubmission Validator Tests
// ---------------------------------------------------------------------------

describe('ZKProofSubmission Zod Validator', () => {
  const validSubmission = {
    submissionId: VALID_INCIDENT_ID,
    submittedAt: NOW,
    proof: {
      pi_a: [VALID_BN128, VALID_BN128] as [string, string],
      pi_b: [[VALID_BN128, VALID_BN128], [VALID_BN128, VALID_BN128]] as [[string, string], [string, string]],
      pi_c: [VALID_BN128, VALID_BN128] as [string, string],
    },
    publicInputs: {
      poseidonNullifierHash: VALID_SHA256,
      geohashBucket: VALID_GEOHASH,
      incidentCategoryCode: BNSSection.SECTION_74,
      timestampBucketEpochHour: 453_321,
    },
    isNullifierVerified: false,
    zkeyVersion: 'v2-amoy-groth16-ptau-2024',
    schemaVersion: '1.0.0' as const,
  };

  it('accepts a valid ZKProofSubmission', () => {
    const result = ZKProofSubmissionSchema.safeParse(validSubmission);
    assert.ok(result.success, `Validation failed: ${JSON.stringify(!result.success ? result.error.issues : [])}`);
  });

  it('rejects nullifier hash with wrong length', () => {
    const result = ZKProofSubmissionSchema.safeParse({
      ...validSubmission,
      publicInputs: { ...validSubmission.publicInputs, poseidonNullifierHash: 'a'.repeat(63) },
    });
    assert.ok(!result.success);
  });

  it('rejects invalid BNS section', () => {
    const result = ZKProofSubmissionSchema.safeParse({
      ...validSubmission,
      publicInputs: { ...validSubmission.publicInputs, incidentCategoryCode: 'BNS_99' },
    });
    assert.ok(!result.success);
  });

  it('accepts all 4 BNS section codes', () => {
    for (const code of [BNSSection.SECTION_74, BNSSection.SECTION_75, BNSSection.SECTION_78, BNSSection.SECTION_351_2]) {
      const result = ZKProofSubmissionSchema.safeParse({
        ...validSubmission,
        publicInputs: { ...validSubmission.publicInputs, incidentCategoryCode: code },
      });
      assert.ok(result.success, `BNS section '${code}' should be valid`);
    }
  });

  it('accepts optional onChainTxHash', () => {
    const result = ZKProofSubmissionSchema.safeParse({
      ...validSubmission,
      onChainTxHash: VALID_TX_HASH,
    });
    assert.ok(result.success);
  });
});

// ---------------------------------------------------------------------------
// 7. eFIRRecord Validator Tests — BNSS §173 deadline enforcement
// ---------------------------------------------------------------------------

describe('eFIRRecord Zod Validator — BNSS §173 Deadline Enforcement', () => {
  const validEFIR = {
    efirId: VALID_EFIR_ID,
    incidentId: VALID_INCIDENT_ID,
    createdAt: NOW,
    signDeadlineAt: DEADLINE_72H,
    status: EFIRStatus.PENDING_SIGN,
    allegedBNSSections: [BNSSection.SECTION_74],
    originalLanguageCode: 'hi',
    transcriptHash: VALID_SHA256,
    encryptedTranscriptCID: VALID_IPFS_CID,
    isEscalatedToSP: false,
    schemaVersion: '1.0.0' as const,
  };

  it('accepts a valid eFIRRecord with 72-hour deadline', () => {
    const result = EFIRRecordSchema.safeParse(validEFIR);
    assert.ok(result.success, `Validation failed: ${JSON.stringify(!result.success ? result.error.issues : [])}`);
  });

  it('rejects signDeadlineAt that is NOT ~72 hours after createdAt (BNSS §173)', () => {
    // Set deadline to only 48 hours after creation
    const wrongDeadline = new Date(Date.now() + 172_800_000).toISOString();
    const result = EFIRRecordSchema.safeParse({
      ...validEFIR,
      signDeadlineAt: wrongDeadline,
    });
    assert.ok(!result.success, 'Should reject deadline that is not 72 hours after createdAt');
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      assert.ok(paths.includes('signDeadlineAt'), 'Error should be on signDeadlineAt path');
    }
  });

  it('rejects empty allegedBNSSections array', () => {
    const result = EFIRRecordSchema.safeParse({ ...validEFIR, allegedBNSSections: [] });
    assert.ok(!result.success);
  });

  it('accepts multiple BNS sections', () => {
    const result = EFIRRecordSchema.safeParse({
      ...validEFIR,
      allegedBNSSections: [BNSSection.SECTION_74, BNSSection.SECTION_75, BNSSection.SECTION_78],
    });
    assert.ok(result.success);
  });

  it('accepts optional ngoEarlyWarningAt when before signDeadlineAt', () => {
    const result = EFIRRecordSchema.safeParse({
      ...validEFIR,
      ngoEarlyWarningAt: WARNING_48H,
    });
    assert.ok(result.success);
  });

  it('rejects ngoEarlyWarningAt after signDeadlineAt', () => {
    // Set NGO warning AFTER the 72hr deadline (invalid)
    const afterDeadline = new Date(Date.now() + 302_400_000).toISOString(); // 84 hours
    const result = EFIRRecordSchema.safeParse({
      ...validEFIR,
      ngoEarlyWarningAt: afterDeadline,
    });
    assert.ok(!result.success);
  });

  it('BNSS §173 canonical constant is 259,200 seconds', () => {
    // Directly verify the constant used in the validator
    assert.equal(BNSS_173_DEADLINE_SECONDS, 259_200);
  });
});

// ---------------------------------------------------------------------------
// 8. BSA63CertificatePack Validator Tests
// ---------------------------------------------------------------------------

describe('BSA63CertificatePack Zod Validator', () => {
  const validCert = {
    certId: VALID_CERT_ID,
    incidentId: VALID_INCIDENT_ID,
    efirId: VALID_EFIR_ID,
    generatedAt: NOW,
    teeAttestation: {
      teeType: 'ANDROID_STRONGBOX' as const,
      attestationCertChainBase64: ['MIIBxDCCAW2gAwIBAgIJAP3sX4dY7zL0MA0GCSqGSIb3DQEBCwUAMA=='],
      osBuildFingerprintHash: VALID_SHA256,
      securityLevel: 'STRONGBOX',
    },
    deviceMetadata: {
      osFingerprintHash: VALID_SHA256,
      appVersionHash: 'c'.repeat(64),
    },
    evidenceHashChain: {
      chunkDigests: [VALID_SHA256, 'd'.repeat(64)],
      chainRoot: 'e'.repeat(64),
      totalChunks: 2,
    },
    ipfsPinStatus: {
      bundleCID: VALID_IPFS_CID,
      filecoinDealCount: 3,
      lastPinCheckAt: NOW,
      isPinned: true,
    },
    polygonReceipts: [
      {
        contractName: 'EvidenceRegistry' as const,
        txHash: VALID_TX_HASH,
        blockNumber: 54_321_000,
        blockTimestamp: NOW,
      },
    ],
    pdfA3CID: VALID_IPFS_CID,
    jsonLdCID: VALID_IPFS_CID,
    platformSignature: VALID_SIG,
    platformSignerAddress: VALID_ETH_ADDR,
    schemaVersion: '1.0.0' as const,
  };

  it('accepts a valid BSA63CertificatePack', () => {
    const result = BSA63CertificatePackSchema.safeParse(validCert);
    assert.ok(result.success, `Validation failed: ${JSON.stringify(!result.success ? result.error.issues : [])}`);
  });

  it('rejects missing TEE attestation', () => {
    const { teeAttestation: _, ...rest } = validCert;
    const result = BSA63CertificatePackSchema.safeParse(rest);
    assert.ok(!result.success);
  });

  it('rejects invalid teeType', () => {
    const result = BSA63CertificatePackSchema.safeParse({
      ...validCert,
      teeAttestation: { ...validCert.teeAttestation, teeType: 'QUALCOMM_TEE' },
    });
    assert.ok(!result.success);
  });

  it('accepts all 3 TEE types', () => {
    for (const teeType of ['ANDROID_STRONGBOX', 'IOS_SECURE_ENCLAVE', 'AWS_NITRO'] as const) {
      const result = BSA63CertificatePackSchema.safeParse({
        ...validCert,
        teeAttestation: { ...validCert.teeAttestation, teeType },
      });
      assert.ok(result.success, `TEE type '${teeType}' should be valid`);
    }
  });

  it('rejects empty polygonReceipts array', () => {
    const result = BSA63CertificatePackSchema.safeParse({ ...validCert, polygonReceipts: [] });
    assert.ok(!result.success);
  });

  it('accepts all 4 valid contract names in polygonReceipts', () => {
    const contracts = ['EvidenceRegistry', 'SOSLog', 'ComplaintEscrow', 'ZKReportVerifier'] as const;
    const result = BSA63CertificatePackSchema.safeParse({
      ...validCert,
      polygonReceipts: contracts.map((contractName) => ({
        contractName,
        txHash: VALID_TX_HASH,
        blockNumber: 54_321_000,
        blockTimestamp: NOW,
      })),
    });
    assert.ok(result.success);
  });

  it('rejects platform signature with wrong format', () => {
    const result = BSA63CertificatePackSchema.safeParse({
      ...validCert,
      platformSignature: '0x' + 'z'.repeat(130), // invalid hex chars
    });
    assert.ok(!result.success);
  });
});

// ---------------------------------------------------------------------------
// 9. Schema Registry Tests
// ---------------------------------------------------------------------------

describe('Schema Registry', () => {
  it('SCHEMA_REGISTRY contains all 6 Zod validators', () => {
    const keys = Object.keys(SCHEMA_REGISTRY);
    assert.equal(keys.length, 6);
    assert.ok(keys.includes('IncidentCapturePayload'));
    assert.ok(keys.includes('EncryptedEvidenceRecord'));
    assert.ok(keys.includes('SOSAlertPacket'));
    assert.ok(keys.includes('ZKProofSubmission'));
    assert.ok(keys.includes('EFIRRecord'));
    assert.ok(keys.includes('BSA63CertificatePack'));
  });

  it('JSON_SCHEMA_REGISTRY contains all 6 JSON schemas with $schema and $id fields', () => {
    const keys = Object.keys(JSON_SCHEMA_REGISTRY);
    assert.equal(keys.length, 6);
    for (const [name, schema] of Object.entries(JSON_SCHEMA_REGISTRY)) {
      assert.ok('$schema' in schema, `${name} JSON Schema missing $schema`);
      assert.ok('$id' in schema, `${name} JSON Schema missing $id`);
      assert.ok('title' in schema, `${name} JSON Schema missing title`);
      assert.ok(
        (schema as { $schema: string }).$schema === 'https://json-schema.org/draft/2020-12/schema',
        `${name} JSON Schema should use Draft 2020-12`
      );
    }
  });

  it('All JSON schema $id URIs follow she-raksha.in/schemas/v1/ pattern', () => {
    for (const [name, schema] of Object.entries(JSON_SCHEMA_REGISTRY)) {
      const id = (schema as { $id: string }).$id;
      assert.ok(
        id.startsWith('https://she-raksha.in/schemas/v1/'),
        `${name} $id should start with https://she-raksha.in/schemas/v1/`
      );
    }
  });

  it('IncidentCapturePayload JSON Schema contains triggerMode enum with all 6 values', () => {
    const schema = IncidentCapturePayloadJSONSchema;
    const triggerModeEnum = schema.properties.triggerMode.enum;
    assert.equal(triggerModeEnum.length, 6);
    assert.ok(triggerModeEnum.includes('HARDWARE_TAP_FOUR_PRESS'));
    assert.ok(triggerModeEnum.includes('MANUAL_BUTTON'));
  });
});

// ---------------------------------------------------------------------------
// 10. Security Invariant Tests (DPDP Act, SKILL.MD)
// ---------------------------------------------------------------------------

describe('Security Invariants', () => {
  it('EncryptedEvidenceRecord does NOT have a plaintext content field', () => {
    const schema = EncryptedEvidenceRecordJSONSchema;
    // Verify no 'content', 'data', 'audio', or 'video' plaintext fields
    const propertyKeys = Object.keys(schema.properties);
    assert.ok(!propertyKeys.includes('content'));
    assert.ok(!propertyKeys.includes('audioData'));
    assert.ok(!propertyKeys.includes('videoData'));
    assert.ok(!propertyKeys.includes('rawBytes'));
  });

  it('anonymous_reports schema (ZKProofSubmission) has NO user identity field', () => {
    // ZKProofSubmission must NOT have userId or walletAddress in public inputs
    const schema = ZKProofSubmissionJSONSchema;
    const publicInputKeys = Object.keys(schema.properties.publicInputs.properties);
    assert.ok(!publicInputKeys.includes('userId'));
    assert.ok(!publicInputKeys.includes('walletAddress'));
    assert.ok(!publicInputKeys.includes('identitySecret'));
    // Must have poseidonNullifierHash (computed from identitySecret, never stored)
    assert.ok(publicInputKeys.includes('poseidonNullifierHash'));
  });

  it('eFIRRecord JSON Schema does NOT allow raw transcript text', () => {
    const schema = EFIRRecordJSONSchema;
    const props = Object.keys(schema.properties);
    assert.ok(!props.includes('transcriptText'));
    assert.ok(!props.includes('rawTranscript'));
    // Only the hash and encrypted CID are allowed
    assert.ok(props.includes('transcriptHash'));
    assert.ok(props.includes('encryptedTranscriptCID'));
  });

  it('SOSAlertPacket has NO raw GPS coordinates', () => {
    const schema = SOSAlertPacketJSONSchema;
    const props = Object.keys(schema.properties);
    assert.ok(!props.includes('latitude'));
    assert.ok(!props.includes('longitude'));
    assert.ok(!props.includes('gpsCoordinates'));
    // Only geohash-6 spatial bucket allowed
    assert.ok(props.includes('spatialBucket'));
  });

  it('BSA63CertificatePack has all 3 TEE types in attestation enum', () => {
    const certSchema = BSA63CertificatePackJSONSchema;
    const teeTypes = certSchema.properties.teeAttestation.properties.teeType.enum;
    assert.ok(teeTypes.includes('ANDROID_STRONGBOX'));
    assert.ok(teeTypes.includes('IOS_SECURE_ENCLAVE'));
    assert.ok(teeTypes.includes('AWS_NITRO'));
  });
});
