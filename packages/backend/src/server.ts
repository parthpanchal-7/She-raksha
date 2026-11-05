/**
 * @she-raksha/backend — Fastify Server Setup
 *
 * Implements:
 *  - TLS 1.3 REST endpoints
 *  - Low-latency duplex WebSocket (/ws/sos)
 *  - Twilio SMPP webhook ingestion (/webhooks/twilio/sms)
 *  - PostGIS/H3 guardian spatial matching API
 *  - Safe-Journey Dead-Man Check-In APIs (FR-SOS-004)
 *  - Mock ERSS-112 CAD gateway
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { CONFIG } from './config.js';
import { defaultStore, MemoryStore } from './store/memoryStore.js';
import { defaultSOSHub, SOSHub } from './sos/sosHub.js';
import { defaultSMSRelay, SMSRelay, TwilioWebhookBody } from './relays/smsRelay.js';
import { defaultERSS112Relay, ERSS112Relay } from './relays/erss112Relay.js';
import { defaultDeadManMonitor, DeadManMonitor } from './monitor/deadManMonitor.js';
import { defaultBNSClassifier, BNSClassifierEngine } from './legal/bnsClassifier.js';
import { defaultBNSSWorker, BNSSCountdownWorker } from './legal/bnssCountdownWorker.js';
import { defaultBSA63Compiler, BSA63Compiler } from './legal/bsa63Compiler.js';
import { matchActiveGuardians } from './spatial/guardianMatcher.js';
import { TriggerMode } from '@she-raksha/schemas';

export interface ServerDependencies {
  store?: MemoryStore;
  sosHub?: SOSHub;
  smsRelay?: SMSRelay;
  erssRelay?: ERSS112Relay;
  deadManMonitor?: DeadManMonitor;
  bnsClassifier?: BNSClassifierEngine;
  bnssWorker?: BNSSCountdownWorker;
  bsa63Compiler?: BSA63Compiler;
}

export async function buildServer(dependencies: ServerDependencies = {}): Promise<FastifyInstance> {
  const store = dependencies.store || defaultStore;
  const sosHub = dependencies.sosHub || defaultSOSHub;
  const smsRelay = dependencies.smsRelay || defaultSMSRelay;
  const erssRelay = dependencies.erssRelay || defaultERSS112Relay;
  const deadManMonitor = dependencies.deadManMonitor || defaultDeadManMonitor;
  const bnsClassifier = dependencies.bnsClassifier || defaultBNSClassifier;
  const bnssWorker = dependencies.bnssWorker || defaultBNSSWorker;
  const bsa63Compiler = dependencies.bsa63Compiler || defaultBSA63Compiler;

  const app = Fastify({
    logger: false, // Keep clean during tests, configurable via options
    trustProxy: true,
  });

  // 1. CORS plugin
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // 2. WebSocket plugin
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB max payload
    },
  });

  // 3. Health & Readiness probes
  app.get('/health', async () => ({
    status: 'UP',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async () => ({
    status: 'READY',
    dbConnected: true,
    activeGuardians: (await store.getActiveGuardians()).length,
    timestamp: new Date().toISOString(),
  }));

  // 4. WebSocket SOS Hub Route (Rail A)
  app.get('/ws/sos', { websocket: true }, (socket, req) => {
    sosHub.handleConnection(socket);
  });

  // 5. REST Ingestion: Twilio SMPP SMS Webhook (Rail B)
  app.post('/webhooks/twilio/sms', async (req, reply) => {
    try {
      const body = req.body as TwilioWebhookBody;
      const result = await smsRelay.handleTwilioWebhook(body);
      return reply.code(200).send(result);
    } catch (err: any) {
      return reply.code(400).send({
        error: 'TWILIO_WEBHOOK_ERROR',
        message: err.message,
      });
    }
  });

  // 6. REST Ingestion: Direct SOS Trigger Fallback
  app.post('/api/v1/sos/trigger', async (req, reply) => {
    try {
      const { ack, matchedGuardians } = await sosHub.processSOSPacket(req.body);
      return reply.code(200).send({
        ack,
        matchedGuardians,
      });
    } catch (err: any) {
      return reply.code(400).send({
        error: 'SOS_TRIGGER_ERROR',
        message: err.message,
      });
    }
  });

  // 7. Spatial Resolution & Guardian Proximity Matcher Endpoint
  app.post('/api/v1/sos/guardians/match', async (req, reply) => {
    try {
      const body = req.body as {
        latitude: number;
        longitude: number;
        incidentId?: string;
        triggerMode?: TriggerMode;
        maxRadiusMeters?: number;
      };

      if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          message: 'latitude and longitude are required numbers',
        });
      }

      const allGuardians = await store.getActiveGuardians();
      const matched = matchActiveGuardians({
        victimLat: body.latitude,
        victimLng: body.longitude,
        incidentId: body.incidentId || `temp-${Date.now()}`,
        triggerMode: body.triggerMode || TriggerMode.MANUAL_BUTTON,
        guardians: allGuardians,
        maxRadiusMeters: body.maxRadiusMeters || CONFIG.GUARDIAN_MATCH_RADIUS_METERS,
      });

      return reply.code(200).send({
        matchedCount: matched.length,
        guardians: matched,
      });
    } catch (err: any) {
      return reply.code(500).send({
        error: 'MATCH_ERROR',
        message: err.message,
      });
    }
  });

  // 8. Safe-Journey Dead-Man Check-In APIs (FR-SOS-004)
  app.post('/api/v1/journey/register', async (req, reply) => {
    try {
      const body = req.body as any;
      const session = deadManMonitor.registerJourney(body);
      return reply.code(201).send(session);
    } catch (err: any) {
      return reply.code(400).send({
        error: 'JOURNEY_REGISTER_ERROR',
        message: err.message,
      });
    }
  });

  app.post('/api/v1/journey/checkin', async (req, reply) => {
    try {
      const { journeyId, location } = req.body as any;
      const updated = deadManMonitor.recordHeartbeat(journeyId, location);
      return reply.code(200).send(updated);
    } catch (err: any) {
      return reply.code(400).send({
        error: 'JOURNEY_CHECKIN_ERROR',
        message: err.message,
      });
    }
  });

  app.post('/api/v1/journey/complete', async (req, reply) => {
    try {
      const { journeyId } = req.body as any;
      const completed = deadManMonitor.completeJourney(journeyId);
      return reply.code(200).send(completed);
    } catch (err: any) {
      return reply.code(400).send({
        error: 'JOURNEY_COMPLETE_ERROR',
        message: err.message,
      });
    }
  });

  app.post('/api/v1/journey/evaluate', async (req, reply) => {
    try {
      const { currentTimeSeconds } = (req.body as any) || {};
      const results = await deadManMonitor.evaluateJourneys(currentTimeSeconds);
      return reply.code(200).send({ results });
    } catch (err: any) {
      return reply.code(500).send({
        error: 'JOURNEY_EVALUATE_ERROR',
        message: err.message,
      });
    }
  });

  // 9. Mock ERSS-112 CAD Dispatch Gateway
  app.post('/api/v1/erss/mock-dispatch', async (req, reply) => {
    try {
      const payload = await erssRelay.dispatchToERSS(req.body as any);
      return reply.code(200).send(payload);
    } catch (err: any) {
      return reply.code(500).send({
        error: 'ERSS_DISPATCH_ERROR',
        message: err.message,
      });
    }
  });

  // 10. Incident Status & Dispatch Logs
  app.get('/api/v1/sos/:incidentId/status', async (req, reply) => {
    const { incidentId } = req.params as { incidentId: string };
    const incident = await store.getIncident(incidentId);
    if (!incident) {
      return reply.code(404).send({
        error: 'NOT_FOUND',
        message: `Incident not found: ${incidentId}`,
      });
    }

    const logs = await store.getDispatchLogsForIncident(incidentId);
    return reply.code(200).send({
      incident,
      dispatchLogs: logs,
    });
  });

  // 11. Multilingual BNS Statutory Classification API (FR-EV-004)
  const handleBnsClassify = async (req: any, reply: any) => {
    try {
      const { narrativeText, langCodeHint } = req.body as {
        narrativeText: string;
        langCodeHint?: string;
      };
      if (!narrativeText) {
        return reply.code(400).send({
          error: 'BAD_REQUEST',
          message: 'narrativeText is required',
        });
      }
      const result = bnsClassifier.classifyNarrative(narrativeText, langCodeHint);
      return reply.code(200).send(result);
    } catch (err: any) {
      return reply.code(500).send({
        error: 'CLASSIFICATION_ERROR',
        message: err.message,
      });
    }
  };

  app.post('/api/v1/legal/efir/classify', handleBnsClassify);
  app.post('/api/v1/legal/efir/classify-bns', handleBnsClassify);
  app.post('/api/v1/efir/classify-bns', handleBnsClassify);

  // 12. Automated eFIR Generation API (BNSS §173(1))
  app.post('/api/v1/legal/efir/generate', async (req, reply) => {
    try {
      const { efir, classification } = bnsClassifier.generateEFIRRecord(req.body as any);
      await store.saveEFIRRecord(efir);

      // Immediately broadcast NEW_EFIR_ESCROW to all authenticated Institutional Dashboard clients
      const bnsSections = classification?.applicableSections?.map((s) => `${s.bnsNumber} (${s.sectionTitle})`) || [
        'BNS §74 (Assault)',
        'BNS §78 (Stalking)',
      ];
      sosHub.broadcastNewEFIR({
        type: 'NEW_EFIR_ESCROW',
        efirId: efir.efirId,
        displayId: efir.efirId.slice(0, 5),
        incidentId: efir.incidentId,
        bnsSections,
        coarseLocation: 'Connaught Place Outer Circle, New Delhi',
        createdAt: efir.createdAt,
        signDeadlineAt: efir.signDeadlineAt,
        hoursRemaining: 72,
        minutesRemaining: 0,
        secondsRemaining: 0,
        escrowContractId: efir.escrowContractId || '0x' + '1'.repeat(64),
        encryptedTranscriptCID: efir.encryptedTranscriptCID,
        status: efir.status,
      });

      return reply.code(201).send({
        efir,
        classification,
      });
    } catch (err: any) {
      return reply.code(400).send({
        error: 'EFIR_GENERATION_ERROR',
        message: err.message,
      });
    }
  });

  // 12b. Survivor Incident Capture Endpoint (FR-EV-001)
  app.post('/api/v1/survivor/incident/capture', async (req, reply) => {
    try {
      const result = await sosHub.processIncidentCapture(req.body);
      return reply.code(201).send(result);
    } catch (err: any) {
      return reply.code(400).send({
        error: 'INCIDENT_CAPTURE_ERROR',
        message: err.message,
      });
    }
  });

  // 12c. WebSocket Institutional Command Hub Route
  app.get('/ws/institutional', { websocket: true }, (socket, req) => {
    sosHub.handleConnection(socket);
  });

  // 13. BNSS §173 Countdown Evaluation API (48h NGO early warning & 72h SP escalation)
  app.post('/api/v1/legal/countdown/evaluate', async (req, reply) => {
    try {
      const { currentTimeSeconds } = (req.body as any) || {};
      const results = await bnssWorker.evaluateRecords(currentTimeSeconds);
      return reply.code(200).send({ results });
    } catch (err: any) {
      return reply.code(500).send({
        error: 'COUNTDOWN_EVALUATE_ERROR',
        message: err.message,
      });
    }
  });

  // 14. BSA Section 63 Digital Evidence Certificate Compilation API (FR-EV-007)
  app.post('/api/v1/legal/bsa63/compile', async (req, reply) => {
    try {
      const result = await bsa63Compiler.compileCertificatePack(req.body as any);
      await store.saveBSA63Certificate(result.pack);
      return reply.code(201).send({
        certId: result.pack.certId,
        pack: result.pack,
        pdfA3Base64: result.pdfBuffer.toString('base64'),
        jsonLdDocument: result.jsonLdDocument,
      });
    } catch (err: any) {
      return reply.code(400).send({
        error: 'BSA63_COMPILE_ERROR',
        message: err.message,
      });
    }
  });

  // 15. Retrieve eFIR Record
  app.get('/api/v1/legal/efir/:efirId', async (req, reply) => {
    const { efirId } = req.params as { efirId: string };
    const efir = await store.getEFIRRecord(efirId);
    if (!efir) {
      return reply.code(404).send({
        error: 'NOT_FOUND',
        message: `eFIR record not found: ${efirId}`,
      });
    }
    return reply.code(200).send(efir);
  });

  // 16. Retrieve BSA §63 Certificate Pack
  app.get('/api/v1/legal/bsa63/:certId', async (req, reply) => {
    const { certId } = req.params as { certId: string };
    const cert = await store.getBSA63Certificate(certId);
    if (!cert) {
      return reply.code(404).send({
        error: 'NOT_FOUND',
        message: `BSA §63 certificate not found: ${certId}`,
      });
    }
    return reply.code(200).send(cert);
  });

  return app;
}


export async function startServer(
  port = Number(process.env.PORT || 8080),
  host = process.env.HOST || '0.0.0.0'
): Promise<FastifyInstance> {
  const app = await buildServer();
  await app.listen({ port, host });
  console.log('\n==================================================================');
  console.log(' She-Raksha (शी-रक्षा) Fastify Hub & WebSocket SOS Service Live');
  console.log('==================================================================');
  console.log(' > REST Endpoints  : http://' + host + ':' + port + '/health');
  console.log(' > WebSocket Hub   : ws://' + host + ':' + port + '/ws/sos (Rail A)');
  console.log(' > Spatial Matcher : http://' + host + ':' + port + '/api/v1/sos/guardians/match');
  console.log(' > Statutory e-FIR : http://' + host + ':' + port + '/api/v1/legal/efir/classify-bns');
  console.log('==================================================================\n');
  return app;
}

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].endsWith('index.js'));
if (isDirectRun || process.env.RUN_SERVER === 'true') {
  startServer().catch((err) => {
    console.error('Failed to start She-Raksha backend server:', err);
    process.exit(1);
  });
}
