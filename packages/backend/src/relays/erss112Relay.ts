/**
 * @she-raksha/backend — Mock ERSS-112 Emergency CAD Dispatch Relay
 *
 * Implements mTLS dispatch to India's Emergency Response Support System (ERSS-112).
 * Invoked immediately upon:
 *  - Rail A timeout (> 5.0s) failover
 *  - Rail B SMS trigger ingestion
 *  - Safe-Journey Dead-Man Stage 2 escalation
 */

import { CONFIG } from '../config.js';
import { ERSS112CADPayload } from '../types.js';
import { TriggerMode } from '@she-raksha/schemas';
import { MemoryStore, defaultStore } from '../store/memoryStore.js';
import { DispatchRail, DispatchStatus } from '@she-raksha/schemas';

export interface DispatchERSSOptions {
  incidentId: string;
  callerHash: string;
  latitude: number;
  longitude: number;
  h3Res9: string;
  accuracyRadiusMeters?: number;
  triggerMode: TriggerMode;
  store?: MemoryStore;
}

export class ERSS112Relay {
  private endpoint: string;
  private mTLSCertThumbprint: string;
  private store: MemoryStore;

  constructor(
    endpoint: string = CONFIG.MOCK_ERSS_112_ENDPOINT,
    thumbprint: string = CONFIG.MOCK_ERSS_CLIENT_CERT_THUMBPRINT,
    store: MemoryStore = defaultStore
  ) {
    this.endpoint = endpoint;
    this.mTLSCertThumbprint = thumbprint;
    this.store = store;
  }

  /**
   * Formats CAD (Computer-Aided Dispatch) emergency payload conforming to ERSS standards.
   */
  public formatCADPayload(options: DispatchERSSOptions): ERSS112CADPayload {
    const cadIncidentId = `CAD-112-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      cadIncidentId,
      parentIncidentId: options.incidentId,
      timestamp: new Date().toISOString(),
      callerHash: options.callerHash,
      location: {
        latitude: options.latitude,
        longitude: options.longitude,
        h3Res9: options.h3Res9,
        accuracyRadiusMeters: options.accuracyRadiusMeters || 10,
      },
      triggerMode: options.triggerMode,
      priority: 'PRIORITY_1_CRITICAL',
      agencyDispatched: 'POLICE_PCR_AND_AMBULANCE',
      mTLSCertThumbprint: this.mTLSCertThumbprint,
      status: 'TRANSMITTED_TO_CAD',
    };
  }

  /**
   * Transmits the emergency alert to ERSS-112 CAD endpoint over simulated mTLS.
   */
  public async dispatchToERSS(options: DispatchERSSOptions): Promise<ERSS112CADPayload> {
    const payload = this.formatCADPayload(options);

    // Record dispatch log entry
    await this.store.logDispatch({
      incidentId: options.incidentId,
      rail: DispatchRail.RAIL_B_SMS, // Associated with Rail B emergency cellular escalation
      status: DispatchStatus.DELIVERED,
      railTrackingId: payload.cadIncidentId,
      payloadBytes: JSON.stringify(payload).length,
      acknowledgedAt: new Date().toISOString(),
    });

    return payload;
  }
}

export const defaultERSS112Relay = new ERSS112Relay();
