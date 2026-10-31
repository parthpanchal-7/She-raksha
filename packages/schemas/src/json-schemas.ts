/**
 * @she-raksha/schemas — JSON Schema Definitions (Draft 2020-12)
 *
 * One JSON Schema per DFD data contract. These are exported as
 * static TypeScript objects (compatible with ajv, @apidevtools/swagger-parser,
 * and json-schema-to-typescript). They mirror the Zod validators exactly.
 */

// ---------------------------------------------------------------------------
// 1. IncidentCapturePayload JSON Schema
// ---------------------------------------------------------------------------
export const IncidentCapturePayloadJSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://she-raksha.in/schemas/v1/IncidentCapturePayload.json',
  title: 'IncidentCapturePayload',
  description:
    'Emitted by the She-Raksha mobile client at trigger activation. ' +
    'Contains zero cleartext PII (DPDP Act 2023). ' +
    'Location is quantized to geohash-6.',
  type: 'object',
  required: [
    'incidentId', 'userSmartAccountAddress', 'triggeredAt', 'triggerMode',
    'sessionMerkleRoot', 'totalChunks', 'captureWindowSeconds', 'spatialBucket',
    'sessionKeyId', 'evidenceChunkCIDs', 'evidenceMerkleRoot', 'schemaVersion',
  ],
  additionalProperties: false,
  properties: {
    incidentId: { type: 'string', format: 'uuid', description: 'UUID v4 incident identifier' },
    userSmartAccountAddress: {
      type: 'string',
      pattern: '^0x[0-9a-fA-F]{40}$',
      description: 'ERC-4337 Smart Account address of the survivor',
    },
    triggeredAt: { type: 'string', format: 'date-time' },
    triggerMode: {
      type: 'string',
      enum: [
        'HARDWARE_TAP_FOUR_PRESS', 'SHAKE_ACCELEROMETER', 'VOICE_DURESS_TFLITE',
        'FALL_DETECTION', 'DEAD_MAN_SWITCH', 'MANUAL_BUTTON',
      ],
    },
    sessionMerkleRoot: {
      type: 'string', minLength: 64, maxLength: 64,
      pattern: '^[0-9a-f]{64}$', description: 'Session Merkle root (SHA-256 hex)',
    },
    totalChunks: { type: 'integer', minimum: 0 },
    captureWindowSeconds: { type: 'number', exclusiveMinimum: 0, maximum: 86400 },
    peakAccelerationG: { type: 'number', exclusiveMinimum: 0, maximum: 20 },
    spatialBucket: {
      type: 'string', minLength: 6, maxLength: 6,
      pattern: '^[0-9b-hjkmnp-z]{6}$', description: 'Geohash-6 spatial bucket',
    },
    sessionKeyId: { type: 'string', format: 'uuid', description: 'HKDF session key identifier' },
    evidenceChunkCIDs: {
      type: 'array',
      items: { type: 'string', minLength: 46, maxLength: 128 },
      minItems: 1, maxItems: 1000,
    },
    evidenceMerkleRoot: {
      type: 'string', minLength: 64, maxLength: 64,
      pattern: '^[0-9a-f]{64}$',
    },
    schemaVersion: { type: 'string', const: '1.0.0' },
  },
} as const;

