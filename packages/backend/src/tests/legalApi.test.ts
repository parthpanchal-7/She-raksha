/**
 * @she-raksha/backend — Fastify Legal REST API End-to-End Tests
 *
 * Verifies:
 *  - POST /api/v1/legal/efir/classify: Multilingual BNS classification
 *  - POST /api/v1/legal/efir/generate: Automated eFIR generation compliant with BNSS §173
 *  - POST /api/v1/legal/countdown/evaluate: 48h early warning & 72h SP escalation triggers
 *  - POST /api/v1/legal/bsa63/compile: BSA §63 PDF/A-3 & JSON-LD certificate pack compilation
 *  - GET /api/v1/legal/efir/:efirId: eFIR retrieval
 *  - GET /api/v1/legal/bsa63/:certId: Certificate pack retrieval
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildServer } from '../server.js';
import { FastifyInstance } from 'fastify';
import { EFIRStatus, BNSS_173_DEADLINE_SECONDS } from '@she-raksha/schemas';

describe('Fastify Legal REST APIs (Phase 9)', () => {
  let app: FastifyInstance;

  before(async () => {
    app = await buildServer();
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('POST /api/v1/legal/efir/classify returns BNS classification and extracted entities', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/legal/efir/classify',
      payload: {
        narrativeText: 'Last night at 11 PM near Metro Station, a stalker was tailing me and threatened to kill me.',
        langCodeHint: 'en',
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(body.primarySection);
    assert.ok(body.applicableSections.length >= 1);
    assert.equal(body.extractedEntities.threatLevel, 'CRITICAL');
    assert.ok(body.chronologicalSynopsis);
  });

  test('POST /api/v1/legal/efir/generate generates valid eFIR and saves in store', async () => {
    const incidentId = '77777777-7777-4000-8000-777777777777';
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/legal/efir/generate',
      payload: {
        incidentId,
        narrativeText: 'अज्ञात व्यक्ति ने मुझे मेट्रो स्टेशन के पास दबोचा और कपड़े खींचे।',
        langCodeHint: 'hi',
      },
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.ok(body.efir.efirId);
    assert.equal(body.efir.incidentId, incidentId);
    assert.equal(body.efir.status, EFIRStatus.PENDING_SIGN);
    assert.equal(body.efir.originalLanguageCode, 'hi');
    assert.match(body.efir.transcriptHash, /^[0-9a-f]{64}$/);

    // Retrieve via GET /api/v1/legal/efir/:efirId
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/legal/efir/${body.efir.efirId}`,
    });
    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.json().efirId, body.efir.efirId);
  });

  test('POST /api/v1/legal/countdown/evaluate executes countdown evaluation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/legal/countdown/evaluate',
      payload: {
        currentTimeSeconds: Math.floor(Date.now() / 1000) + BNSS_173_DEADLINE_SECONDS + 50,
      },
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.results));
  });

  test('POST /api/v1/legal/bsa63/compile compiles and saves BSA §63 certificate pack', async () => {
    const incidentId = '88888888-8888-4000-8000-888888888888';
    const efirId = '99999999-9999-4000-8000-999999999999';

    const chunkDigests = [
      createHash('sha256').update('chunk1').digest('hex'),
      createHash('sha256').update('chunk2').digest('hex'),
    ];

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/legal/bsa63/compile',
      payload: {
        incidentId,
        efirId,
        chunkDigests,
      },
    });

    assert.equal(res.statusCode, 201);
    const body = res.json();
    assert.ok(body.certId);
    assert.ok(body.pack);
    assert.ok(body.pdfA3Base64);
    assert.ok(body.jsonLdDocument);

    // Retrieve via GET /api/v1/legal/bsa63/:certId
    const getRes = await app.inject({
      method: 'GET',
      url: `/api/v1/legal/bsa63/${body.certId}`,
    });
    assert.equal(getRes.statusCode, 200);
    assert.equal(getRes.json().certId, body.certId);
  });
});
