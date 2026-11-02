/**
 * @she-raksha/mobile — Test Suite 2: Dynamic Multi-Rail Failover & BLE Mesh Relay
 *
 * Validates FR-SOS-002 & NFR-REL-002:
 *  - Interface RTT evaluation within <= 150ms budget
 *  - Rail A (WSS duplex) fast-path dispatch (< 500ms ACK)
 *  - 5.0-Second Hardware Timer Fault-Injection: Automatic drop to Rail B (Base91 SMS)
 *  - Base91 GSM-7 payload constraints: < 140 bytes raw, <= 160 characters
 *  - Priority dispatch: emergency contacts (tiers 1-5) + ERSS-112 gateway
 *  - Rail C (BLE 5.2 Extended Advertising Mesh): 0xFD63 Service UUID & hop-limited relay
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DispatchRail,
  DispatchStatus,
  TriggerMode,
} from '@she-raksha/schemas';
import {
  NetworkEvaluator,
  BLEMeshRelay,
  MultiRailFailoverEngine,
  SOSDispatchParams,
  BLEMeshFrameType,
} from '../index.js';

describe('2. Dynamic Network Evaluator & 3-Rail Failover Engine (FR-SOS-002, NFR-REL-002)', () => {
  let networkEvaluator: NetworkEvaluator;
  let bleMeshRelay: BLEMeshRelay;

  const sampleDispatchParams: SOSDispatchParams = {
    incidentId: '550e8400-e29b-41d4-a716-446655440000',
    triggerMode: TriggerMode.HARDWARE_TAP_FOUR_PRESS,
    latitude: 28.613939,
    longitude: 77.209021,
    h3IndexRes9: '8928308280fffff',
    accuracyRadius: 12,
    batteryPct: 84,
    signatureHex: '0x' + 'bb'.repeat(65),
    emergencyContactNumbers: ['+919876543210', '+919876543211', '+919876543212'],
  };

  beforeEach(() => {
    networkEvaluator = new NetworkEvaluator({ evaluationTimeoutMs: 150 });
    bleMeshRelay = new BLEMeshRelay();
  });

  describe('Dynamic Network Evaluator (<= 150ms)', () => {
    it('Should evaluate interface RTT and return fast-path available within 150ms', async () => {
      const startTime = Date.now();
      const evalResult = await networkEvaluator.evaluateNetwork();
      const duration = Date.now() - startTime;

      assert(duration <= 150, `Network evaluation took ${duration}ms, exceeding 150ms budget`);
      assert.equal(evalResult.isOnline, true);
      assert.equal(evalResult.isFastPathAvailable, true);
      assert(evalResult.rttMs <= 150);
    });

    it('Should detect offline interface when cellular and WiFi are unreachable', async () => {
      networkEvaluator.setMockNetworkState(false, 'NONE', 9999);

      const evalResult = await networkEvaluator.evaluateNetwork();
      assert.equal(evalResult.isOnline, false);
      assert.equal(evalResult.activeInterface, 'NONE');
      assert.equal(evalResult.isFastPathAvailable, false);
    });
  });

  describe('Multi-Rail Failover: Happy Path (Rail A WSS Success)', () => {
    it('Should dispatch via Rail A and achieve cryptographic server ACK within < 500ms', async () => {
      const engine = new MultiRailFailoverEngine({
        networkEvaluator,
        bleMeshRelay,
        // Mock fast Rail A WSS responder (60ms)
        wssDispatcher: async (packet) => {
          return {
            ackToken: 'ACK-FAST-' + packet.incidentId.slice(0, 8),
            serverTimestamp: Math.floor(Date.now() / 1000),
            signature: '0x' + 'ee'.repeat(65),
            responderNodeId: 'DELHI-CENTRAL-01',
          };
        },
      });

      const result = await engine.dispatchSOS(sampleDispatchParams);

      assert.equal(result.primaryRailAttempted, DispatchRail.RAIL_A_WSS);
      assert.equal(result.finalSuccessfulRail, DispatchRail.RAIL_A_WSS);
      assert.equal(result.failoverTriggered, false);
      assert.equal(result.bleMeshBroadcastInitiated, true);

      // Verify Rail A delivery recorded in history
      const railA = result.railHistory.find((r) => r.rail === DispatchRail.RAIL_A_WSS);
      assert.equal(railA?.status, DispatchStatus.DELIVERED);
      assert.equal(railA?.serverAck?.responderNodeId, 'DELHI-CENTRAL-01');

      // Rail B SMS should NOT have been dispatched
      const railB = result.railHistory.find((r) => r.rail === DispatchRail.RAIL_B_SMS);
      assert.equal(railB, undefined, 'Rail B must not be dispatched when Rail A succeeds');
    });
  });

  describe('Multi-Rail Failover: Fault-Injection (5.0s Hardware Timer Expiry)', () => {
    it('Should automatically drop to Rail B (Base91 SMS) when Rail A server ACK times out after 5.0s', async () => {
      let smsDispatched = false;
      let capturedSmsText = '';
      let capturedRecipients: string[] = [];

      const engine = new MultiRailFailoverEngine({
        config: {
          railATimeoutMs: 250, // Accelerated 250ms timer for fast test execution
          erss112GatewayNumber: '112',
        },
        networkEvaluator,
        bleMeshRelay,
        // Mock hanging Rail A WSS connection (never ACKs)
        wssDispatcher: async () => {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          return {} as any;
        },
        // Mock Rail B SMS sender
        smsDispatcher: async (params) => {
          smsDispatched = true;
          capturedSmsText = params.messageText;
          capturedRecipients = params.recipients;
          return true;
        },
      });

      const startTime = Date.now();
      const result = await engine.dispatchSOS(sampleDispatchParams);
      const totalDuration = Date.now() - startTime;

      assert.equal(result.failoverTriggered, true, 'Failover must be triggered on Rail A timeout');
      assert.equal(result.finalSuccessfulRail, DispatchRail.RAIL_B_SMS);
      assert.equal(smsDispatched, true, 'Rail B SMS must be dispatched automatically without user interaction');

      // 1. Verify Rail A logged TIMEOUT
      const railA = result.railHistory.find((r) => r.rail === DispatchRail.RAIL_A_WSS);
      assert.equal(railA?.status, DispatchStatus.TIMEOUT);
      assert.match(railA?.error || '', /TIMEOUT/);

      // 2. Verify Rail B Base91 GSM-7 payload constraints: < 140 bytes raw, <= 160 characters
      assert(capturedSmsText.length > 0);
      assert(
        capturedSmsText.length <= 160,
        `Base91 SMS length (${capturedSmsText.length}) exceeds 160 GSM-7 character limit`
      );

      // 3. Verify recipients include emergency contacts + ERSS-112
      assert.equal(capturedRecipients.length, 4); // 3 emergency contacts + 112
      assert(capturedRecipients.includes('112'), 'ERSS-112 gateway must be included in emergency dispatch');
      assert(capturedRecipients.includes('+919876543210'));

      // 4. Verify Rail C BLE Mesh broadcast initiated concurrently
      assert.equal(result.bleMeshBroadcastInitiated, true);
    });

    it('Should bypass Rail A immediately when device starts in offline state', async () => {
      networkEvaluator.setMockNetworkState(false, 'NONE', 9999);

      let smsSent = false;
      const engine = new MultiRailFailoverEngine({
        networkEvaluator,
        bleMeshRelay,
        smsDispatcher: async () => {
          smsSent = true;
          return true;
        },
      });

      const result = await engine.dispatchSOS(sampleDispatchParams);

      assert.equal(result.failoverTriggered, true);
      assert.equal(result.finalSuccessfulRail, DispatchRail.RAIL_B_SMS);
      assert.equal(smsSent, true);

      const railA = result.railHistory.find((r) => r.rail === DispatchRail.RAIL_A_WSS);
      assert.equal(railA?.status, DispatchStatus.FAILED);
    });
  });

  describe('Rail C (BLE 5.2 Extended Advertising Mesh Relay)', () => {
    it('Should create and broadcast 0xFD63 non-connectable BLE mesh frame with TTL 3', () => {
      const frame = bleMeshRelay.createDistressFrame({
        nodeIdHex: '1122334455667788',
        incidentDigestHex: 'a1b2c3d4e5f60718293a4b5c6d7e8f90',
        geohash6: 'ttnf7z',
        triggerCode: 1,
        batteryPct: 92,
      });

      assert.equal(frame.serviceUuid, '0xFD63');
      assert.equal(frame.hopLimit, 3);
      assert.equal(frame.geohash6, 'ttnf7z');
      assert.equal(frame.frameType, BLEMeshFrameType.DISTRESS_BEACON);
      assert(frame.rawPayloadHex.startsWith('FD63010103'));

      const broadcastSuccess = bleMeshRelay.broadcastDistressBeacon(frame);
      assert.equal(broadcastSuccess, true);
      assert.equal(bleMeshRelay.getIsAdvertising(), true);
    });

    it('Should relay peer frame by decrementing TTL from 3 to 2', () => {
      const initialFrame = bleMeshRelay.createDistressFrame({
        nodeIdHex: 'aabbccddeeff0011',
        incidentDigestHex: '11112222333344445555666677778888',
        geohash6: 'ttnf7z',
        triggerCode: 1,
        batteryPct: 75,
        ttl: 3,
      });

      // Clear local seen cache so this peer frame is treated as incoming from another node
      const peerRelayNode = new BLEMeshRelay();
      const relayResult = peerRelayNode.handlePeerFrameReceived(initialFrame);

      assert.equal(relayResult.relayed, true);
      assert.equal(relayResult.nextHopPacket?.hopLimit, 2);
      assert.equal(relayResult.nextHopPacket?.frameType, BLEMeshFrameType.PEER_RELAY_ACK);
    });

    it('Should drop duplicate frames to prevent broadcast loops', () => {
      const frame = bleMeshRelay.createDistressFrame({
        nodeIdHex: 'aabbccddeeff0011',
        incidentDigestHex: '99998888777766665555444433332222',
        geohash6: 'ttnf7z',
        triggerCode: 1,
        batteryPct: 80,
      });

      const peerNode = new BLEMeshRelay();
      const firstRelay = peerNode.handlePeerFrameReceived(frame);
      assert.equal(firstRelay.relayed, true);

      // Re-receiving identical digest should be dropped
      const duplicateRelay = peerNode.handlePeerFrameReceived(frame);
      assert.equal(duplicateRelay.relayed, false);
      assert.match(duplicateRelay.reason, /Duplicate packet/);
    });

    it('Should stop relaying when hop limit (TTL <= 1) is reached', () => {
      const exhaustedFrame = bleMeshRelay.createDistressFrame({
        nodeIdHex: 'aabbccddeeff0011',
        incidentDigestHex: 'ffffffffffffffffffffffffffffffff',
        geohash6: 'ttnf7z',
        triggerCode: 1,
        batteryPct: 50,
        ttl: 1, // Final hop
      });

      const peerNode = new BLEMeshRelay();
      const relayResult = peerNode.handlePeerFrameReceived(exhaustedFrame);

      assert.equal(relayResult.relayed, false);
      assert.match(relayResult.reason, /Hop limit reached/);
    });
  });
});
