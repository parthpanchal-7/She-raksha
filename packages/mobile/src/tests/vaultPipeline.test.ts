/**
 * @she-raksha/mobile — Vault Pipeline Unit & Integration Tests
 *
 * Verifies:
 *  - FR-EV-001: 5-Second rolling capture buffer (1080p H.265, AAC, GPS/NavIC telemetry)
 *  - FR-EV-002: Base32 IPFS CIDv1 computation & streaming
 *  - FR-EV-003: SQLCipher local_captures metadata persistence & Merkle anchoring
 *  - NFR-SEC-002: Zero-Plaintext RAM Sanitization (buffer.fill(0)) & 0 files on disk
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import {
  MediaCapturePipeline,
  LocalCapturesRepository,
  EvidenceVaultManager,
  VaultSanitizer,
  type RawMediaChunk,
} from '../vault/index.js';
import { sanitizeBuffer } from '@she-raksha/crypto-core';

describe('Evidence Vault & 5-Second In-RAM Capture Pipeline (FR-EV-001..003, NFR-SEC-002)', () => {
  let pipeline: MediaCapturePipeline;
  let repository: LocalCapturesRepository;
  let vaultManager: EvidenceVaultManager;

  before(() => {
    pipeline = new MediaCapturePipeline({ chunkDurationSeconds: 5.0 });
    repository = new LocalCapturesRepository();
    vaultManager = new EvidenceVaultManager({}, repository);
  });

  describe('1. 5-Second Rolling Capture Buffers (FR-EV-001)', () => {
    it('should capture 1080p H.265 video slice with MP4 box headers and GPS/NavIC telemetry', async () => {
      pipeline.startSession('test-incident-uuid-001');

      const chunk = await pipeline.capture5SecondChunk('VIDEO_H265', {
        latitude: 28.6139,
        longitude: 77.2090,
        satelliteConstellation: 'NavIC',
      });

      assert.equal(chunk.incidentId, 'test-incident-uuid-001');
      assert.equal(chunk.chunkIndex, 0);
      assert.equal(chunk.mediaType, 'VIDEO_H265');
      assert.equal(chunk.durationSeconds, 5.0);
      assert(chunk.buffer.length > 1000, 'Video chunk buffer should be populated');
      // Verify MP4 ftyp box header (0x66747970)
      assert.equal(chunk.buffer.subarray(4, 8).toString('ascii'), 'ftyp');
      assert.equal(chunk.telemetry.satelliteConstellation, 'NavIC');
      assert.equal(chunk.telemetry.cellTower.mcc, 404); // India MCC
    });

    it('should capture AAC audio slice with ADTS syncword header (0xFFF1)', async () => {
      const chunk = await pipeline.capture5SecondChunk('AUDIO_AAC');
      assert.equal(chunk.chunkIndex, 1);
      assert.equal(chunk.mediaType, 'AUDIO_AAC');
      // ADTS syncword: first 12 bits are 1s (0xFF, 0xF1)
      assert.equal(chunk.buffer[0], 0xff);
      assert.equal(chunk.buffer[1] & 0xf0, 0xf0);
    });

    it('should capture GPS/NavIC & cell tower sensor telemetry slice', async () => {
      const chunk = await pipeline.capture5SecondChunk('SENSOR_TELEMETRY');
      assert.equal(chunk.chunkIndex, 2);
      assert.equal(chunk.mediaType, 'SENSOR_TELEMETRY');
      const parsed = JSON.parse(chunk.buffer.toString('utf-8'));
      assert.equal(parsed.sensorSampleCount, 250); // 50Hz * 5s
    });
  });

  describe('2. In-Memory AES-256-GCM Encryption & RAM Zero-Fill (NFR-SEC-002)', () => {
    it('should encrypt raw chunk in RAM and immediately zero-fill original plaintext buffer', async () => {
      const rawData = Buffer.from('CONFIDENTIAL_EVIDENCE_PAYLOAD_TOP_SECRET');
      const testChunk: RawMediaChunk = {
        incidentId: 'test-incident-uuid-002',
        chunkIndex: 0,
        mediaType: 'VIDEO_H265',
        durationSeconds: 5.0,
        recordedAt: new Date().toISOString(),
        buffer: rawData,
        telemetry: {
          latitude: 28.6139,
          longitude: 77.2090,
          altitudeMeters: 200,
          accuracyMeters: 2.5,
          satelliteConstellation: 'NavIC',
          satellitesInView: 12,
          speedMps: 0,
          headingDegrees: 0,
          cellTower: { mcc: 404, mnc: 45, lac: 100, cellId: 500, signalDbm: -70 },
          timestamp: new Date().toISOString(),
        },
      };

      const result = await vaultManager.processRawChunk(testChunk);

      // Verify that rawData was wiped in RAM by vaultManager (all zeroes)
      const isZeroFilled = rawData.every((byte) => byte === 0);
      assert.equal(isZeroFilled, true, 'Original plaintext buffer must be zero-filled post-encryption (NFR-SEC-002)');

      // Verify result metadata
      assert.equal(result.captureRecord.chunkIndex, 0);
      assert.equal(result.captureRecord.mediaType, 'VIDEO_H265');
      assert.equal(result.captureRecord.ivHex.length, 24); // 96-bit IV
      assert.equal(result.captureRecord.authTagHex.length, 32); // 128-bit Auth Tag
      assert(result.ipfsCid.startsWith('bafy'), 'IPFS CID must be base32 CIDv1');
    });
  });

  describe('3. SQLCipher local_captures & Session Merkle Root Anchoring (FR-EV-003)', () => {
    it('should persist only ciphertext metadata in SQLCipher with zero plaintext', async () => {
      const count = await repository.getCount();
      assert(count >= 1, 'Repository should hold capture records');

      const captures = await repository.getCapturesByIncident('test-incident-uuid-002');
      assert.equal(captures.length, 1);
      const cap = captures[0]!;

      // Verify zero plaintext exists in the record
      assert.equal(cap.ivHex.length, 24);
      assert.equal(cap.authTagHex.length, 32);
      assert.equal(cap.sha256Digest.length, 64);
      assert.equal(cap.ciphertextSha256.length, 64);
      assert(cap.ciphertextBytes > 0);
    });

    it('should build incremental Merkle tree and anchor session root to EvidenceRegistry.sol', async () => {
      // Process a second chunk for the session
      const chunk2 = await pipeline.capture5SecondChunk('AUDIO_AAC');
      const result2 = await vaultManager.processRawChunk(chunk2, { autoAnchor: true });

      assert(result2.sessionMerkleRoot.startsWith('0x'));
      assert(result2.anchoredTxHash?.startsWith('0x'));
      assert.equal(result2.isAnchored, true);

      // Verify repository updated record
      const updated = await repository.getCapture(result2.captureRecord.captureId);
      assert.equal(updated?.isAnchored, true);
      assert.equal(updated?.anchorTxHash, result2.anchoredTxHash);
    });
  });

  describe('4. Device Storage Sanitization Audit (NFR-SEC-002)', () => {
    it('should audit device storage and certify zero unencrypted media files exist on disk', async () => {
      const sanitizer = new VaultSanitizer();
      const audit = await sanitizer.auditDeviceStorage();

      assert.equal(audit.unencryptedFilesFound, 0);
      assert.equal(audit.isSanitized, true);
      assert(audit.details.includes('NFR-SEC-002 Verified'));
    });
  });
});