// ---------------------------------------------------------------------------
// 2. EncryptedEvidenceRecord JSON Schema
// ---------------------------------------------------------------------------
export const EncryptedEvidenceRecordJSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://she-raksha.in/schemas/v1/EncryptedEvidenceRecord.json',
  title: 'EncryptedEvidenceRecord',
  description:
    'One record per 5-second AES-256-GCM encrypted media chunk. ' +
    'Zero plaintext on flash storage (NFR-SEC-001, NFR-SEC-002). ' +
    'IV is unique per chunk (CSPRNG 96-bit).',
  type: 'object',
  required: [
    'incidentId', 'chunkIndex', 'mediaType', 'ivHex', 'authTagHex',
    'plaintextSha256', 'ciphertextSha256', 'ipfsCID', 'ciphertextBytes',
    'chunkDurationSeconds', 'encryptedAt', 'isAnchoredOnChain', 'schemaVersion',
  ],
  additionalProperties: false,
  properties: {
    incidentId: { type: 'string', format: 'uuid' },
    chunkIndex: { type: 'integer', minimum: 0, maximum: 9999 },
    mediaType: { type: 'string', enum: ['AUDIO_AAC', 'VIDEO_H265', 'SENSOR_TELEMETRY'] },
    ivHex: {
      type: 'string', minLength: 24, maxLength: 24,
      pattern: '^[0-9a-f]{24}$', description: 'AES-256-GCM 96-bit IV (12 bytes hex)',
    },
    authTagHex: {
      type: 'string', minLength: 32, maxLength: 32,
      pattern: '^[0-9a-f]{32}$', description: 'AES-256-GCM 128-bit auth tag (16 bytes hex)',
    },
    plaintextSha256: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
    ciphertextSha256: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
    ipfsCID: {
      type: 'string', minLength: 46, maxLength: 128,
      pattern: '^(bafy|bafk|Qm)[1-9A-HJ-NP-Za-km-z]+$',
    },
    ciphertextBytes: { type: 'integer', minimum: 1, maximum: 10000000 },
    chunkDurationSeconds: { type: 'number', exclusiveMinimum: 0, maximum: 30 },
    encryptedAt: { type: 'string', format: 'date-time' },
    isAnchoredOnChain: { type: 'boolean', default: false },
    anchorTxHash: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' },
    schemaVersion: { type: 'string', const: '1.0.0' },
  },
} as const;

// ---------------------------------------------------------------------------
// 3. SOSAlertPacket JSON Schema
// ---------------------------------------------------------------------------
export const SOSAlertPacketJSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://she-raksha.in/schemas/v1/SOSAlertPacket.json',
  title: 'SOSAlertPacket',
  description:
    'Multi-rail SOS dispatch packet signed by the ERC-4337 Smart Account. ' +
    'smsBase91Payload raw bytes MUST be <140 bytes for GSM-7 SMS compliance (Rail B). ' +
    'Rail A timeout threshold: 5,000ms.',
  type: 'object',
  required: [
    'packetId', 'incidentId', 'createdAt', 'triggerMode', 'status',
    'smsBase91Payload', 'smartAccountSignature', 'signerAddress',
    'dispatchRails', 'spatialBucket', 'evidenceMerkleRoot', 'schemaVersion',
  ],
  additionalProperties: false,
  properties: {
    packetId: { type: 'string', format: 'uuid' },
    incidentId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    triggerMode: {
      type: 'string',
      enum: [
        'HARDWARE_TAP_FOUR_PRESS', 'SHAKE_ACCELEROMETER', 'VOICE_DURESS_TFLITE',
        'FALL_DETECTION', 'DEAD_MAN_SWITCH', 'MANUAL_BUTTON',
      ],
    },
    status: {
      type: 'string',
      enum: ['INITIATED', 'DISPATCHING', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED', 'ESCALATED'],
    },
    smsBase91Payload: {
      type: 'string', minLength: 1, maxLength: 160,
      description: 'Base91-encoded payload, max 160 GSM-7 chars',
    },
    smartAccountSignature: {
      type: 'string', pattern: '^0x[0-9a-fA-F]{130}$',
      description: '65-byte ECDSA signature as hex',
    },
    signerAddress: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' },
    dispatchRails: {
      type: 'array',
      minItems: 1, maxItems: 3,
      items: {
        type: 'object',
        required: ['rail', 'status'],
        properties: {
          rail: { type: 'string', enum: ['RAIL_A_WSS', 'RAIL_B_SMS', 'RAIL_C_BLE'] },
          status: {
            type: 'string',
            enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'TIMEOUT'],
          },
          attemptedAt: { type: 'string', format: 'date-time' },
          acknowledgedAt: { type: 'string', format: 'date-time' },
          railTrackingId: { type: 'string', maxLength: 128 },
        },
      },
    },
    spatialBucket: {
      type: 'string', minLength: 6, maxLength: 6,
      pattern: '^[0-9b-hjkmnp-z]{6}$',
    },
    evidenceMerkleRoot: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
    schemaVersion: { type: 'string', const: '1.0.0' },
  },
} as const;

