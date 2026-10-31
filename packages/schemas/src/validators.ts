/**
 * @she-raksha/schemas — Zod Validators for all 6 DFD Data Contracts
 *
 * Each schema validates the canonical payload shape and re-exports
 * inferred TypeScript types. All schemas comply with SKILL.MD rules:
 *  - DPDP Act 2023: zero cleartext PII in any payload
 *  - BNSS §173: 72-hour deadline enforced in eFIRRecord
 *  - BSA §63: full certificate chain in BSA63CertificatePack
 */

import { z } from 'zod';

import {
  TRIGGER_MODE_VALUES,
  MEDIA_TYPE_VALUES,
  SOS_STATUS_VALUES,
  DISPATCH_RAIL_VALUES,
  DISPATCH_STATUS_VALUES,
  EFIR_STATUS_VALUES,
  BNS_SECTION_VALUES,
  BNSS_173_DEADLINE_SECONDS,
} from './enums.js';

// ---------------------------------------------------------------------------
// Reusable primitives
// ---------------------------------------------------------------------------

/** ISO 8601 UTC timestamp string */
const ISOTimestamp = z
  .string()
  .datetime({ offset: true })
  .describe('ISO 8601 timestamp with UTC offset');

/** SHA-256 hex digest (64 hex chars) */
const SHA256Hex = z
  .string()
  .length(64)
  .regex(/^[0-9a-f]{64}$/)
  .describe('SHA-256 hex digest (64 lowercase hex chars)');

/** IPFS CIDv1 string (base32 lowercase multibase, starts with 'b') or CIDv0 (starts with 'Qm') */
const IPFSCIDv1 = z
  .string()
  .min(46)
  .max(128)
  .regex(/^(bafy[a-z2-7]+|bafk[a-z2-7]+|Qm[1-9A-HJ-NP-Za-km-z]+)$/)
  .describe('IPFS CIDv1 base32 lowercase or CIDv0 base58 string');

/** Ethereum hex address (checksummed or lowercase, 0x + 40 hex chars) */
const EthAddress = z
  .string()
  .regex(/^0x[0-9a-fA-F]{40}$/)
  .describe('EVM-compatible hex address');

/** Polygon L2 transaction hash (0x + 64 hex chars) */
const TxHash = z
  .string()
  .regex(/^0x[0-9a-fA-F]{64}$/)
  .describe('Polygon L2 / EVM transaction hash');

/** UUID v4 */
const UUIDv4 = z
  .string()
  .uuid()
  .describe('UUID v4 identifier');

/** Geohash-6 spatial bucket (~1.2km x 0.6km) — matches Circom public input */
const Geohash6 = z
  .string()
  .length(6)
  .regex(/^[0-9b-hjkmnp-z]{6}$/)
  .describe('Geohash-6 spatial bucket (e.g. ttnf7z)');

/** Base91-encoded string */
const Base91String = z
  .string()
  .min(1)
  .max(160)
  .describe('Base91-encoded payload, max 160 GSM-7 chars');

/** 96-bit AES-GCM IV as hex (24 hex chars = 12 bytes) */
const AES_GCM_IV_Hex = z
  .string()
  .length(24)
  .regex(/^[0-9a-f]{24}$/)
  .describe('AES-256-GCM 96-bit IV as lowercase hex');

/** 128-bit AES-GCM auth tag as hex (32 hex chars = 16 bytes) */
const AES_GCM_Tag_Hex = z
  .string()
  .length(32)
  .regex(/^[0-9a-f]{32}$/)
  .describe('AES-256-GCM 128-bit authentication tag as lowercase hex');

/** BN128 field element as hex string (Groth16 proof coordinate) */
const BN128Hex = z
  .string()
  .regex(/^0x[0-9a-fA-F]{1,64}$/)
  .describe('BN128 field element (Groth16 proof coordinate)');

// ---------------------------------------------------------------------------
// 1. IncidentCapturePayload
//    Emitted by the mobile client at the moment a trigger fires.
//    Contains NO cleartext PII — location is quantized to geohash-6 bucket.
// ---------------------------------------------------------------------------

