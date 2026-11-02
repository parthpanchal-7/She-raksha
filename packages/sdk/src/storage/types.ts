/**
 * @she-raksha/sdk — Storage Types
 * Types and interfaces for Pinata IPFS/Filecoin Decentralized Storage
 */

export interface PinataConfig {
  /** Pinata JWT Bearer token */
  jwt?: string;
  /** Legacy Pinata API key */
  apiKey?: string;
  /** Legacy Pinata API secret */
  apiSecret?: string;
  /** Dedicated or public IPFS gateway URL */
  gatewayUrl?: string;
  /** Pinata REST API base URL (default: https://api.pinata.cloud) */
  apiBaseUrl?: string;
  /** Required replication threshold across distinct storage nodes (NFR-REL-003, default: 3) */
  minReplicationFactor?: number;
}

export interface PinataChunkMetadata {
  sessionId?: string;
  chunkIndex?: number;
  mediaType?: string;
  sha256Digest?: string;
  ivHex?: string;
  authTagHex?: string;
  customKeyvalues?: Record<string, string | number>;
}

export interface PinataUploadResult {
  /** Immutable base32 IPFS CIDv1 identifier (starts with 'bafy...') */
  cid: string;
  /** IPFS CIDv0 identifier (if provided by gateway) */
  cidV0?: string;
  /** Size in bytes of the uploaded encrypted blob */
  sizeBytes: number;
  /** ISO 8601 UTC timestamp of upload */
  timestamp: string;
  /** Whether the chunk is actively pinned */
  isPinned: boolean;
}

export interface PinHealthStatus {
  /** IPFS CID verified */
  cid: string;
  /** Whether the CID is actively pinned */
  isPinned: boolean;
  /** Number of confirmed geographic storage nodes holding the pin */
  nodeCount: number;
  /** Distinct geographic regions holding replicas (e.g. ['FRA1', 'NYC1', 'SGP1']) */
  regions: string[];
  /** Filecoin storage deal confirmations */
  filecoinDealsCount: number;
  /** Whether the replication factor meets NFR-REL-003 (>= 3 nodes) */
  replicationSatisfied: boolean;
  /** ISO 8601 UTC timestamp of verification */
  verifiedAt: string;
}

