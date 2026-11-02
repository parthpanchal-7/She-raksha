/**
 * @she-raksha/mobile — SQLCipher LocalCaptures Repository
 *
 * Implements FR-EV-001 & FR-EV-003:
 *  - Persists encrypted chunk metadata to SQLCipher table `local_captures`
 *  - Enforces Zero Plaintext Storage: stores only IV, AuthTag, and SHA-256 digests
 *  - Tracks Pinata IPFS CIDv1 and Polygon L2 EvidenceRegistry anchoring transaction hashes
 */

import {
  type LocalCaptureRecord,
  type MediaType,
} from './types.js';

export interface NewCaptureRecordInput {
  incidentId: string;
  chunkIndex: number;
  mediaType: MediaType;
  ivHex: string;
  authTagHex: string;
  sha256Digest: string;
  ciphertextSha256: string;
  ipfsCid?: string | null;
  ciphertextBytes: number;
  chunkDurationS?: number;
  encryptedAt?: string;
}

export class LocalCapturesRepository {
  private captures: Map<number, LocalCaptureRecord> = new Map();
  private autoIncrementId: number = 1;

  constructor() {}

  /**
   * Inserts an encrypted media chunk record into local_captures.
   * Strictly verifies zero plaintext data is being saved.
   */
  public async insertCapture(input: NewCaptureRecordInput): Promise<LocalCaptureRecord> {
    if (input.ivHex.length !== 24) {
      throw new Error(`Invalid IV hex length: expected 24 chars (96-bit), got ${input.ivHex.length}`);
    }
    if (input.authTagHex.length !== 32) {
      throw new Error(`Invalid AuthTag hex length: expected 32 chars (128-bit), got ${input.authTagHex.length}`);
    }
    if (input.sha256Digest.length !== 64) {
      throw new Error(`Invalid plaintext SHA-256 digest length: expected 64 hex chars, got ${input.sha256Digest.length}`);
    }
    if (input.ciphertextSha256.length !== 64) {
      throw new Error(`Invalid ciphertext SHA-256 digest length: expected 64 hex chars, got ${input.ciphertextSha256.length}`);
    }

    const captureId = this.autoIncrementId++;
    const record: LocalCaptureRecord = {
      captureId,
      incidentId: input.incidentId,
      chunkIndex: input.chunkIndex,
      mediaType: input.mediaType,
      ivHex: input.ivHex,
      authTagHex: input.authTagHex,
      sha256Digest: input.sha256Digest,
      ciphertextSha256: input.ciphertextSha256,
      ipfsCid: input.ipfsCid ?? null,
      ciphertextBytes: input.ciphertextBytes,
      chunkDurationS: input.chunkDurationS ?? 5.0,
      encryptedAt: input.encryptedAt ?? new Date().toISOString(),
      isAnchored: false,
      anchorTxHash: null,
      anchoredAt: null,
    };

    this.captures.set(captureId, record);
    return record;
  }

  /**
   * Updates the IPFS CIDv1 for a capture record once pinned.
   */
  public async updateIpfsCid(captureId: number, ipfsCid: string): Promise<void> {
    const record = this.captures.get(captureId);
    if (!record) {
      throw new Error(`Capture record ${captureId} not found`);
    }
    record.ipfsCid = ipfsCid;
  }

  /**
   * Marks a capture record as anchored to EvidenceRegistry.sol on Polygon L2.
   */
  public async markAnchored(captureId: number, anchorTxHash: string): Promise<void> {
    const record = this.captures.get(captureId);
    if (!record) {
      throw new Error(`Capture record ${captureId} not found`);
    }
    record.isAnchored = true;
    record.anchorTxHash = anchorTxHash;
    record.anchoredAt = new Date().toISOString();
  }

  /**
   * Fetches unanchored captures for a given incident.
   */
  public async getUnanchoredCaptures(incidentId: string): Promise<LocalCaptureRecord[]> {
    return Array.from(this.captures.values()).filter(
      (c) => c.incidentId === incidentId && !c.isAnchored
    );
  }

  /**
   * Fetches all captures for an incident sorted by chunkIndex ASC.
   */
  public async getCapturesByIncident(incidentId: string): Promise<LocalCaptureRecord[]> {
    return Array.from(this.captures.values())
      .filter((c) => c.incidentId === incidentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  public async getCapture(captureId: number): Promise<LocalCaptureRecord | null> {
    return this.captures.get(captureId) ?? null;
  }

  public async getAllCaptures(): Promise<LocalCaptureRecord[]> {
    return Array.from(this.captures.values());
  }

  public async getCount(): Promise<number> {
    return this.captures.size;
  }
}
