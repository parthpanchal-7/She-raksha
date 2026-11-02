/**
 * @she-raksha/sdk — Typed Contract Bindings Integration Tests
 *
 * Verifies typed viem services for all 6 core Polygon L2 smart contracts:
 *  1. EvidenceRegistryService
 *  2. SOSLogService
 *  3. ComplaintEscrowService
 *  4. ZKReportVerifierService
 *  5. GuardianRegistryService
 *  6. AccessGrantService
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { type Hex } from 'viem';

import {
  EvidenceRegistryService,
  SOSLogService,
  ComplaintEscrowService,
  ZKReportVerifierService,
  GuardianRegistryService,
  AccessGrantService,
  GranteeRole,
  POLYGON_AMOY_CONFIG,
} from '../index.js';

describe('Typed viem Contract Services Module', () => {
  const contracts = POLYGON_AMOY_CONFIG.contracts;

  it('EvidenceRegistryService: encodes anchorEvidence and anchorSessionMerkleRoot', () => {
    const service = new EvidenceRegistryService(contracts.evidenceRegistry);

    const sessionId = `0x${'1'.repeat(64)}` as Hex;
    const chunkId = `0x${'2'.repeat(64)}` as Hex;
    const chunkHash = `0x${'3'.repeat(64)}` as Hex;
    const ipfsCID = 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi';

    const calldata = service.encodeAnchorEvidence({
      sessionId,
      chunkId,
      chunkHash,
      ipfsCID,
    });

    assert.ok(calldata.startsWith('0x'));
    assert.ok(calldata.length > 10);

    const merkleCalldata = service.encodeAnchorSessionMerkleRoot({
      sessionId,
      merkleRoot: chunkHash,
      chunkCount: 120n,
      ipfsCID,
    });

    assert.ok(merkleCalldata.startsWith('0x'));
    assert.ok(merkleCalldata.length > 10);
  });

  it('SOSLogService: encodes notarizeDistress and offline queue replay', () => {
    const service = new SOSLogService(contracts.sosLog);

    const incidentHash = `0x${'4'.repeat(64)}` as Hex;
    const rootMerkleTree = `0x${'5'.repeat(64)}` as Hex;

    const notarizeCalldata = service.encodeNotarizeDistress({
      incidentHash,
      rootMerkleTree,
    });
    assert.ok(notarizeCalldata.startsWith('0x'));

    const replayCalldata = service.encodeReplayOfflinePacket({
      incidentHash,
      rootMerkleTree,
      deviceTimestamp: 1714567890n,
    });
    assert.ok(replayCalldata.startsWith('0x'));

    const batchCalldata = service.encodeBatchReplayOfflinePackets([
      {
        incidentHash,
        rootMerkleTree,
        deviceTimestamp: 1714567890n,
        signature: '0x',
      },
    ]);
    assert.ok(batchCalldata.startsWith('0x'));
  });

  it('ComplaintEscrowService: encodes statutory 72-hr init, sign, and escalation', () => {
    const service = new ComplaintEscrowService(contracts.complaintEscrow);

    const complaintId = 101n;
    const incidentId = 202n;
    const efirHash = `0x${'6'.repeat(64)}` as Hex;
    const victim = '0x1234567890123456789012345678901234567890';

    const initCalldata = service.encodeInitEscrow({
      complaintId,
      incidentId,
      efirHash,
      victim,
    });
    assert.ok(initCalldata.startsWith('0x'));

    const signCalldata = service.encodeSignComplaint(complaintId, '0xabcdef');
    assert.ok(signCalldata.startsWith('0x'));

    const ackCalldata = service.encodeAcknowledgeComplaint(
      complaintId,
      `0x${'7'.repeat(64)}` as Hex
    );
    assert.ok(ackCalldata.startsWith('0x'));

    const escCalldata = service.encodeTrigger72HrEscalation(complaintId);
    assert.ok(escCalldata.startsWith('0x'));
  });

  it('ZKReportVerifierService: encodes 4-input and 6-input anonymous report submissions', () => {
    const service = new ZKReportVerifierService(contracts.zkReportVerifier);

    const dummyProof = {
      a: [1n, 2n] as [bigint, bigint],
      b: [
        [3n, 4n],
        [5n, 6n],
      ] as [[bigint, bigint], [bigint, bigint]],
      c: [7n, 8n] as [bigint, bigint],
    };

    const calldata4 = service.encodeSubmitAnonymousReport4(dummyProof, [
      111n,
      222n,
      333n,
      444n,
    ]);
    assert.ok(calldata4.startsWith('0x'));

    const calldata6 = service.encodeSubmitAnonymousReport6(dummyProof, [
      111n,
      222n,
      333n,
      444n,
      555n,
      666n,
    ]);
    assert.ok(calldata6.startsWith('0x'));
  });

  it('GuardianRegistryService: encodes registration, heartbeat renewal, and deregistration', () => {
    const service = new GuardianRegistryService(contracts.guardianRegistry);

    const geohashCommitment = `0x${'8'.repeat(64)}` as Hex;
    const pubKey = `0x${'9'.repeat(128)}` as Hex;

    const regCalldata = service.encodeRegisterGuardian(geohashCommitment, pubKey);
    assert.ok(regCalldata.startsWith('0x'));

    const updateCalldata = service.encodeUpdateGeohashCommitment(
      `0x${'a'.repeat(64)}` as Hex
    );
    assert.ok(updateCalldata.startsWith('0x'));

    const deregCalldata = service.encodeDeregisterGuardian();
    assert.ok(deregCalldata.startsWith('0x'));
  });

  it('AccessGrantService: encodes law enforcement & NGO casework delegations and revocations', () => {
    const service = new AccessGrantService(contracts.accessGrant);

    const vaultHash = `0x${'b'.repeat(64)}` as Hex;
    const officer = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const caseworker = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
    const envelope = `0x${'cc'.repeat(48)}` as Hex;
    const duration = 259200n; // 3 days

    const policeCalldata = service.encodeGrantLawEnforcement({
      vaultCIDHash: vaultHash,
      lawEnforcementOfficer: officer,
      encryptedKeyEnvelope: envelope,
      durationSeconds: duration,
    });
    assert.ok(policeCalldata.startsWith('0x'));

    const ngoCalldata = service.encodeGrantNGOCaseworker({
      vaultCIDHash: vaultHash,
      caseworker,
      encryptedKeyEnvelope: envelope,
      durationSeconds: duration,
    });
    assert.ok(ngoCalldata.startsWith('0x'));

    const revokeCalldata = service.encodeRevokeAccess(
      `0x${'d'.repeat(64)}` as Hex
    );
    assert.ok(revokeCalldata.startsWith('0x'));
  });
});
