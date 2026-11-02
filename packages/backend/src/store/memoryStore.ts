/**
 * @she-raksha/backend — In-Memory Store & Database Abstraction
 *
 * Simulates central PostgreSQL / PostGIS tables:
 *  - users
 *  - emergency_contacts (priority tiers 1-5, salted phone hashes)
 *  - guardians (geom GEOGRAPHY(Point, 4326), h3_index_res9, is_active)
 *  - sos_incidents (geom GEOMETRY(Point, 4326), spatial_bucket)
 *  - sos_dispatch_logs (rail, status, payload_bytes)
 * Zero cleartext PII per DPDP Act 2023.
 */

import {
  SOSIncidentRecord,
  SOSDispatchLogRecord,
  GuardianRecord,
  EmergencyContactRecord,
} from '../types.js';
import {
  DispatchRail,
  DispatchStatus,
  SOSStatus,
  TriggerMode,
  EFIRRecord,
  EFIRStatus,
  BSA63CertificatePack,
} from '@she-raksha/schemas';

export class MemoryStore {
  public incidents: Map<string, SOSIncidentRecord> = new Map();
  public dispatchLogs: SOSDispatchLogRecord[] = [];
  public guardians: Map<string, GuardianRecord> = new Map();
  public emergencyContacts: Map<string, EmergencyContactRecord[]> = new Map(); // userId -> contacts
  public efirRecords: Map<string, EFIRRecord> = new Map();
  public bsa63Certificates: Map<string, BSA63CertificatePack> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  /**
   * Clears all state and re-seeds default test data.
   */
  public reset(): void {
    this.incidents.clear();
    this.dispatchLogs = [];
    this.guardians.clear();
    this.emergencyContacts.clear();
    this.efirRecords.clear();
    this.bsa63Certificates.clear();
    this.seedDefaultData();
  }

  // -------------------------------------------------------------------------
  // SOS Incidents
  // -------------------------------------------------------------------------

  public async saveIncident(incident: SOSIncidentRecord): Promise<SOSIncidentRecord> {
    this.incidents.set(incident.incidentId, incident);
    return incident;
  }

  public async getIncident(incidentId: string): Promise<SOSIncidentRecord | undefined> {
    return this.incidents.get(incidentId);
  }