export const IncidentCapturePayloadSchema = z.object({
  /** Unique incident identifier (UUID v4) */
  incidentId: UUIDv4,
  /** Smart contract account address of the survivor */
  userSmartAccountAddress: EthAddress,
  /** ISO 8601 timestamp of trigger activation */
  triggeredAt: ISOTimestamp,
  /** How the SOS was activated */
  triggerMode: z.enum(TRIGGER_MODE_VALUES),
  /** Session Merkle root accumulating AES-256-GCM chunk hashes */
  sessionMerkleRoot: SHA256Hex,
  /** Total chunks encrypted in this capture session */
  totalChunks: z.number().int().nonnegative(),
  /** Duration of the captured session in seconds */
  captureWindowSeconds: z.number().positive().max(86_400),
  /** Accelerometer g-force at trigger moment (undefined for non-IMU triggers) */
  peakAccelerationG: z.number().positive().max(20).optional(),
  /**
   * Public spatial bucket — quantized to geohash-6 to avoid pinpointing
   * the victim's precise location (DPDP Act §5 data minimisation)
   */
  spatialBucket: Geohash6,
  /**
   * HKDF-SHA256 session key identifier (NOT the key itself).
   * Actual session key is stored in device enclave only.
   */
  sessionKeyId: UUIDv4,
  /** Evidence chunk CIDs pinned to IPFS/Filecoin via Pinata mTLS */
  evidenceChunkCIDs: z.array(IPFSCIDv1).min(1).max(1_000),
  /** Client-side evidence Merkle root as submitted to EvidenceRegistry.sol */
  evidenceMerkleRoot: SHA256Hex,
  /** Schema version for forward compatibility */
  schemaVersion: z.literal('1.0.0'),
});

export type IncidentCapturePayload = z.infer<typeof IncidentCapturePayloadSchema>;

// ---------------------------------------------------------------------------
// 2. EncryptedEvidenceRecord
//    One record per 5-second AES-256-GCM encrypted media chunk.
//    Zero plaintext on flash storage — only ciphertext, IV, auth tag, digest.
// ---------------------------------------------------------------------------

export const EncryptedEvidenceRecordSchema = z.object({
  /** Parent incident identifier */
  incidentId: UUIDv4,
  /** Sequential chunk index within the capture session (0-indexed) */
  chunkIndex: z.number().int().nonnegative().max(9_999),
  /** Media type of the encrypted content */
  mediaType: z.enum(MEDIA_TYPE_VALUES),
  /**
   * AES-256-GCM 96-bit IV — unique per chunk, CSPRNG-generated.
   * SKILL.MD invariant: Never reuse IV across chunks.
   */
  ivHex: AES_GCM_IV_Hex,
  /** AES-256-GCM 128-bit authentication tag */
  authTagHex: AES_GCM_Tag_Hex,
  /**
   * SHA-256 digest of the raw PLAINTEXT chunk before encryption.
   * Used for Merkle tree construction and BSA §63 hash chain.
   * Computed in RAM before zero-fill — never written to flash.
   */
  plaintextSha256: SHA256Hex,
  /**
   * SHA-256 digest of the ciphertext blob stored in IPFS/Filecoin.
   */
  ciphertextSha256: SHA256Hex,
  /** IPFS CIDv1 of the encrypted chunk blob */
  ipfsCID: IPFSCIDv1,
  /** Size of the encrypted chunk in bytes */
  ciphertextBytes: z.number().int().positive().max(10_000_000),
  /** Duration of this chunk in seconds (nominally 5) */
  chunkDurationSeconds: z.number().positive().max(30),
  /** ISO 8601 timestamp when this chunk was encrypted and pinned */
  encryptedAt: ISOTimestamp,
  /** Whether this chunk hash has been anchored on EvidenceRegistry.sol */
  isAnchoredOnChain: z.boolean().default(false),
  /** Polygon L2 transaction hash of the anchoring transaction (if anchored) */
  anchorTxHash: TxHash.optional(),
  schemaVersion: z.literal('1.0.0'),
});

export type EncryptedEvidenceRecord = z.infer<typeof EncryptedEvidenceRecordSchema>;

// ---------------------------------------------------------------------------
// 3. SOSAlertPacket
//    The dispatch payload signed by the user's ERC-4337 Smart Account.
//    Raw Base91 serialization MUST be <140 bytes for Rail B SMS compliance.
// ---------------------------------------------------------------------------

