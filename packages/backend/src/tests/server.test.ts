/**
 * @she-raksha/backend — Fastify Server End-to-End REST Tests
 *
 * Verifies:
 *  - Health & readiness probes
 *  - REST SOS trigger fallback
 *  - Guardian proximity matching endpoint
 *  - Safe-journey check-in endpoints
 *  - ERSS-112 CAD dispatch endpoint
 *  - Incident status & dispatch log retrieval
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { buildServer } from '../server.js';
import { FastifyInstance } from 'fastify';
import { TriggerMode, SOSStatus, DispatchRail, DispatchStatus } from '@she-raksha/schemas';
import { serializeSOSToBase91SMS, SOSAlertSMSPayload } from '@she-raksha/crypto-core';

describe('Fastify Server REST Endpoints', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildServer();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /health returns status UP and ISO timestamp', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.status, 'UP');
    assert.equal(body.version, '1.0.0');
    assert.ok(body.timestamp);
  });

  test('GET /ready returns dbConnected and active guardian count', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/ready',
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.status, 'READY');
    assert.equal(body.dbConnected, true);
    assert.ok(typeof body.activeGuardians === 'number');
  });

  test('POST /api/v1/sos/guardians/match matches proximity guardians within 800m', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sos/guardians/match',
      payload: {
        latitude: 28.6139,
        longitude: 77.2090,
        triggerMode: TriggerMode.FALL_DETECTION,
        maxRadiusMeters: 800,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.matchedCount >= 2);
    assert.ok(Array.isArray(body.guardians));
    assert.ok(body.guardians[0].distanceMeters <= 800);
  });

  test('POST /api/v1/journey/register, /checkin, and /complete lifecycle', async () => {
    const journeyId = 'journey-rest-001';

    // 1. Register
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/journey/register',
      payload: {
        journeyId,
        userId: '0x3333333333333333333333333333333333333333',
        startLocation: { latitude: 28.6139, longitude: 77.2090 },
        destination: { latitude: 28.5355, longitude: 77.3910 },
        expectedDurationSeconds: 1200,
        checkInIntervalSeconds: 300,
      },
    });
    assert.equal(regRes.statusCode, 201);
    assert.equal(regRes.json().status, 'ACTIVE');

    // 2. Heartbeat check-in
    const checkinRes = await app.inject({
      method: 'POST',
      url: '/api/v1/journey/checkin',
      payload: {
        journeyId,
        location: { latitude: 28.6145, longitude: 77.2095 },
      },
    });
    assert.equal(checkinRes.statusCode, 200);
    assert.equal(checkinRes.json().startLocation.latitude, 28.6145);

    // 3. Complete
    const compRes = await app.inject({
      method: 'POST',
      url: '/api/v1/journey/complete',
      payload: { journeyId },
    });
    assert.equal(compRes.statusCode, 200);
    assert.equal(compRes.json().status, 'COMPLETED');
  });

  test('POST /api/v1/erss/mock-dispatch returns CAD payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/erss/mock-dispatch',
      payload: {
        incidentId: '00000000-0000-4000-8000-000000000077',
        callerHash: 'hash123',
        latitude: 28.6139,
        longitude: 77.2090,
        h3Res9: '893da11462fffff',
        triggerMode: TriggerMode.MANUAL_BUTTON,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.cadIncidentId.startsWith('CAD-112-'));
    assert.equal(body.priority, 'PRIORITY_1_CRITICAL');
    assert.equal(body.agencyDispatched, 'POLICE_PCR_AND_AMBULANCE');
  });

  test('POST /api/v1/sos/trigger processes valid SOS packet and updates status', async () => {
    const incidentId = '00000000-0000-4000-8000-000000000099';
    const packetId = '00000000-0000-4000-8000-000000000098';

    const rawSMS: SOSAlertSMSPayload = {
      sessionUuid: incidentId,
      latitude: 28.6139,
      longitude: 77.2090,
      h3IndexRes9: '893da11462fffff',
      accuracyRadius: 10,
      battery: 75,
      triggerMode: TriggerMode.MANUAL_BUTTON,
      timestamp: Math.floor(Date.now() / 1000),
      signatureHex: '0x' + 'bb'.repeat(65),
    };
    const base91 = serializeSOSToBase91SMS(rawSMS);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sos/trigger',
      payload: {
        packetId,
        incidentId,
        createdAt: new Date().toISOString(),
        triggerMode: TriggerMode.MANUAL_BUTTON,
        status: SOSStatus.INITIATED,
        smsBase91Payload: base91,
        smartAccountSignature: '0x' + 'ee'.repeat(65),
        signerAddress: '0x1111111111111111111111111111111111111111',
        dispatchRails: [
          {
            rail: DispatchRail.RAIL_A_WSS,
            status: DispatchStatus.PENDING,
          },
        ],
        spatialBucket: 'ttnf4b',
        evidenceMerkleRoot: '22'.repeat(32),
        schemaVersion: '1.0.0',
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.ack.status, 'ACKNOWLEDGED');
    assert.equal(body.ack.incidentId, incidentId);

    // Verify GET /api/v1/sos/:incidentId/status
    const statusRes = await app.inject({
      method: 'GET',
      url: `/api/v1/sos/${incidentId}/status`,
    });
    assert.equal(statusRes.statusCode, 200);
    const statusBody = statusRes.json();
    assert.equal(statusBody.incident.incidentId, incidentId);
    assert.ok(statusBody.dispatchLogs.length >= 1);
  });
});
