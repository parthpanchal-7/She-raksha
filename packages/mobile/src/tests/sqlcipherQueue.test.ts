/**
 * @she-raksha/mobile — Test Suite 3: SQLCipher Offline Queue & SOSLog.sol Sync
 *
 * Validates FR-SOS-005:
 *  - SQLCipher encrypted offline queue initialization with enclave key
 *  - In-RAM AES-256-GCM payload encryption (Zero-Plaintext on flash)
 *  - Priority queue scheduling: SOS_ALERT (Priority 1) before EVIDENCE_CHUNK
 *  - Network Reconnect: Automatic queue drain & batch anchoring to Polygon L2 SOSLog.sol
 *  - Exponential backoff with jitter on intermittent connection drops
 *  - Transition to DEAD_LETTER upon exceeding maxRetries
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { OfflinePayloadType, OfflineQueueStatus } from '@she-raksha/schemas';
import {
  SQLCipherQueue,
  SyncQueueWorker,
  NetworkEvaluator,
} from '../index.js';

describe('3. SQLCipher Offline Synchronization Queue (FR-SOS-005)', () => {
  const validEnclaveKeyHex = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  let queue: SQLCipherQueue;
  let networkEvaluator: NetworkEvaluator;

  beforeEach(() => {
    queue = new SQLCipherQueue({
      encryptionKeyHex: validEnclaveKeyHex,
      maxRetries: 3,
      baseBackoffSeconds: 1,
      maxBackoffSeconds: 10,
    });
    networkEvaluator = new NetworkEvaluator();
  });

  describe('SQLCipher Enclave Key Validation & Security Invariants', () => {
    it('Should require a 64-character hex key (32 bytes derived from device enclave)', () => {
      assert.throws(
        () => new SQLCipherQueue({ encryptionKeyHex: 'invalid-key' }),
        /must be a 64-character hex string/
      );
    });

    it('Should encrypt payload blob in RAM so no plaintext is stored in queue record', async () => {
      const secretPayload = {
        sessionUuid: '550e8400-e29b-41d4-a716-446655440000',
        latitude: 28.613939,
        longitude: 77.209021,
        survivorNote: 'Confidential distress signal',
      };

      const record = await queue.enqueue({
        payloadJson: secretPayload,
        payloadType: OfflinePayloadType.SOS_ALERT,
        incidentId: '550e8400-e29b-41d4-a716-446655440000',
        priority: 1,
      });

      assert.equal(record.status, OfflineQueueStatus.QUEUED);
      assert.equal(record.priority, 1);
      assert(record.payloadBytes > 0);

      // Verify payloadBlob does NOT contain the plaintext substring
      const rawBlobString = Buffer.from(record.payloadBlob).toString('utf8');
      assert.equal(rawBlobString.includes('Confidential distress signal'), false);

      // Verify payload can be cleanly decrypted in RAM
      const decrypted = await queue.decryptPayload(record);
      assert.deepEqual(decrypted, secretPayload);
    });

    it('Should order pending records by priority ASC (Priority 1 SOS_ALERT first)', async () => {
      // Enqueue telemetry (Priority 3)
      await queue.enqueue({
        payloadJson: { type: 'LOC_HEARTBEAT', lat: 28.61, lon: 77.2 },
        payloadType: OfflinePayloadType.EVIDENCE_CHUNK,
        priority: 3,
      });

      // Enqueue critical SOS_ALERT (Priority 1)
      await queue.enqueue({
        payloadJson: { type: 'CRITICAL_SOS', incidentId: 'sos-001' },
        payloadType: OfflinePayloadType.SOS_ALERT,
        priority: 1,
      });

      // Enqueue non-critical update (Priority 4)
      await queue.enqueue({
        payloadJson: { type: 'GUARDIAN_PING' },
        payloadType: OfflinePayloadType.GUARDIAN_UPDATE,
        priority: 4,
      });

      const pending = queue.getPendingRecords();
      assert.equal(pending.length, 3);
      assert.equal(pending[0].priority, 1, 'Priority 1 SOS_ALERT must be first');
      assert.equal(pending[1].priority, 3);
      assert.equal(pending[2].priority, 4);
    });
  });

  describe('SyncQueueWorker: Auto-Drain & Polygon L2 SOSLog.sol Anchoring', () => {
    it('Should stay idle and not attempt drain when network is offline', async () => {
      networkEvaluator.setMockNetworkState(false, 'NONE', 9999);

      let anchorInvoked = false;
      const worker = new SyncQueueWorker({
        queue,
        networkEvaluator,
        onChainAnchorer: async () => {
          anchorInvoked = true;
          return { txHash: '0x123', blockNumber: 100, anchoredCount: 1 };
        },
      });

      await queue.enqueue({
        payloadJson: { incidentId: 'sos-offline-1' },
        payloadType: OfflinePayloadType.SOS_ALERT,
      });

      const drainResult = await worker.drainQueue();

      assert.equal(drainResult.processedCount, 0);
      assert.equal(anchorInvoked, false);
      assert.equal(queue.getQueueStats().queued, 1);
    });

    it('Should automatically drain pending records and anchor to SOSLog.sol upon reconnect', async () => {
      networkEvaluator.setMockNetworkState(true, 'CELLULAR_5G', 45);

      let anchoredItemsCount = 0;
      let anchoredIncidentHashes: string[] = [];

      const worker = new SyncQueueWorker({
        queue,
        networkEvaluator,
        onChainAnchorer: async (items) => {
          anchoredItemsCount = items.length;
          anchoredIncidentHashes = items.map((i) => i.incidentHash);
          return {
            txHash: '0x' + 'aa'.repeat(32),
            blockNumber: 48921000,
            anchoredCount: items.length,
          };
        },
      });

      // Enqueue 2 offline SOS records
      await queue.enqueue({
        payloadJson: {
          rootMerkleTree: '0x' + '11'.repeat(32),
          signatureHex: '0x' + 'cc'.repeat(65),
        },
        payloadType: OfflinePayloadType.SOS_ALERT,
        incidentId: '550e8400-e29b-41d4-a716-446655440001',
      });

      await queue.enqueue({
        payloadJson: {
          rootMerkleTree: '0x' + '22'.repeat(32),
          signatureHex: '0x' + 'dd'.repeat(65),
        },
        payloadType: OfflinePayloadType.SOS_ALERT,
        incidentId: '550e8400-e29b-41d4-a716-446655440002',
      });

      const drainResult = await worker.drainQueue();

      assert.equal(drainResult.processedCount, 2);
      assert.equal(drainResult.deliveredCount, 2);
      assert.equal(drainResult.errors.length, 0);

      // Verify on-chain anchor invocation
      assert.equal(anchoredItemsCount, 2);
      assert(anchoredIncidentHashes[0].startsWith('0x550e8400e29b41d4a716446655440001'));

      // Verify queue records transitioned to DELIVERED
      const stats = queue.getQueueStats();
      assert.equal(stats.queued, 0);
      assert.equal(stats.delivered, 2);
    });

    it('Should increment retry count and calculate exponential backoff on anchoring failure', async () => {
      networkEvaluator.setMockNetworkState(true, 'WIFI', 30);

      const worker = new SyncQueueWorker({
        queue,
        networkEvaluator,
        onChainAnchorer: async () => {
          throw new Error('RPC_TIMEOUT: Polygon Amoy node unresponsive');
        },
      });

      const record = await queue.enqueue({
        payloadJson: { alert: 'test' },
        payloadType: OfflinePayloadType.SOS_ALERT,
        incidentId: '550e8400-e29b-41d4-a716-446655440000',
      });

      // Attempt 1 -> Fails
      const drain1 = await worker.drainQueue();
      assert.equal(drain1.retriedCount, 1);

      const recAfter1 = queue.getRecord(record.queueId!);
      assert.equal(recAfter1?.status, OfflineQueueStatus.RETRYING);
      assert.equal(recAfter1?.retryCount, 1);
      assert(recAfter1?.nextRetryAt !== undefined);
      assert.equal(recAfter1?.lastError, 'RPC_TIMEOUT: Polygon Amoy node unresponsive');

      // Attempt 2 -> Fails
      await worker.drainQueue();
      const recAfter2 = queue.getRecord(record.queueId!);
      assert.equal(recAfter2?.retryCount, 2);

      // Attempt 3 -> Reaches maxRetries (3) -> DEAD_LETTER
      const drain3 = await worker.drainQueue();
      assert.equal(drain3.deadLetterCount, 1);

      const recAfter3 = queue.getRecord(record.queueId!);
      assert.equal(recAfter3?.status, OfflineQueueStatus.DEAD_LETTER);
    });
  });
});
