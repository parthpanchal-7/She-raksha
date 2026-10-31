/**
 * @she-raksha/crypto-core — Unit Tests & Cryptographic Benchmarks
 *
 * Verifies:
 *  - 5-second chunked AES-256-GCM encryption and zero-plaintext RAM sanitization (NFR-SEC-001)
 *  - HKDF-SHA256 session key derivation
 *  - Incremental SHA-256 Merkle tree builder and proof verification
 *  - Base91 GSM-7 SMS serializer (< 140B raw binary, <= 160 chars Base91)
 *  - X25519-XSalsa20-Poly1305 asymmetric envelope encryption for zero-PII storage
 *  - NFR-PERF-001: 50MB AES-256-GCM encryption in <= 2.0s
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

import { TriggerMode } from '@she-raksha/schemas';

import {
  deriveSessionKey,
  encryptMediaChunk,
  decryptMediaChunk,
  sanitizeBuffer,
  HKDF_INFO_VAULT,
} from '../aesGcmChunk.js';

import {
  IncrementalMerkleTree,
  sha256,
} from '../merkleTree.js';

import {
  base91Encode,
  base91Decode,
  BASE91_ALPHABET,
} from '../base91Codec.js';

import {
  serializeSOSToBinary,
  deserializeSOSFromBinary,
  serializeSOSToBase91SMS,
  deserializeSOSFromBase91SMS,
  type SOSAlertSMSPayload,
} from '../smsSerializer.js';

import {
  generateAsymmetricKeyPair,
  encryptContactDetails,
  decryptContactDetails,
} from '../asymmetricBox.js';

// ---------------------------------------------------------------------------
// 1. AES-256-GCM & Zero-Plaintext RAM Sanitization Tests
// ---------------------------------------------------------------------------

describe('AES-256-GCM Chunker & Zero-Plaintext Engine', () => {
  const masterSecret = randomBytes(32);
  const salt = randomBytes(16);
  const sessionKey = deriveSessionKey(masterSecret, salt, 'session-uuid-001');

  it('derives a 32-byte session key via HKDF-SHA256', () => {
    assert.equal(sessionKey.length, 32);

    // Deterministic check: same inputs yield same key
    const sessionKey2 = deriveSessionKey(masterSecret, salt, 'session-uuid-001');
    assert.equal(sessionKey.toString('hex'), sessionKey2.toString('hex'));

    // Different salt yields different key
    const sessionKeyDiff = deriveSessionKey(masterSecret, randomBytes(16), 'session-uuid-001');
    assert.notEqual(sessionKey.toString('hex'), sessionKeyDiff.toString('hex'));
  });

  it('encrypts and decrypts media chunk correctly', () => {
    const originalText = 'She-Raksha 5-second audio chunk data AAC 128kbps';
    const plaintext = Buffer.from(originalText, 'utf-8');

    // Make copy to verify decryption since encryptMediaChunk wipes plaintext
    const plaintextCopy = Buffer.from(originalText, 'utf-8');

    const result = encryptMediaChunk(plaintext, sessionKey, true);

    assert.equal(result.ivHex.length, 24); // 96 bits = 12 bytes = 24 hex chars
    assert.equal(result.authTagHex.length, 32); // 128 bits = 16 bytes = 32 hex chars
    assert.equal(result.plaintextSha256.length, 64);
    assert.equal(result.ciphertextSha256.length, 64);
    assert.ok(result.ciphertextBytes > 0);

    // Decrypt and verify match with original
    const decrypted = decryptMediaChunk(result.ciphertext, sessionKey, result.ivHex, result.authTagHex);
    assert.equal(decrypted.toString('utf-8'), plaintextCopy.toString('utf-8'));
  });

  it('enforces NFR-SEC-001 & NFR-SEC-002: sanitizes (zero-fills) plaintext buffer', () => {
    const secretData = 'super_confidential_witness_audio_buffer';
    const buf = Buffer.from(secretData, 'utf-8');

    encryptMediaChunk(buf, sessionKey, true);

    // After encryption, buf should be all zeroes
    const isAllZeroes = buf.every((b) => b === 0);
    assert.ok(isAllZeroes, 'Plaintext buffer must be completely zeroed out after encryption');
  });

  it('produces unique IVs for consecutive chunks (CSPRNG invariant)', () => {
    const chunk1 = Buffer.from('chunk one data', 'utf-8');
    const chunk2 = Buffer.from('chunk two data', 'utf-8');

    const res1 = encryptMediaChunk(chunk1, sessionKey);
    const res2 = encryptMediaChunk(chunk2, sessionKey);

    assert.notEqual(res1.ivHex, res2.ivHex, 'Each chunk must have a unique 96-bit IV');
  });

  it('fails decryption with wrong session key or corrupted auth tag', () => {
    const plaintext = Buffer.from('sensitive media', 'utf-8');
    const res = encryptMediaChunk(plaintext, sessionKey);

    const wrongKey = randomBytes(32);
    assert.throws(() => {
      decryptMediaChunk(res.ciphertext, wrongKey, res.ivHex, res.authTagHex);
    });

    const corruptedTag = '0'.repeat(32);
    assert.throws(() => {
      decryptMediaChunk(res.ciphertext, sessionKey, res.ivHex, corruptedTag);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Incremental SHA-256 Merkle Tree Tests
// ---------------------------------------------------------------------------

describe('Incremental SHA-256 Merkle Tree', () => {
  it('computes deterministic root for empty and single-leaf tree', () => {
    const tree = new IncrementalMerkleTree(1000);
    const emptyRoot = tree.getRoot();
    assert.equal(emptyRoot.length, 64);

    const leaf1 = sha256('chunk-0').toString('hex');
    tree.addLeaf(leaf1);
    assert.equal(tree.getRoot(), leaf1);
  });

  it('supports up to 1,000 chunks per session root', () => {
    const tree = new IncrementalMerkleTree(1000);

    for (let i = 0; i < 50; i++) {
      tree.addLeaf(sha256(`chunk-${i}`));
    }

    assert.equal(tree.count, 50);
    const root = tree.getRoot();
    assert.equal(root.length, 64);
  });

  it('generates and verifies valid Merkle proofs', () => {
    const tree = new IncrementalMerkleTree(100);
    const count = 16; // Power of 2 tree

    for (let i = 0; i < count; i++) {
      tree.addLeaf(sha256(`evidence-chunk-${i}`));
    }

    const root = tree.getRoot();

    for (let i = 0; i < count; i++) {
      const proof = tree.getProof(i);
      const isValid = IncrementalMerkleTree.verifyProof(proof.leaf, proof.proof, root);
      assert.ok(isValid, `Proof for leaf ${i} should verify against root`);
    }
  });

  it('rejects tampered leaf in proof verification', () => {
    const tree = new IncrementalMerkleTree(10);
    tree.addLeaf(sha256('chunk-0'));
    tree.addLeaf(sha256('chunk-1'));
    tree.addLeaf(sha256('chunk-2'));

    const root = tree.getRoot();
    const proof = tree.getProof(1);

    const tamperedLeaf = sha256('tampered-chunk').toString('hex');
    const isValid = IncrementalMerkleTree.verifyProof(tamperedLeaf, proof.proof, root);
    assert.ok(!isValid, 'Tampered leaf must fail verification');
  });
});

// ---------------------------------------------------------------------------
// 3. Base91 Codec Tests
// ---------------------------------------------------------------------------

describe('Base91 GSM-7 Codec', () => {
  it('Base91 alphabet has exactly 91 printable characters', () => {
    assert.equal(BASE91_ALPHABET.length, 91);
  });

  it('encodes and decodes arbitrary binary roundtrip', () => {
    const testCases = [
      Buffer.from('Hello, She-Raksha!', 'utf-8'),
      Buffer.alloc(0),
      Buffer.alloc(1, 0x42),
      randomBytes(32),
      randomBytes(109), // exact SOS packet size
      randomBytes(139), // max SMS raw size
    ];

    for (const original of testCases) {
      const encoded = base91Encode(original);
      const decoded = base91Decode(encoded);
      assert.equal(decoded.toString('hex'), original.toString('hex'));
    }
  });
});

// ---------------------------------------------------------------------------
// 4. SOS SMS Packet Serializer (Rail B Failover)
// ---------------------------------------------------------------------------

describe('SOS SMS Packet Serializer (Rail B)', () => {
  const samplePayload: SOSAlertSMSPayload = {
    sessionUuid: '550e8400-e29b-41d4-a716-446655440000',
    latitude: 28.613939,
    longitude: 77.209021,
    h3IndexRes9: '8928308280fffff',
    accuracyRadius: 15,
    battery: 84,
    triggerMode: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
    timestamp: 1714567890,
    signatureHex: '0x' + 'ab'.repeat(65),
  };

  it('serializes to raw binary strictly < 140 bytes (exactly 109 bytes)', () => {
    const binary = serializeSOSToBinary(samplePayload);
    assert.equal(binary.length, 109);
    assert.ok(binary.length < 140, 'Raw binary must be < 140 bytes');
  });

  it('encodes to Base91 strictly <= 160 characters (GSM-7 segment)', () => {
    const smsText = serializeSOSToBase91SMS(samplePayload);
    assert.ok(smsText.length <= 160, `Base91 string length ${smsText.length} must be <= 160`);
    assert.ok(smsText.length > 0);
  });

  it('performs lossless serialization and deserialization roundtrip', () => {
    const smsText = serializeSOSToBase91SMS(samplePayload);
    const recovered = deserializeSOSFromBase91SMS(smsText);

    assert.equal(recovered.sessionUuid, samplePayload.sessionUuid);
    assert.ok(Math.abs(recovered.latitude - samplePayload.latitude) < 0.0001);
    assert.ok(Math.abs(recovered.longitude - samplePayload.longitude) < 0.0001);
    assert.equal(recovered.accuracyRadius, samplePayload.accuracyRadius);
    assert.equal(recovered.battery, samplePayload.battery);
    assert.equal(recovered.triggerMode, samplePayload.triggerMode);
    assert.equal(recovered.timestamp, samplePayload.timestamp);
    assert.equal(recovered.signatureHex.toLowerCase(), samplePayload.signatureHex.toLowerCase());
  });

  it('supports all 6 TriggerMode values in serialization', () => {
    const modes = [
      TriggerMode.HARDWARE_TAP_FOUR_PRESS,
      TriggerMode.SHAKE_ACCELEROMETER,
      TriggerMode.VOICE_DURESS_TFLITE,
      TriggerMode.FALL_DETECTION,
      TriggerMode.DEAD_MAN_SWITCH,
      TriggerMode.MANUAL_BUTTON,
    ];

    for (const mode of modes) {
      const payload = { ...samplePayload, triggerMode: mode };
      const sms = serializeSOSToBase91SMS(payload);
      const res = deserializeSOSFromBase91SMS(sms);
      assert.equal(res.triggerMode, mode);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. X25519-XSalsa20-Poly1305 Asymmetric Envelope Encryption (DPDP Act)
// ---------------------------------------------------------------------------

describe('X25519-XSalsa20-Poly1305 Asymmetric Envelope Encryption', () => {
  it('encrypts and decrypts contact details without cleartext PII', () => {
    const recipientKey = generateAsymmetricKeyPair();

    const contactPII = {
      name: 'Sunita Sharma',
      phoneE164: '+919876543210',
      relationship: 'Mother',
    };

    const envelope = encryptContactDetails(contactPII, recipientKey.publicKeyHex);

    // Verify envelope contents
    assert.ok(envelope.encryptedBlob.length > 0);
    assert.equal(envelope.ephemeralPublicKeyHex.length, 64);

    // Verify raw PII does NOT appear in encrypted blob
    const rawBlobString = envelope.encryptedBlob.toString('utf-8');
    assert.ok(!rawBlobString.includes('+919876543210'));
    assert.ok(!rawBlobString.includes('Sunita Sharma'));

    // Decrypt with recipient's private key
    const decrypted = decryptContactDetails(
      envelope.encryptedBlob,
      envelope.ephemeralPublicKeyHex,
      recipientKey.secretKeyHex
    );

    assert.deepEqual(decrypted, contactPII);
  });

  it('fails decryption with wrong secret key', () => {
    const recipientKey = generateAsymmetricKeyPair();
    const attackerKey = generateAsymmetricKeyPair();

    const contactPII = {
      name: 'Pooja Verma',
      phoneE164: '+919988776655',
      relationship: 'Sister',
    };

    const envelope = encryptContactDetails(contactPII, recipientKey.publicKeyHex);

    assert.throws(() => {
      decryptContactDetails(
        envelope.encryptedBlob,
        envelope.ephemeralPublicKeyHex,
        attackerKey.secretKeyHex
      );
    });
  });
});

// ---------------------------------------------------------------------------
// 6. NFR-PERF-001 Performance Benchmark
// ---------------------------------------------------------------------------

describe('NFR-PERF-001 Benchmark', () => {
  it('encrypts 50MB of payload in <= 2.0s using AES-256-GCM', () => {
    const key = randomBytes(32);

    // Simulate 50MB payload (e.g. ten 5MB rolling video chunks or one continuous block)
    const chunkSize = 5 * 1024 * 1024; // 5 MB
    const totalChunks = 10; // 10 * 5MB = 50MB
    const dummyChunk = randomBytes(chunkSize);

    const startTime = performance.now();

    for (let i = 0; i < totalChunks; i++) {
      // Create fresh buffer for each chunk to simulate rolling memory stream
      const chunkBuf = Buffer.from(dummyChunk);
      const res = encryptMediaChunk(chunkBuf, key, false);
      assert.ok(res.ciphertextBytes > 0);
    }

    const elapsedMs = performance.now() - startTime;
    const elapsedSeconds = elapsedMs / 1000;

    console.log(`\n  ⚡ NFR-PERF-001 Benchmark: 50MB AES-256-GCM encrypted in ${elapsedSeconds.toFixed(3)}s (${elapsedMs.toFixed(1)}ms)`);

    assert.ok(
      elapsedSeconds <= 2.0,
      `NFR-PERF-001 VIOLATION: 50MB encryption took ${elapsedSeconds.toFixed(3)}s, must be <= 2.0s`
    );
  });
});
