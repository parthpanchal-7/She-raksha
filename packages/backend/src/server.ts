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
import { matchActiveGuardians } from './spatial/guardianMatcher.js';
import { TriggerMode } from '@she-raksha/schemas';

export interface ServerDependencies {
  store?: MemoryStore;
  sosHub?: SOSHub;
  smsRelay?: SMSRelay;
  erssRelay?: ERSS112Relay;
  deadManMonitor?: DeadManMonitor;
}

export async function buildServer(dependencies: ServerDependencies = {}): Promise<FastifyInstance> {
  const store = dependencies.store || defaultStore;
  const sosHub = dependencies.sosHub || defaultSOSHub;
  const smsRelay = dependencies.smsRelay || defaultSMSRelay;
  const erssRelay = dependencies.erssRelay || defaultERSS112Relay;
  const deadManMonitor = dependencies.deadManMonitor || defaultDeadManMonitor;

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

  return app;
}
