/**
 * @she-raksha/backend — Survivor to Institutional Real-Time Sync Unit Tests
 *
 * Verifies:
 *  1. AccessGrant.sol role-based authorization for institutional WebSocket channel
 *  2. Ingestion of IncidentCapturePayload -> persistence to sos_incidents and sos_dispatch_logs
 *  3. Real-time broadcast of ACTIVE_INCIDENT_DISPATCH event to authenticated institutional clients
 *  4. Ingestion of eFIRRecord -> persistence to efir_records and broadcast of NEW_EFIR_ESCROW event
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../server.js';
import { MemoryStore } from '../store/memoryStore.js';
import { SOSHub } from '../sos/sosHub.js';
import { TriggerMode } from '@she-raksha/schemas';

class MockWebSocket extends EventEmitter {
  public readyState: number = WebSocket.OPEN;
  public sentMessages: string[] = [];

  public send(data: string): void {
    this.sentMessages.push(data);
    this.emit('sent', data);
  }

  public close(): void {
    this.readyState = WebSocket.CLOSED;
    this.emit('close');
  }

  public receiveFromClient(data: string): void {
    this.emit('message', Buffer.from(data));
  }
}

describe('Survivor Portal to Institutional Dashboard Real-Time Sync', () => {
  let app: FastifyInstance;
  let store: MemoryStore;
  let sosHub: SOSHub;

  beforeEach(async () => {
    store = new MemoryStore();
    sosHub = new SOSHub({ store });
    app = await buildServer({ store, sosHub });
  });

  afterEach(async () => {
    sosHub.destroy();
    await app.close();
  });

  it('rejects institutional subscription if wallet address or AccessGrant role is invalid', async () => {
    const mockSocket = new MockWebSocket();
    sosHub.handleConnection(mockSocket as any);

    mockSocket.receiveFromClient(
      JSON.stringify({
        type: 'SUBSCRIBE_INSTITUTIONAL',
        walletAddress: 'invalid-eth-address',
        role: 'UNAUTHORIZED_CITIZEN',
      })
    );

    assert.equal(mockSocket.sentMessages.length, 1);
    const msg = JSON.parse(mockSocket.sentMessages[0]);
    assert.equal(msg.type, 'SOS_ERROR');
    assert.equal(msg.errorCode, 'ACCESS_GRANT_UNAUTHORIZED');
  });

  it('authenticates institutional client with valid AccessGrant role and confirms subscription', async () => {
    const mockSocket = new MockWebSocket();
    sosHub.handleConnection(mockSocket as any);

    mockSocket.receiveFromClient(
      JSON.stringify({
        type: 'SUBSCRIBE_INSTITUTIONAL',
        walletAddress: '0x1234567890123456789012345678901234567890',
        role: 'SHO',
        accessGrantSignature: '0xmockSignature',
      })
    );

    assert.equal(mockSocket.sentMessages.length, 1);
    const msg = JSON.parse(mockSocket.sentMessages[0]);
    assert.equal(msg.type, 'SUBSCRIPTION_CONFIRMED');
    assert.equal(msg.channel, 'INSTITUTIONAL_COMMAND_HUB');
    assert.equal(msg.role, 'SHO');
    assert.equal(msg.accessGrantValid, true);
    assert.equal(sosHub.getInstitutionalSubscriberCount(), 1);
  });

  it('broadcasts ACTIVE_INCIDENT_DISPATCH when IncidentCapturePayload is submitted', async () => {
    const mockSocket = new MockWebSocket();
    sosHub.handleConnection(mockSocket as any);

    // 1. Subscribe institutional client
    mockSocket.receiveFromClient(
      JSON.stringify({
        type: 'SUBSCRIBE_INSTITUTIONAL',
        walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        role: 'SP',
      })
    );

    assert.equal(mockSocket.sentMessages.length, 1);
    const subMsg = JSON.parse(mockSocket.sentMessages[0]);
    assert.equal(subMsg.type, 'SUBSCRIPTION_CONFIRMED');

    // 2. Submit IncidentCapturePayload via REST
    const incidentId = '11223344-5566-7788-99aa-bbccddeeff00';
    const validCID = 'bafybeieza2fffw4pd5ubhksbtoaudbnkcw4rhqdqlgc25iba7gtkla4jwq';
    const payload = {
      incidentId,
      userSmartAccountAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      triggeredAt: new Date().toISOString(),
      triggerMode: TriggerMode.MANUAL_BUTTON,
      sessionMerkleRoot: 'a'.repeat(64),
      totalChunks: 5,
      captureWindowSeconds: 25.0,
      spatialBucket: 'ttnf7z',
      sessionKeyId: '22334455-6677-8899-aabb-ccddeeff0011',
      evidenceChunkCIDs: [validCID],
      evidenceMerkleRoot: 'b'.repeat(64),
      schemaVersion: '1.0.0',
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/survivor/incident/capture',
      payload,
    });

    assert.equal(res.statusCode, 201);

    // Verify written to database
    const inc = await store.getIncident(incidentId);
    assert(inc !== undefined, 'Incident must be written to sos_incidents');
    assert.equal(inc?.incidentId, incidentId);

    const logs = await store.getDispatchLogsForIncident(incidentId);
    assert(logs.length > 0, 'Must write to sos_dispatch_logs');

    // 3. Verify event broadcast to institutional subscriber
    assert.equal(mockSocket.sentMessages.length, 2);
    const event = JSON.parse(mockSocket.sentMessages[1]);
    assert.equal(event.type, 'ACTIVE_INCIDENT_DISPATCH');
    assert.equal(event.incidentId, incidentId);
    assert.equal(typeof event.latitude, 'number');
    assert.equal(typeof event.longitude, 'number');
    assert.equal(event.severity, 'CRITICAL');
  });

  it('broadcasts NEW_EFIR_ESCROW when an eFIRRecord is generated', async () => {
    const mockSocket = new MockWebSocket();
    sosHub.handleConnection(mockSocket as any);

    mockSocket.receiveFromClient(
      JSON.stringify({
        type: 'SUBSCRIBE_INSTITUTIONAL',
        walletAddress: '0x9999999999999999999999999999999999999999',
        role: 'NGO_CASEWORKER',
      })
    );

    assert.equal(mockSocket.sentMessages.length, 1);
    const subMsg = JSON.parse(mockSocket.sentMessages[0]);
    assert.equal(subMsg.type, 'SUBSCRIPTION_CONFIRMED');

    // Trigger eFIR generation
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/legal/efir/generate',
      payload: {
        incidentId: randomUUID(),
        narrativeText: 'A man followed me and assaulted me in Connaught Place metro station.',
        langCodeHint: 'en',
        evidenceMerkleRoot: 'c'.repeat(64),
      },
    });

    assert.equal(res.statusCode, 201);
    const body = JSON.parse(res.payload);
    assert(body.efir !== undefined);

    // Verify written to efir_records
    const saved = await store.getEFIRRecord(body.efir.efirId);
    assert(saved !== undefined, 'eFIR record must be saved in efir_records table');

    // Verify NEW_EFIR_ESCROW broadcast
    assert.equal(mockSocket.sentMessages.length, 2);
    const event = JSON.parse(mockSocket.sentMessages[1]);
    assert.equal(event.type, 'NEW_EFIR_ESCROW');
    assert.equal(event.efirId, body.efir.efirId);
    assert(Array.isArray(event.bnsSections));
    assert.equal(event.hoursRemaining, 72);
  });
});