export const SOSAlertPacketSchema = z.object({
  /** Unique packet ID (UUID v4) */
  packetId: UUIDv4,
  /** Parent incident ID */
  incidentId: UUIDv4,
  /** ISO 8601 timestamp of packet creation */
  createdAt: ISOTimestamp,
  /** Dispatch trigger mode */
  triggerMode: z.enum(TRIGGER_MODE_VALUES),
  /** Current SOS lifecycle state */
  status: z.enum(SOS_STATUS_VALUES),
  /**
   * Base91-compressed payload for Rail B SMS fallback.
   * SKILL.MD rule: raw serialized payload MUST be <140 bytes
   * so Base91 encoding fits within a 160-character GSM-7 SMS segment.
   */
  smsBase91Payload: Base91String,
  /**
   * ECDSA/secp256k1 signature of SHA-256(packetId + incidentId + createdAt)
   * signed by the user's ERC-4337 Smart Account key.
   */
  smartAccountSignature: z
    .string()
    .regex(/^0x[0-9a-fA-F]{130}$/)
    .describe('ECDSA 65-byte signature (r + s + v) as hex'),
  /** ERC-4337 Smart Account address of the signer */
  signerAddress: EthAddress,
  /** Active dispatch rails and their delivery statuses */
  dispatchRails: z
    .array(
      z.object({
        rail: z.enum(DISPATCH_RAIL_VALUES),
        status: z.enum(DISPATCH_STATUS_VALUES),
        /** ISO 8601 timestamp when this rail was attempted */
        attemptedAt: ISOTimestamp.optional(),
        /** ISO 8601 timestamp when ACK was received */
        acknowledgedAt: ISOTimestamp.optional(),
        /** Rail A: WebSocket session ID; Rail B: Twilio MessageSid */
        railTrackingId: z.string().max(128).optional(),
      })
    )
    .min(1)
    .max(3),
  /** Quantized spatial bucket (no raw GPS in packet) */
  spatialBucket: Geohash6,
  /** EvidenceRegistry.sol session Merkle root (on-chain reference) */
  evidenceMerkleRoot: SHA256Hex,
  schemaVersion: z.literal('1.0.0'),
});

export type SOSAlertPacket = z.infer<typeof SOSAlertPacketSchema>;

// ---------------------------------------------------------------------------
// 4. ZKProofSubmission
//    Groth16 proof from AnonymousBystanderReportVerifier_v2.circom.
//    Public inputs match ZKReportVerifier.sol's verifyProof() interface.
// ---------------------------------------------------------------------------

export const ZKProofSubmissionSchema = z.object({
  /** Unique submission ID */
  submissionId: UUIDv4,
  /** ISO 8601 timestamp of proof submission */
  submittedAt: ISOTimestamp,
  /**
   * Groth16 proof components (BN128 elliptic curve points).
   * pi_a: G1 point [x, y]
   * pi_b: G2 point [[x1,x2],[y1,y2]]
   * pi_c: G1 point [x, y]
   */
  proof: z.object({
    pi_a: z.tuple([BN128Hex, BN128Hex]),
    pi_b: z.tuple([z.tuple([BN128Hex, BN128Hex]), z.tuple([BN128Hex, BN128Hex])]),
    pi_c: z.tuple([BN128Hex, BN128Hex]),
  }),
  /**
   * Public inputs matching ZKReportVerifier.sol's verifyProof() signature.
   * SKILL.MD rule: NullifierHash = Poseidon(identitySecret, incidentID)
   */
  publicInputs: z.object({
    /**
     * Poseidon(identitySecret, incidentID) — one report per identity per incident.
     * Stored in nullifierHashes mapping on ZKReportVerifier.sol to prevent double-report.
     */
    poseidonNullifierHash: SHA256Hex,
    /** Geohash-6 spatial bucket matching the circuit's quantized input */
    geohashBucket: Geohash6,
    /** BNS section code (e.g. 'BNS_74') mapped from the incident category */
    incidentCategoryCode: z.enum(BNS_SECTION_VALUES),
    /**
     * Unix epoch hour (timestamp / 3600, integer) for 1-hour anonymity window.
     * Prevents exact timestamp correlation while preserving temporal context.
     */
    timestampBucketEpochHour: z.number().int().nonnegative(),
  }),
  /** Polygon L2 transaction hash of the AnonymousReportLogged event (post-submission) */
  onChainTxHash: TxHash.optional(),
  /** Whether the nullifier has been verified as unspent on-chain */
  isNullifierVerified: z.boolean().default(false),
  /** ZKey file version / trusted setup identifier */
  zkeyVersion: z.string().min(1).max(64),
  schemaVersion: z.literal('1.0.0'),
});

export type ZKProofSubmission = z.infer<typeof ZKProofSubmissionSchema>;

// ---------------------------------------------------------------------------
// 5. eFIRRecord
//    Automated e-FIR filing under BNSS §173.
//    SKILL.MD canonical rule:
//      - signDeadline = createdAt + 72 hours (259,200 seconds) — STATUTORY
//      - ngoEarlyWarningAt = createdAt + 48 hours — OPTIONAL configurable webhook
// ---------------------------------------------------------------------------

