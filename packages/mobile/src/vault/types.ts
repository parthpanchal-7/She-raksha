/**
 * @she-raksha/mobile — Evidence Vault Types
 *
 * Implements FR-EV-001, FR-EV-002, FR-EV-003, and NFR-SEC-002:
 *  - 5-Second rolling capture buffer for 1080p H.265 video, AAC audio, and GPS/NavIC telemetry
 *  - AES-256-GCM envelope encryption metadata
 *  - SQLCipher local_captures record definition
 *  - Session Merkle root tracking & ERC-4337 gasless anchoring
 */

import { type Address, type Hex } from 'viem';

export type MediaType = 'AUDIO_AAC' | 'VIDEO_H265' | 'SENSOR_TELEMETRY';

export interface GPSNavICTelemetry {
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  accuracyMeters: number;
  satelliteConstellation: 'GPS' | 'NavIC' | 'GLONASS' | 'HYBRID';
  satellitesInView: number;
  speedMps: number;
  headingDegrees: number;
  cellTower: {
    mcc: number;
    mnc: number;
    lac: number;
    cellId: number;
    signalDbm: number;
  };
  timestamp: string; // ISO 8601
}

export interface RawMediaChunk {
  incidentId: string;
  chunkIndex: number;
  mediaType: MediaType;
  durationSeconds: number;
  recordedAt: string;
  buffer: Buffer;
  telemetry: GPSNavICTelemetry;
}

export interface LocalCaptureRecord {
  captureId: number;
  incidentId: string;
  chunkIndex: number;
  mediaType: MediaType;
  ivHex: string; // 24 hex characters (96-bit IV)
  authTagHex: string; // 32 hex characters (128-bit auth tag)
  sha256Digest: string; // 64 hex characters (plaintext hash)
  ciphertextSha256: string; // 64 hex characters (ciphertext hash)
  ipfsCid: string | null; // Base32 CIDv1
  ciphertextBytes: number;
  chunkDurationS: number;
  encryptedAt: string;
  isAnchored: boolean;
  anchorTxHash: string | null;
  anchoredAt: string | null;
}

export interface SessionMerkleState {
  sessionId: Hex;
  chunkHashes: Hex[];
  merkleRoot: Hex;
  totalChunks: number;
  anchoredTxHash?: Hex;
  isAnchored: boolean;
}

export interface VaultPipelineConfig {
  sessionKey?: Buffer;
  masterEnclaveSecret?: Buffer;
  pinataClient?: any;
  smartAccountClient?: any;
  evidenceRegistryAddress?: Address;
  chunkDurationSeconds?: number;
  wipeRawBuffersImmediately?: boolean;
}

export interface VaultChunkProcessResult {
  captureRecord: LocalCaptureRecord;
  ipfsCid: string;
  sessionMerkleRoot: Hex;
  anchoredTxHash?: Hex;
  isAnchored: boolean;
}

export interface SanitizationAuditReport {
  timestamp: string;
  scannedDirectories: string[];
  unencryptedFilesFound: number;
  leakedFilePaths: string[];
  isSanitized: boolean;
  details: string;
}