// ---------------------------------------------------------------------------
// 4. ZKProofSubmission JSON Schema
// ---------------------------------------------------------------------------
export const ZKProofSubmissionJSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://she-raksha.in/schemas/v1/ZKProofSubmission.json',
  title: 'ZKProofSubmission',
  description:
    'Groth16 zero-knowledge proof from AnonymousBystanderReportVerifier_v2.circom. ' +
    'NullifierHash = Poseidon(identitySecret, incidentID). ' +
    'Submitted to ZKReportVerifier.sol on Polygon L2.',
  type: 'object',
  required: [
    'submissionId', 'submittedAt', 'proof', 'publicInputs',
    'isNullifierVerified', 'zkeyVersion', 'schemaVersion',
  ],
  additionalProperties: false,
  properties: {
    submissionId: { type: 'string', format: 'uuid' },
    submittedAt: { type: 'string', format: 'date-time' },
    proof: {
      type: 'object',
      required: ['pi_a', 'pi_b', 'pi_c'],
      properties: {
        pi_a: {
          type: 'array', minItems: 2, maxItems: 2,
          items: { type: 'string', pattern: '^0x[0-9a-fA-F]{1,64}$' },
        },
        pi_b: {
          type: 'array', minItems: 2, maxItems: 2,
          items: {
            type: 'array', minItems: 2, maxItems: 2,
            items: { type: 'string', pattern: '^0x[0-9a-fA-F]{1,64}$' },
          },
        },
        pi_c: {
          type: 'array', minItems: 2, maxItems: 2,
          items: { type: 'string', pattern: '^0x[0-9a-fA-F]{1,64}$' },
        },
      },
    },
    publicInputs: {
      type: 'object',
      required: ['poseidonNullifierHash', 'geohashBucket', 'incidentCategoryCode', 'timestampBucketEpochHour'],
      properties: {
        poseidonNullifierHash: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
        geohashBucket: { type: 'string', minLength: 6, maxLength: 6, pattern: '^[0-9b-hjkmnp-z]{6}$' },
        incidentCategoryCode: { type: 'string', enum: ['BNS_74', 'BNS_75', 'BNS_78', 'BNS_351_2'] },
        timestampBucketEpochHour: { type: 'integer', minimum: 0 },
      },
    },
    onChainTxHash: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' },
    isNullifierVerified: { type: 'boolean', default: false },
    zkeyVersion: { type: 'string', minLength: 1, maxLength: 64 },
    schemaVersion: { type: 'string', const: '1.0.0' },
  },
} as const;

// ---------------------------------------------------------------------------
// 5. eFIRRecord JSON Schema
// ---------------------------------------------------------------------------
export const EFIRRecordJSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://she-raksha.in/schemas/v1/eFIRRecord.json',
  title: 'eFIRRecord',
  description:
    'Automated eFIR filing under BNSS §173. ' +
    'STATUTORY: signDeadlineAt MUST be createdAt + 259,200s (72 hours). ' +
    'OPTIONAL: ngoEarlyWarningAt is a 48-hour configurable webhook trigger.',
  type: 'object',
  required: [
    'efirId', 'incidentId', 'createdAt', 'signDeadlineAt', 'status',
    'allegedBNSSections', 'originalLanguageCode', 'transcriptHash',
    'encryptedTranscriptCID', 'isEscalatedToSP', 'schemaVersion',
  ],
  additionalProperties: false,
  properties: {
    efirId: { type: 'string', format: 'uuid' },
    incidentId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    signDeadlineAt: {
      type: 'string', format: 'date-time',
      description: 'BNSS §173 statutory 72-hour signing deadline (createdAt + 259200s)',
    },
    ngoEarlyWarningAt: {
      type: 'string', format: 'date-time',
      description: 'Optional 48-hour NGO early-warning webhook (deployment-configurable)',
    },
    status: {
      type: 'string',
      enum: ['PENDING_SIGN', 'SIGNED', 'ACKNOWLEDGED', 'DEADLINE_BREACHED', 'ESCALATED_SP'],
    },
    allegedBNSSections: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', enum: ['BNS_74', 'BNS_75', 'BNS_78', 'BNS_351_2'] },
    },
    originalLanguageCode: { type: 'string', minLength: 2, maxLength: 2 },
    transcriptHash: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
    encryptedTranscriptCID: { type: 'string', minLength: 46, maxLength: 128 },
    escrowContractId: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' },
    escrowInitTxHash: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' },
    signedAt: { type: 'string', format: 'date-time' },
    aadhaarSignHash: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
    acknowledgedAt: { type: 'string', format: 'date-time' },
    isEscalatedToSP: { type: 'boolean', default: false },
    escalatedAt: { type: 'string', format: 'date-time' },
    schemaVersion: { type: 'string', const: '1.0.0' },
  },
} as const;