  public async updateIncidentStatus(incidentId: string, status: SOSStatus): Promise<boolean> {
    const inc = this.incidents.get(incidentId);
    if (!inc) return false;
    inc.status = status;
    if (status === SOSStatus.RESOLVED) {
      inc.resolvedAt = new Date().toISOString();
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // SOS Dispatch Logs
  // -------------------------------------------------------------------------

  public async logDispatch(log: Omit<SOSDispatchLogRecord, 'logId' | 'attemptedAt' | 'retryCount'>): Promise<SOSDispatchLogRecord> {
    const fullLog: SOSDispatchLogRecord = {
      logId: `log-${Math.random().toString(36).substring(2, 10)}`,
      attemptedAt: new Date().toISOString(),
      retryCount: 0,
      ...log,
    };
    this.dispatchLogs.push(fullLog);
    return fullLog;
  }

  public async getDispatchLogsForIncident(incidentId: string): Promise<SOSDispatchLogRecord[]> {
    return this.dispatchLogs.filter((log) => log.incidentId === incidentId);
  }

  // -------------------------------------------------------------------------
  // Guardians
  // -------------------------------------------------------------------------

  public async saveGuardian(guardian: GuardianRecord): Promise<GuardianRecord> {
    this.guardians.set(guardian.guardianId, guardian);
    return guardian;
  }

  public async getActiveGuardians(): Promise<GuardianRecord[]> {
    return Array.from(this.guardians.values()).filter((g) => g.isActive);
  }

  // -------------------------------------------------------------------------
  // Emergency Contacts
  // -------------------------------------------------------------------------

  public async setEmergencyContacts(userId: string, contacts: EmergencyContactRecord[]): Promise<void> {
    // Ensure priority tier 1 to 5 sorting
    const sorted = [...contacts].sort((a, b) => a.priorityTier - b.priorityTier);
    this.emergencyContacts.set(userId, sorted);
  }

  public async getEmergencyContacts(userId: string): Promise<EmergencyContactRecord[]> {
    return this.emergencyContacts.get(userId) || [];
  }

  // -------------------------------------------------------------------------
  // eFIR Records (BNSS §173)
  // -------------------------------------------------------------------------

  public async saveEFIRRecord(efir: EFIRRecord): Promise<EFIRRecord> {
    this.efirRecords.set(efir.efirId, efir);
    return efir;
  }

  public async getEFIRRecord(efirId: string): Promise<EFIRRecord | undefined> {
    return this.efirRecords.get(efirId);
  }

  public async getEFIRByIncidentId(incidentId: string): Promise<EFIRRecord | undefined> {
    return Array.from(this.efirRecords.values()).find((e) => e.incidentId === incidentId);
  }

  public async getAllActiveEFIRRecords(): Promise<EFIRRecord[]> {
    return Array.from(this.efirRecords.values()).filter(
      (e) => e.status === EFIRStatus.PENDING_SIGN || e.status === EFIRStatus.SIGNED
    );
  }

  public async updateEFIRStatus(
    efirId: string,
    status: EFIRStatus,
    details: Partial<EFIRRecord> = {}
  ): Promise<boolean> {
    const existing = this.efirRecords.get(efirId);
    if (!existing) return false;
    this.efirRecords.set(efirId, {
      ...existing,
      ...details,
      status,
    });
    return true;
  }

  // -------------------------------------------------------------------------
  // BSA §63 Digital Evidence Certificates
  // -------------------------------------------------------------------------

  public async saveBSA63Certificate(cert: BSA63CertificatePack): Promise<BSA63CertificatePack> {
    this.bsa63Certificates.set(cert.certId, cert);
    return cert;
  }

  public async getBSA63Certificate(certId: string): Promise<BSA63CertificatePack | undefined> {
    return this.bsa63Certificates.get(certId);
  }

  public async getBSA63CertificateByIncidentId(incidentId: string): Promise<BSA63CertificatePack | undefined> {
    return Array.from(this.bsa63Certificates.values()).find((c) => c.incidentId === incidentId);
  }

  // -------------------------------------------------------------------------
  // Seed Mock Data (e.g. Delhi NCR coordinates for testing)
  // -------------------------------------------------------------------------

  private seedDefaultData(): void {
    const centerLat = 28.6139; // Connaught Place, New Delhi
    const centerLng = 77.2090;

    // Seed 4 guardians:
    // Guardian 1: ~250m away (ACTIVE) -> should match (<= 800m)
    // Guardian 2: ~600m away (ACTIVE) -> should match (<= 800m)
    // Guardian 3: ~1200m away (ACTIVE) -> outside 800m, should NOT match
    // Guardian 4: ~300m away (INACTIVE) -> inactive, should NOT match
    const seedGuardians: GuardianRecord[] = [
      {
        guardianId: 'guardian-001-active-near',
        userId: 'user-guardian-1',
        latitude: centerLat + 0.002, // ~220m North
        longitude: centerLng + 0.001,
        h3IndexRes9: '893da11462fffff',
        radiusMeters: 2000,
        isActive: true,
        stakeWei: '1000000000000000000', // 1 ETH / MATIC
      },
      {
        guardianId: 'guardian-002-active-mid',
        userId: 'user-guardian-2',
        latitude: centerLat - 0.004, // ~450m South
        longitude: centerLng - 0.003,
        h3IndexRes9: '893da11463fffff',
        radiusMeters: 2000,
        isActive: true,
        stakeWei: '2000000000000000000',
      },
      {
        guardianId: 'guardian-003-active-far',
        userId: 'user-guardian-3',
        latitude: centerLat + 0.015, // ~1600m North (Far)
        longitude: centerLng + 0.015,
        h3IndexRes9: '893da11464fffff',
        radiusMeters: 2000,
        isActive: true,
        stakeWei: '500000000000000000',
      },
      {
        guardianId: 'guardian-004-inactive-near',
        userId: 'user-guardian-4',
        latitude: centerLat + 0.0015, // ~170m away, but INACTIVE
        longitude: centerLng + 0.0015,
        h3IndexRes9: '893da11462fffff',
        radiusMeters: 2000,
        isActive: false,
        stakeWei: '1000000000000000000',
      },
    ];

    for (const g of seedGuardians) {
      this.guardians.set(g.guardianId, g);
    }

    // Seed default emergency contacts for mock user
    const mockUserId = '0x1111111111111111111111111111111111111111';
    const contacts: EmergencyContactRecord[] = [
      {
        contactId: 'contact-tier-1',
        userId: mockUserId,
        priorityTier: 1,
        contactPhoneHash: 'a'.repeat(64),
        encryptedContactDetails: 'blob_mom_tier1',
        contactEncryptionPubkey: 'b'.repeat(64),
        isConfirmed: true,
      },
      {
        contactId: 'contact-tier-2',
        userId: mockUserId,
        priorityTier: 2,
        contactPhoneHash: 'c'.repeat(64),
        encryptedContactDetails: 'blob_sister_tier2',
        contactEncryptionPubkey: 'd'.repeat(64),
        isConfirmed: true,
      },
      {
        contactId: 'contact-tier-3',
        userId: mockUserId,
        priorityTier: 3,
        contactPhoneHash: 'e'.repeat(64),
        encryptedContactDetails: 'blob_friend_tier3',
        contactEncryptionPubkey: 'f'.repeat(64),
        isConfirmed: true,
      },
    ];
    this.emergencyContacts.set(mockUserId, contacts);
  }
}

export const defaultStore = new MemoryStore();

