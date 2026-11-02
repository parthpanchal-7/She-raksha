/**
 * @she-raksha/backend — Domain Models & Type Definitions
 */

import { TriggerMode, SOSStatus, DispatchRail, DispatchStatus } from '@she-raksha/schemas';

export interface LocationCoords {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export interface ObfuscatedLocation {
  coarseLatitude: number;
  coarseLongitude: number;
  h3IndexRes9: string;
  spatialBucket: string; // Geohash-6
}

export interface GuardianRecord {
  guardianId: string;
  userId: string;
  latitude: number;
  longitude: number;
  h3IndexRes9: string;
  radiusMeters: number;
  isActive: boolean;
  stakeWei: string;
  lastHeartbeatAt?: string;
}

export interface MatchedGuardian {
  guardianId: string;
  userId: string;
  distanceMeters: number;
  h3IndexRes9: string;
  notificationPayload: {
    incidentId: string;
    coarseLocation: ObfuscatedLocation;
    triggerMode: TriggerMode;
    timestamp: string;
  };
}

export interface EmergencyContactRecord {
  contactId: string;
  userId: string;
  priorityTier: 1 | 2 | 3 | 4 | 5;
  contactPhoneHash: string;
  encryptedContactDetails: string; // base64 or hex
  contactEncryptionPubkey: string;
  isConfirmed: boolean;
}

export interface SOSIncidentRecord {
  incidentId: string;
  userId: string;
  triggerMode: TriggerMode;
  status: SOSStatus;
  latitude?: number;
  longitude?: number;
  spatialBucket: string;
  evidenceMerkleRoot: string;
  triggeredAt: string;
  resolvedAt?: string;
}

export interface SOSDispatchLogRecord {
  logId: string;
  incidentId: string;
  rail: DispatchRail;
  status: DispatchStatus;
  railTrackingId?: string;
  payloadBytes?: number;
  attemptedAt: string;
  acknowledgedAt?: string;
  failureReason?: string;
  retryCount: number;
}

export interface ERSS112CADPayload {
  cadIncidentId: string;
  parentIncidentId: string;
  timestamp: string;
  callerHash: string;
  location: {
    latitude: number;
    longitude: number;
    h3Res9: string;
    accuracyRadiusMeters: number;
  };
  triggerMode: TriggerMode;
  priority: 'PRIORITY_1_CRITICAL';
  agencyDispatched: 'POLICE_PCR_AND_AMBULANCE';
  mTLSCertThumbprint: string;
  status: 'TRANSMITTED_TO_CAD';
}

export type JourneyStatus = 'ACTIVE' | 'STAGE_1_WARNING' | 'STAGE_2_ESCALATED' | 'COMPLETED' | 'CANCELLED';

export interface JourneySession {
  journeyId: string;
  userId: string;
  startLocation: LocationCoords;
  destination: LocationCoords;
  expectedDurationSeconds: number;
  checkInIntervalSeconds: number;
  startedAt: number; // Unix seconds
  lastHeartbeatAt: number; // Unix seconds
  status: JourneyStatus;
  stage1AlertedAt?: number;
  stage2EscalatedAt?: number;
  emergencyContactTiers: string[]; // Phone hashes or IDs
}

export interface WebSocketAckMessage {
  type: 'SOS_ACK';
  packetId: string;
  incidentId: string;
  status: 'ACKNOWLEDGED';
  serverTimestamp: string;
  latencyMs: number;
  guardiansMatchedCount: number;
}

export interface WebSocketErrorMessage {
  type: 'SOS_ERROR';
  packetId?: string;
  errorCode: string;
  message: string;
  serverTimestamp: string;
}
