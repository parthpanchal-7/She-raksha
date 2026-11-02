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

// ===========================================================================
// Phase 9: Automated Statutory Legal Lifecycle & Multilingual AI Types
// ===========================================================================

export interface BNSSectionClassification {
  sectionCode: string; // e.g. "BNS_74", "BNS_75", "BNS_78", "BNS_79", "BNS_85", "BNS_351_2"
  sectionTitle: string;
  bnsNumber: string; // e.g. "Section 74", "Section 351(2)"
  confidence: number; // 0.0 - 1.0
  isCognizable: boolean;
  isBailable: boolean;
  maxImprisonmentYears: number;
  legalRationale: string;
  statutoryCitation: string;
}

export interface ExtractedIncidentEntities {
  temporalMarkers: string[];
  locationMarkers: string[];
  perpetratorDescriptors: string[];
  overtActs: string[];
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DetectedLanguageInfo {
  code: string; // 2-letter ISO 639-1 code (e.g. "hi", "ta", "bn", "te")
  name: string; // English name (e.g. "Hindi", "Tamil")
  isEighthSchedule: boolean;
}

export interface BNSClassificationResult {
  primarySection: string;
  applicableSections: BNSSectionClassification[];
  extractedEntities: ExtractedIncidentEntities;
  detectedLanguage: DetectedLanguageInfo;
  chronologicalSynopsis: string;
}

export interface SPEscalationDossier {
  dossierId: string;
  efirId: string;
  incidentId: string;
  toAuthority: 'DISTRICT_SUPERINTENDENT_OF_POLICE';
  statutoryReference: 'Section 173(4), Bharatiya Nagarik Suraksha Sanhita, 2023';
  allegedBNSSections: string[];
  filingTimestamp: string;
  escalationTimestamp: string;
  evidenceMerkleRoot: string;
  ipfsCID: string;
  statutoryEscrowContractId?: string;
  onChainEscrowTxHash?: string;
  legalNoticeText: string;
}

export interface NGOEarlyWarningAlert {
  alertId: string;
  efirId: string;
  incidentId: string;
  timestamp: string;
  hoursElapsed: number;
  hoursRemainingToDeadline: number;
  allegedBNSSections: string[];
  anonymousCaseSummary: string;
  actionRequired: 'PRO_BONO_LEGAL_COUNSEL_DISPATCH';
}

export interface CountdownEvaluationResult {
  efirId: string;
  incidentId: string;
  hoursElapsed: number;
  status: string;
  action: 'NONE' | 'NGO_48HR_EARLY_WARNING_ISSUED' | 'SP_72HR_ESCALATION_TRIGGERED';
  dossier?: SPEscalationDossier;
  ngoAlert?: NGOEarlyWarningAlert;
}


