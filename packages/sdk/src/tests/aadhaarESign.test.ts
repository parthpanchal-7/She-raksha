/**
 * @she-raksha/sdk — Aadhaar e-Sign Integration Tests
 *
 * Verifies:
 *  - FR-ID-004: Privacy-preserving ZK attribute-redacting Aadhaar e-Sign wrapper
 *  - DPDP Act 2023 zero-PII invariant: ZERO cleartext 12-digit Aadhaar number exposed
 *  - Statutory age qualification (age >= 18)
 *  - Unlinkable nullifier generation to eliminate Sybil claims
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { type Hex } from 'viem';

import { AadhaarESignWrapper } from '../index.js';

describe('Privacy-Preserving Aadhaar e-Sign Wrapper Module', () => {
  const efirHash = `0x${'a1'.repeat(32)}` as Hex;
  const complaintId = 42n;

  it('FR-ID-004: generates attribute-redacted signature without exposing cleartext Aadhaar number', async () => {
    const disclosure = await AadhaarESignWrapper.generateRedactedSignature({
      efirHash,
      complaintId,
      gender: 'F',
      stateCode: 'DL',
      age: 26,
    });

    assert.equal(disclosure.efirHash, efirHash);
    assert.equal(disclosure.complaintId, '42');
    assert.equal(disclosure.isAgeAbove18, true);
    assert.equal(disclosure.gender, 'F');
    assert.equal(disclosure.stateCode, 'DL');
    assert.ok(disclosure.aadhaarSignHash.startsWith('0x'));
    assert.equal(disclosure.aadhaarSignHash.length, 66); // 32 bytes hex
    assert.ok(disclosure.nullifierHash.startsWith('0x'));
    assert.equal(disclosure.isVerified, true);

    // Invariant: Zero 12-digit cleartext Aadhaar number
    const serialized = JSON.stringify(disclosure);
    assert.ok(!/\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/.test(serialized), 'Must not contain 12-digit Aadhaar number');
    assert.ok(!serialized.includes('streetAddress'));
    assert.ok(!serialized.includes('dateOfBirth'));
  });

  it('verifies valid disclosure and rejects mismatched efirHash', async () => {
    const disclosure = await AadhaarESignWrapper.generateRedactedSignature({
      efirHash,
      complaintId,
    });

    const validResult = AadhaarESignWrapper.verifyRedactedDisclosure(disclosure, efirHash);
    assert.equal(validResult.isValid, true);
    assert.equal(validResult.hasRedactedCleartextPII, true);

    const wrongEfirHash = `0x${'b2'.repeat(32)}` as Hex;
    const invalidResult = AadhaarESignWrapper.verifyRedactedDisclosure(disclosure, wrongEfirHash);
    assert.equal(invalidResult.isValid, false);
  });

  it('rejects underage legal complaint execution (< 18)', async () => {
    await assert.rejects(
      async () => {
        await AadhaarESignWrapper.generateRedactedSignature({
          efirHash,
          complaintId,
          age: 16, // Underage
        });
      },
      {
        message: /at least 18 years of age/,
      }
    );
  });

  it('generates distinct unlinkable nullifiers across distinct complaints', async () => {
    const disclosure1 = await AadhaarESignWrapper.generateRedactedSignature({
      efirHash,
      complaintId: 101n,
      rawESignToken: 'shared-user-identity-secret-token',
    });

    const disclosure2 = await AadhaarESignWrapper.generateRedactedSignature({
      efirHash,
      complaintId: 102n,
      rawESignToken: 'shared-user-identity-secret-token',
    });

    // Same identity on different complaints yields distinct nullifiers (mathematical unlinkability)
    assert.notEqual(disclosure1.nullifierHash, disclosure2.nullifierHash);
  });
});