export const EFIRRecordSchema = z.object({
  /** Unique eFIR record identifier */
  efirId: UUIDv4,
  /** Parent SOS incident identifier */
  incidentId: UUIDv4,
  /** ISO 8601 timestamp when the eFIR was auto-generated */
  createdAt: ISOTimestamp,
  /**
   * BNSS §173 statutory 72-hour signing deadline.
   * MUST equal createdAt + 259,200 seconds.
   * Enforced in ComplaintEscrow.sol's signDeadline field.
   */
  signDeadlineAt: ISOTimestamp,
  /**
   * Optional 48-hour NGO early-warning webhook timestamp.
   * Deployment-configurable; not a statutory requirement.
   */
  ngoEarlyWarningAt: ISOTimestamp.optional(),
  /** Current eFIR lifecycle status */
  status: z.enum(EFIR_STATUS_VALUES),
  /**
   * BNS sections alleged — mapped from multilingual NLP classifier (FR-EV-004).
   * At least one BNS section must be identified.
   */
  allegedBNSSections: z.array(z.enum(BNS_SECTION_VALUES)).min(1),
  /**
   * ISO 639-1 language code of the original witness/victim audio.
   * One of the 22 Eighth Schedule Indian languages.
   */
  originalLanguageCode: z.string().length(2),
  /**
   * SHA-256 hash of the transcription — NOT the raw transcript text (DPDP Act).
   * Raw text is encrypted and stored in IPFS/Filecoin only.
   */
  transcriptHash: SHA256Hex,
  /**
   * IPFS CIDv1 pointing to the encrypted (AES-256-GCM) transcript blob.
   * No cleartext PII in the database record.
   */
  encryptedTranscriptCID: IPFSCIDv1,
  /** ComplaintEscrow.sol on-chain escrow identifier */
  escrowContractId: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .describe('bytes32 escrow ID on ComplaintEscrow.sol')
    .optional(),
  /** Polygon L2 tx hash of initEscrow() call */
  escrowInitTxHash: TxHash.optional(),
  /** ISO 8601 timestamp when survivor digitally signed (Aadhaar e-Sign) */
  signedAt: ISOTimestamp.optional(),
  /** SHA-256 hash of the Aadhaar e-Sign token (NOT the token itself) */
  aadhaarSignHash: SHA256Hex.optional(),
  /** ISO 8601 timestamp when police SHO/SP acknowledged receipt */
  acknowledgedAt: ISOTimestamp.optional(),
  /** Whether §173(4) SP + NGO dossier has been dispatched */
  isEscalatedToSP: z.boolean().default(false),
  /** ISO 8601 timestamp of §173(4) escalation (if escalated) */
  escalatedAt: ISOTimestamp.optional(),
  schemaVersion: z.literal('1.0.0'),
}).refine(
  (data) => {
    // Enforce: signDeadlineAt must be createdAt + exactly 72 hours (±30s tolerance)
    const created = new Date(data.createdAt).getTime();
    const deadline = new Date(data.signDeadlineAt).getTime();
    const diffSeconds = (deadline - created) / 1_000;
    return Math.abs(diffSeconds - BNSS_173_DEADLINE_SECONDS) <= 30;
  },
  {
    message: `signDeadlineAt MUST be exactly ${BNSS_173_DEADLINE_SECONDS}s (72 hours) after createdAt per BNSS §173`,
    path: ['signDeadlineAt'],
  }
).refine(
  (data) => {
    // If ngoEarlyWarningAt is set, it must be before signDeadlineAt
    if (!data.ngoEarlyWarningAt) return true;
    return new Date(data.ngoEarlyWarningAt) < new Date(data.signDeadlineAt);
  },
  {
    message: 'ngoEarlyWarningAt must be before signDeadlineAt',
    path: ['ngoEarlyWarningAt'],
  }
);

export type EFIRRecord = z.infer<typeof EFIRRecordSchema>;

// ---------------------------------------------------------------------------
// 6. BSA63CertificatePack
//    Cryptographically signed certificate under Bharatiya Sakshya Adhiniyam §63.
//    Contains hardware attestation, hash chains, IPFS status, and L2 receipts.
// ---------------------------------------------------------------------------

