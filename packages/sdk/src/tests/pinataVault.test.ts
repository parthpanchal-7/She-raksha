/**
 * @she-raksha/sdk — PinataVaultClient Integration Tests
 *
 * Verifies:
 *  - FR-EV-002: Encrypted AES-256-GCM chunk streaming to Pinata IPFS/Filecoin returning base32 CIDv1
 *  - NFR-REL-003: Multi-node replication factor check asserting >= 3 distinct nodes
 *  - Compatibility with @she-raksha/schemas IPFSCIDv1 validator regex
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { PinataVaultClient, MIN_REPLICATION_FACTOR } from '../index.js';

describe('Pinata Decentralized Vault Client Module', () => {
  const vaultClient = new PinataVaultClient();

  it('FR-EV-002: computes deterministic base32 CIDv1 starting with "bafy..."', () => {
    const chunkData = Buffer.from('5-second encrypted AES-256-GCM video chunk #001', 'utf-8');
    const cid = PinataVaultClient.computeCIDv1(chunkData);

    assert.ok(cid.startsWith('bafy'), `CIDv1 must start with 'bafy', got: ${cid}`);
    assert.ok(cid.length >= 46 && cid.length <= 128, `CIDv1 length ${cid.length} must be between 46 and 128`);
    // Assert compliance with base32 lowercase multibase regex
    assert.ok(/^(bafy[a-z2-7]+|bafk[a-z2-7]+|Qm[1-9A-HJ-NP-Za-km-z]+)$/.test(cid));
  });

  it('FR-EV-002: streams encrypted chunk and returns immutable CIDv1 upload result', async () => {
    // 5-second simulated encrypted chunk ciphertext (e.g. 500 KB)
    const encryptedChunk = randomBytes(512 * 1024);
    const sessionId = '550e8400-e29b-41d4-a716-446655440000';

    const result = await vaultClient.uploadEncryptedChunk(encryptedChunk, {
      sessionId,
      chunkIndex: 0,
      mediaType: 'VIDEO_H265',
      sha256Digest: 'a'.repeat(64),
      ivHex: 'b'.repeat(24),
      authTagHex: 'c'.repeat(32),
    });

    assert.ok(result.cid.startsWith('bafy'), `Uploaded CID must be base32 CIDv1, got: ${result.cid}`);
    assert.equal(result.sizeBytes, encryptedChunk.length);
    assert.equal(result.isPinned, true);
    assert.ok(new Date(result.timestamp).getTime() > 0);
  });

  it('NFR-REL-003: asserts replication factor >= 3 across distinct storage nodes', async () => {
    const chunkData = randomBytes(64 * 1024);
    const uploadResult = await vaultClient.uploadEncryptedChunk(chunkData);

    const health = await vaultClient.verifyPinHealth(uploadResult.cid);

    assert.equal(health.cid, uploadResult.cid);
    assert.equal(health.isPinned, true);
    assert.ok(
      health.nodeCount >= MIN_REPLICATION_FACTOR,
      `NFR-REL-003 VIOLATION: replication node count (${health.nodeCount}) must be >= ${MIN_REPLICATION_FACTOR}`
    );
    assert.ok(health.regions.length >= 2, 'Must replicate across multiple geographic regions');
    assert.equal(health.replicationSatisfied, true);
    assert.ok(health.filecoinDealsCount >= 0);
  });
});

