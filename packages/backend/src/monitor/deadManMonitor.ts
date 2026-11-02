/**
 * @she-raksha/backend — Safe-Journey Dead-Man Check-In Monitor (FR-SOS-004)
 *
 * Implements:
 *  - Trip registration with configurable check-in intervals
 *  - Regular heartbeat check-ins from survivor device
 *  - Missed check-in grace period: 120 seconds (FR-SOS-004)
 *  - Stage 1: Soft warning notification to designated guardians & emergency contacts
 *  - Stage 2: Full SOS dispatch + ERSS-112 emergency escalation if missed check-in persists
 */

import { CONFIG } from '../config.js';
import { JourneySession, JourneyStatus, LocationCoords } from '../types.js';
import { MemoryStore, defaultStore } from '../store/memoryStore.js';
import { ERSS112Relay, defaultERSS112Relay } from '../relays/erss112Relay.js';
import { TriggerMode, SOSStatus, DispatchRail, DispatchStatus } from '@she-raksha/schemas';

export interface RegisterJourneyOptions {
  journeyId: string;
  userId: string;
  startLocation: LocationCoords;
  destination: LocationCoords;
  expectedDurationSeconds: number;
  checkInIntervalSeconds: number; // e.g. 900s (15 min)
  emergencyContactTiers?: string[];
}

export interface JourneyEvaluationResult {
  journeyId: string;
  userId: string;
  previousStatus: JourneyStatus;
  currentStatus: JourneyStatus;
  secondsOverdue: number;
  actionTaken: 'NONE' | 'STAGE_1_WARNING_ISSUED' | 'STAGE_2_SOS_ESCALATED';
  erssCADIncidentId?: string;
}

export class DeadManMonitor {
  private journeys: Map<string, JourneySession> = new Map();
  private store: MemoryStore;
  private erssRelay: ERSS112Relay;
  private timerInterval?: NodeJS.Timeout;

  constructor(
    store: MemoryStore = defaultStore,
    erssRelay: ERSS112Relay = defaultERSS112Relay
  ) {
    this.store = store;
    this.erssRelay = erssRelay;
  }

  /**
   * Registers a new monitored travel journey session.
   */
  public registerJourney(options: RegisterJourneyOptions): JourneySession {
    const now = Math.floor(Date.now() / 1000);
    const session: JourneySession = {
      journeyId: options.journeyId,
      userId: options.userId,
      startLocation: options.startLocation,
      destination: options.destination,
      expectedDurationSeconds: options.expectedDurationSeconds,
      checkInIntervalSeconds: options.checkInIntervalSeconds,
      startedAt: now,
      lastHeartbeatAt: now,
      status: 'ACTIVE',
      emergencyContactTiers: options.emergencyContactTiers || [],
    };

    this.journeys.set(session.journeyId, session);
    return session;
  }

  /**
   * Records a user heartbeat / check-in, resetting the dead-man timer.
   */
  public recordHeartbeat(journeyId: string, location?: LocationCoords): JourneySession {
    const journey = this.journeys.get(journeyId);
    if (!journey) {
      throw new Error(`Journey session not found: ${journeyId}`);
    }

    if (journey.status === 'COMPLETED' || journey.status === 'CANCELLED') {
      throw new Error(`Cannot check in for ${journey.status} journey: ${journeyId}`);
    }

    const now = Math.floor(Date.now() / 1000);
    journey.lastHeartbeatAt = now;

    // If was in Stage 1 warning, reset back to ACTIVE
    if (journey.status === 'STAGE_1_WARNING') {
      journey.status = 'ACTIVE';
      journey.stage1AlertedAt = undefined;
    }

    if (location) {
      journey.startLocation = location;
    }

    return journey;
  }

  /**
   * Successfully completes the journey.
   */
  public completeJourney(journeyId: string): JourneySession {
    const journey = this.journeys.get(journeyId);
    if (!journey) {
      throw new Error(`Journey session not found: ${journeyId}`);
    }

    journey.status = 'COMPLETED';
    return journey;
  }

  /**
   * Retrieves an active or historical journey session.
   */
  public getJourney(journeyId: string): JourneySession | undefined {
    return this.journeys.get(journeyId);
  }