export const BSA63CertificatePackSchema = z.object({
  /** Unique certificate pack identifier */
  certId: UUIDv4,
  /** Parent incident identifier */
  incidentId: UUIDv4,
  /** Parent eFIR record identifier */
  efirId: UUIDv4,
  /** ISO 8601 timestamp of certificate generation */
  generatedAt: ISOTimestamp,

  /** Hardware Trusted Execution Environment (TEE) attestation */
  teeAttestation: z.object({
    /**
     * Android StrongBox | iOS Secure Enclave | AWS Nitro TEE
     */
    teeType: z.enum(['ANDROID_STRONGBOX', 'IOS_SECURE_ENCLAVE', 'AWS_NITRO']),
    /** TEE-specific attestation certificate chain (base64 DER) */
    attestationCertChainBase64: z.array(z.string().min(32)).min(1).max(5),
    /** SHA-256 digest of the device's OS build fingerprint */
    osBuildFingerprintHash: SHA256Hex,
    /** Android SecurityLevel or iOS Secure Enclave descriptor */
    securityLevel: z.string().min(1).max(64),
  }),

  /** OS and device metadata (hashed, no raw device identifiers) */
  deviceMetadata: z.object({
    /** SHA-256 hash of Android Build.FINGERPRINT / iOS systemVersion */
    osFingerprintHash: SHA256Hex,
    /** SHA-256 hash of app package name + version string */
    appVersionHash: SHA256Hex,
  }),

  /** SHA-256 incremental hash chain over all plaintext chunk digests */
  evidenceHashChain: z.object({
    /** Ordered array of SHA-256 plaintext chunk digests */
    chunkDigests: z.array(SHA256Hex).min(1).max(1_000),
    /** Final cumulative SHA-256 chain root (SHA256 of all chunkDigests concatenated) */
    chainRoot: SHA256Hex,
    /** Total number of chunks in the chain */
    totalChunks: z.number().int().positive(),
  }),

  /** IPFS/Filecoin pinning consensus status */
  ipfsPinStatus: z.object({
    /** IPFS CIDv1 of the encrypted evidence bundle */
    bundleCID: IPFSCIDv1,
    /** Number of Filecoin storage deal confirmations */
    filecoinDealCount: z.number().int().nonnegative(),
    /** ISO 8601 timestamp of last successful pin health check */
    lastPinCheckAt: ISOTimestamp,
    /** Whether Pinata confirms the CID is actively pinned */
    isPinned: z.boolean(),
  }),

  /** Polygon L2 on-chain transaction receipts */
  polygonReceipts: z.array(
    z.object({
      /** Contract involved */
      contractName: z.enum([
        'EvidenceRegistry',
        'SOSLog',
        'ComplaintEscrow',
        'ZKReportVerifier',
      ]),
      /** Transaction hash on Polygon L2 */
      txHash: TxHash,
      /** Block number */
      blockNumber: z.number().int().positive(),
      /** ISO 8601 block timestamp */
      blockTimestamp: ISOTimestamp,
    })
  ).min(1),

  /**
   * PDF/A-3 document CID — the legally-admissible BSA §63 certificate PDF.
   * Generated by packages/backend (FR-EV-007).
   */
  pdfA3CID: IPFSCIDv1,
  /**
   * JSON-LD certificate CID for structured legal data interoperability.
   */
  jsonLdCID: IPFSCIDv1,

  /**
   * ECDSA signature over SHA-256(certId + incidentId + chainRoot + pdfA3CID)
   * by the She-Raksha backend signing key (held in AWS Nitro TEE).
   */
  platformSignature: z
    .string()
    .regex(/^0x[0-9a-fA-F]{130}$/)
    .describe('65-byte ECDSA platform signature as hex'),
  /** EVM address of the She-Raksha platform signing key */
  platformSignerAddress: EthAddress,

  schemaVersion: z.literal('1.0.0'),
});

export type BSA63CertificatePack = z.infer<typeof BSA63CertificatePackSchema>;

// ---------------------------------------------------------------------------
// Schema registry — convenience map for programmatic access
// ---------------------------------------------------------------------------

export const SCHEMA_REGISTRY = {
  IncidentCapturePayload: IncidentCapturePayloadSchema,
  EncryptedEvidenceRecord: EncryptedEvidenceRecordSchema,
  SOSAlertPacket: SOSAlertPacketSchema,
  ZKProofSubmission: ZKProofSubmissionSchema,
  EFIRRecord: EFIRRecordSchema,
  BSA63CertificatePack: BSA63CertificatePackSchema,
} as const;

export type SchemaName = keyof typeof SCHEMA_REGISTRY;