// ---------------------------------------------------------------------------
// 6. BSA63CertificatePack JSON Schema
// ---------------------------------------------------------------------------
export const BSA63CertificatePackJSONSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://she-raksha.in/schemas/v1/BSA63CertificatePack.json',
  title: 'BSA63CertificatePack',
  description:
    'Cryptographically signed certificate under BSA §63 (FR-EV-007). ' +
    'Contains TEE attestation, OS build specs, SHA-256 hash chains, ' +
    'IPFS CIDv1 consensus status, and Polygon L2 transaction receipts.',
  type: 'object',
  required: [
    'certId', 'incidentId', 'efirId', 'generatedAt', 'teeAttestation',
    'deviceMetadata', 'evidenceHashChain', 'ipfsPinStatus', 'polygonReceipts',
    'pdfA3CID', 'jsonLdCID', 'platformSignature', 'platformSignerAddress', 'schemaVersion',
  ],
  additionalProperties: false,
  properties: {
    certId: { type: 'string', format: 'uuid' },
    incidentId: { type: 'string', format: 'uuid' },
    efirId: { type: 'string', format: 'uuid' },
    generatedAt: { type: 'string', format: 'date-time' },
    teeAttestation: {
      type: 'object',
      required: ['teeType', 'attestationCertChainBase64', 'osBuildFingerprintHash', 'securityLevel'],
      properties: {
        teeType: { type: 'string', enum: ['ANDROID_STRONGBOX', 'IOS_SECURE_ENCLAVE', 'AWS_NITRO'] },
        attestationCertChainBase64: {
          type: 'array', minItems: 1, maxItems: 5,
          items: { type: 'string', minLength: 32 },
        },
        osBuildFingerprintHash: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
        securityLevel: { type: 'string', minLength: 1, maxLength: 64 },
      },
    },
    deviceMetadata: {
      type: 'object',
      required: ['osFingerprintHash', 'appVersionHash'],
      properties: {
        osFingerprintHash: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
        appVersionHash: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
      },
    },
    evidenceHashChain: {
      type: 'object',
      required: ['chunkDigests', 'chainRoot', 'totalChunks'],
      properties: {
        chunkDigests: {
          type: 'array', minItems: 1, maxItems: 1000,
          items: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
        },
        chainRoot: { type: 'string', minLength: 64, maxLength: 64, pattern: '^[0-9a-f]{64}$' },
        totalChunks: { type: 'integer', minimum: 1 },
      },
    },
    ipfsPinStatus: {
      type: 'object',
      required: ['bundleCID', 'filecoinDealCount', 'lastPinCheckAt', 'isPinned'],
      properties: {
        bundleCID: { type: 'string', minLength: 46, maxLength: 128 },
        filecoinDealCount: { type: 'integer', minimum: 0 },
        lastPinCheckAt: { type: 'string', format: 'date-time' },
        isPinned: { type: 'boolean' },
      },
    },
    polygonReceipts: {
      type: 'array', minItems: 1,
      items: {
        type: 'object',
        required: ['contractName', 'txHash', 'blockNumber', 'blockTimestamp'],
        properties: {
          contractName: {
            type: 'string',
            enum: ['EvidenceRegistry', 'SOSLog', 'ComplaintEscrow', 'ZKReportVerifier'],
          },
          txHash: { type: 'string', pattern: '^0x[0-9a-fA-F]{64}$' },
          blockNumber: { type: 'integer', minimum: 1 },
          blockTimestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    pdfA3CID: { type: 'string', minLength: 46, maxLength: 128 },
    jsonLdCID: { type: 'string', minLength: 46, maxLength: 128 },
    platformSignature: {
      type: 'string', pattern: '^0x[0-9a-fA-F]{130}$',
      description: '65-byte ECDSA platform signature as hex',
    },
    platformSignerAddress: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' },
    schemaVersion: { type: 'string', const: '1.0.0' },
  },
} as const;

// ---------------------------------------------------------------------------
// JSON Schema registry
// ---------------------------------------------------------------------------
export const JSON_SCHEMA_REGISTRY = {
  IncidentCapturePayload: IncidentCapturePayloadJSONSchema,
  EncryptedEvidenceRecord: EncryptedEvidenceRecordJSONSchema,
  SOSAlertPacket: SOSAlertPacketJSONSchema,
  ZKProofSubmission: ZKProofSubmissionJSONSchema,
  EFIRRecord: EFIRRecordJSONSchema,
  BSA63CertificatePack: BSA63CertificatePackJSONSchema,
} as const;