  /**
   * Evaluates all registered journeys against the 120-second grace threshold.
   * Can be driven by a real timer or called deterministically in tests.
   */
  public async evaluateJourneys(
    currentTimeSeconds?: number
  ): Promise<JourneyEvaluationResult[]> {
    const now = currentTimeSeconds ?? Math.floor(Date.now() / 1000);
    const results: JourneyEvaluationResult[] = [];

    for (const journey of this.journeys.values()) {
      if (journey.status === 'COMPLETED' || journey.status === 'CANCELLED') {
        continue;
      }

      const nextExpectedCheckIn = journey.lastHeartbeatAt + journey.checkInIntervalSeconds;
      const secondsOverdue = now - nextExpectedCheckIn;

      // FR-SOS-004: Missed check-in grace period is strictly 120 seconds
      if (secondsOverdue > CONFIG.DEAD_MAN_GRACE_PERIOD_SECONDS) {
        if (journey.status === 'ACTIVE') {
          // STAGE 1: Traveler missed check-in by >120s -> Soft guardian warning
          const previousStatus = journey.status;
          journey.status = 'STAGE_1_WARNING';
          journey.stage1AlertedAt = now;

          await this.store.logDispatch({
            incidentId: journey.journeyId,
            rail: DispatchRail.RAIL_A_WSS,
            status: DispatchStatus.PENDING,
            railTrackingId: `dm-stage1-${journey.journeyId}`,
            failureReason: `Missed check-in by ${secondsOverdue}s (exceeded ${CONFIG.DEAD_MAN_GRACE_PERIOD_SECONDS}s grace)`,
          });

          results.push({
            journeyId: journey.journeyId,
            userId: journey.userId,
            previousStatus,
            currentStatus: journey.status,
            secondsOverdue,
            actionTaken: 'STAGE_1_WARNING_ISSUED',
          });
        } else if (
          journey.status === 'STAGE_1_WARNING' &&
          journey.stage1AlertedAt &&
          now - journey.stage1AlertedAt >= 60 // 60s escalation window after Stage 1
        ) {
          // STAGE 2: Traveler still hasn't checked in -> Full SOS dispatch + ERSS-112
          const previousStatus = journey.status;
          journey.status = 'STAGE_2_ESCALATED';
          journey.stage2EscalatedAt = now;

          // Create official incident
          await this.store.saveIncident({
            incidentId: journey.journeyId,
            userId: journey.userId,
            triggerMode: TriggerMode.DEAD_MAN_SWITCH,
            status: SOSStatus.INITIATED,
            latitude: journey.startLocation.latitude,
            longitude: journey.startLocation.longitude,
            spatialBucket: 'ttnf4b',
            evidenceMerkleRoot: '0x' + '00'.repeat(32),
            triggeredAt: new Date(now * 1000).toISOString(),
          });

          // Trigger ERSS-112 CAD dispatch
          const erssCAD = await this.erssRelay.dispatchToERSS({
            incidentId: journey.journeyId,
            callerHash: journey.userId,
            latitude: journey.startLocation.latitude,
            longitude: journey.startLocation.longitude,
            h3Res9: '893da11462fffff',
            accuracyRadiusMeters: 25,
            triggerMode: TriggerMode.DEAD_MAN_SWITCH,
            store: this.store,
          });

          results.push({
            journeyId: journey.journeyId,
            userId: journey.userId,
            previousStatus,
            currentStatus: journey.status,
            secondsOverdue,
            actionTaken: 'STAGE_2_SOS_ESCALATED',
            erssCADIncidentId: erssCAD.cadIncidentId,
          });
        }
      } else {
        // In compliance
        results.push({
          journeyId: journey.journeyId,
          userId: journey.userId,
          previousStatus: journey.status,
          currentStatus: journey.status,
          secondsOverdue: Math.max(0, secondsOverdue),
          actionTaken: 'NONE',
        });
      }
    }

    return results;
  }

  /**
   * Starts periodic polling worker.
   */
  public startWorker(intervalMs = 15000): void {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.evaluateJourneys().catch((err) => {
        console.error('[DeadManMonitor] Evaluation error:', err);
      });
    }, intervalMs);
  }

  /**
   * Stops periodic polling worker.
   */
  public stopWorker(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
    }
  }

  /**
   * Clears state for testing.
   */
  public reset(): void {
    this.stopWorker();
    this.journeys.clear();
  }
}

export const defaultDeadManMonitor = new DeadManMonitor();
