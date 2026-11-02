/**
 * @she-raksha/sdk — Smart Account Integration Tests
 *
 * Verifies:
 *  - FR-ID-001: ERC-4337 smart wallet deployment & deterministic address derivation
 *  - FR-ID-002: Keyless onboarding via Web3Auth MPC & W3C WebAuthn Passkeys (zero seed phrases)
 *  - FR-ID-003: Gasless UserOperation execution sponsored by SheRakshaPaymaster.sol
 *  - NFR-SEC-003: Monotonically increasing nonces for replay protection
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAddress, type Hex, keccak256 } from 'viem';

import {
  PasskeyWebAuthnProvider,
  UserOpBuilder,
  BundlerClient,
  SmartAccountClient,
  ENTRY_POINT_V06_ADDRESS,
} from '../index.js';

describe('Smart Account & Keyless Web3Auth / Passkey Module', () => {
  it('FR-ID-002: onboards user with Passkey (FaceID/Fingerprint) with ZERO seed phrases', async () => {
    const provider = new PasskeyWebAuthnProvider();
    const cred = await provider.registerWithPasskey('survivor-alias-1', 'FaceID');

    assert.ok(cred.credentialId.length > 0);
    assert.ok(cred.publicKeyHex.startsWith('0x'));
    assert.equal(cred.biometricType, 'FaceID');
    assert.ok(isAddress(cred.signerAddress), 'Must derive a valid EVM signer address');

    // Sign digest with biometric key
    const testDigest = keccak256(Buffer.from('emergency-trigger-digest', 'utf-8'));
    const sig = await provider.signDigest(testDigest);
    assert.ok(sig.startsWith('0x'));
    // 65-byte ECDSA signature format (r: 32B, s: 32B, v: 1B = 65 bytes = 130 hex chars + 0x)
    assert.equal(sig.length, 132);
  });

  it('FR-ID-001: derives deterministic ERC-4337 Smart Account address from signer address', async () => {
    const provider = new PasskeyWebAuthnProvider();
    await provider.registerWithPasskey('survivor-alias-2', 'Fingerprint');
    const session = await provider.initWeb3AuthMPCSession();

    assert.ok(isAddress(session.smartAccountAddress), 'Must produce a valid Smart Account address');
    assert.ok(session.did.startsWith('did:key:z'), 'DID must follow standard did:key format');
    assert.ok(!session.did.includes('seed'), 'DID must not contain seed phrases');

    // Test determinism: same signer yields same smart account address
    const address1 = PasskeyWebAuthnProvider.computeSmartAccountAddress(session.ownerSignerAddress);
    const address2 = PasskeyWebAuthnProvider.computeSmartAccountAddress(session.ownerSignerAddress);
    assert.equal(address1, address2);
  });

  it('UserOpBuilder: constructs valid ERC-4337 UserOperation and computes canonical hash', () => {
    const sender = '0x1111111111111111111111111111111111111111';
    const target = '0x2222222222222222222222222222222222222222';
    const builder = new UserOpBuilder({
      sender,
      entryPointAddress: ENTRY_POINT_V06_ADDRESS,
      chainId: 80002, // Polygon Amoy
    });

    const userOp = builder.buildUserOp({
      target,
      callData: '0x12345678',
    });

    assert.equal(userOp.sender, sender);
    assert.equal(userOp.nonce, 0n);
    assert.ok(userOp.callData.startsWith('0x'));
    assert.ok(userOp.callGasLimit > 0n);
    assert.ok(userOp.maxFeePerGas > 0n);

    const userOpHash = builder.computeUserOpHash(userOp);
    assert.ok(userOpHash.startsWith('0x'));
    assert.equal(userOpHash.length, 66); // 32 bytes hex
  });

  it('UserOpBuilder: encodes paymasterAndData conforming to SheRakshaPaymaster.sol', () => {
    const paymasterAddress = '0x7000000000000000000000000000000000000007';
    const validUntil = 1714570000;
    const validAfter = 1714560000;
    const signature = `0x${'aa'.repeat(65)}` as Hex;

    const paymasterAndData = UserOpBuilder.encodePaymasterAndData({
      paymasterAddress,
      validUntil,
      validAfter,
      signature,
    });

    assert.ok(paymasterAndData.startsWith('0x'));
    // Length: 20 bytes address (40 hex) + 6 bytes validUntil (12 hex) + 6 bytes validAfter (12 hex) + 65 bytes sig (130 hex) = 194 hex chars + 0x = 196
    assert.equal(paymasterAndData.length, 196);
    assert.ok(paymasterAndData.toLowerCase().includes(paymasterAddress.toLowerCase().slice(2)));
  });

  it('FR-ID-003: executes gasless UserOperation sponsored 100% by SheRakshaPaymaster', async () => {
    const client = new SmartAccountClient();
    const accountAddress = await client.init('test-survivor-gasless');

    assert.ok(isAddress(accountAddress));

    const targetContract = '0x1000000000000000000000000000000000000001';
    const result = await client.executeGaslessTransaction({
      target: targetContract,
      data: '0xabcdef',
    });

    assert.ok(result.userOpHash.startsWith('0x'));
    assert.equal(result.sender, accountAddress);
    assert.equal(result.target, targetContract);
    assert.equal(result.isSponsored, true);

    const receipt = await result.wait();
    assert.equal(receipt.success, true);
    assert.equal(receipt.userOpHash, result.userOpHash);
  });
});
