/**
 * @she-raksha/web — Mock Institutional Compliance Data
 *
 * Strictly typed against @she-raksha/schemas:
 *  - EFIRRecord (BNSS §173 statutory timelines & BNS sections)
 *  - ZKProofSubmission (Poseidon Nullifier, Geohash-6 bucket, Groth16 proof)
 *  - BSA63CertificatePack (Hardware TEE attestation, Merkle anchor, IPFS CIDv1)
 */

export interface MockEFIRItem {
  efirId: string;
  displayId: string;
  incidentId: string;
  createdAt: string;
  signDeadlineAt: string;
  hoursRemaining: number;
  minutesRemaining: number;
  secondsRemaining: number;
  bnsSections: string[];
  originalLanguage: string;
  status: 'RECORDED' | 'ACKNOWLEDGED' | 'ESCALATED' | 'TRANSCRIBED';
  location: string;
  encryptedTranscriptCID: string;
  escrowContractId: string;
  isEscalatedToSP: boolean;
}

export interface MockZKReportItem {
  submissionId: string;
  submittedAt: string;
  poseidonNullifierHash: string;
  geohashBucket: string;
  incidentCategoryCode: string;
  categoryLabel: string;
  timestampBucketEpochHour: number;
  onChainTxHash: string;
  isNullifierVerified: boolean;
  zkeyVersion: string;
}

export interface MockEscrowWarningItem {
  id: string;
  efirDisplayId: string;
  bnsSections: string[];
  location: string;
  hoursElapsed: number;
  hoursRemaining: number;
  minutesRemaining: number;
  delayingStation: string;
  spEscalationAt: string;
  ngoNotified: string[];
  status: 'SP_ESCALATION_PENDING';
}

export interface MockEvidenceFileItem {
  fileId: string;
  fileName: string;
  fileSize: string;
  mediaType: string;
  chunkCount: number;
  authTag128Bit: string;
  cidV1: string;
  polygonTxHash: string;
  blockNumber: number;
  teeType: 'ANDROID_STRONGBOX' | 'IOS_SECURE_ENCLAVE' | 'AWS_NITRO';
  securityLevel: string;
  isVerified: boolean;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// 1. Mock e-FIR Escrow Records (BNSS §173)
// ---------------------------------------------------------------------------
export const MOCK_EFIR_RECORDS: MockEFIRItem[] = [
  {
    efirId: '98124a1b-3c4d-4e5f-a6b7-c8d9e0f1a2b3',
    displayId: '98124',
    incidentId: 'inc-dl-2026-98124',
    createdAt: '2026-11-03T16:00:00.000Z',
    signDeadlineAt: '2026-11-06T16:00:00.000Z',
    hoursRemaining: 68,
    minutesRemaining: 42,
    secondsRemaining: 15,
    bnsSections: ['BNS §74 (Assault)', 'BNS §78 (Stalking)'],
    originalLanguage: 'Hindi (हिंदी)',
    status: 'RECORDED',
    location: 'Connaught Place Outer Circle, New Delhi',
    encryptedTranscriptCID: 'bafybeicv5c2j6h2z3x4m5n6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3a',
    escrowContractId: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    isEscalatedToSP: false,
  },
  {
    efirId: '98125b2c-4d5e-5f6a-b7c8-d9e0f1a2b3c4',
    displayId: '98125',
    incidentId: 'inc-dl-2026-98125',
    createdAt: '2026-11-02T18:00:00.000Z',
    signDeadlineAt: '2026-11-05T18:00:00.000Z',
    hoursRemaining: 18,
    minutesRemaining: 10,
    secondsRemaining: 45,
    bnsSections: ['BNS §75 (Sexual Harassment)'],
    originalLanguage: 'Tamil (தமிழ்)',
    status: 'RECORDED',
    location: 'Janpath Metro Corridor, New Delhi',
    encryptedTranscriptCID: 'bafybeid7k3m5n8p0q2r4s6t8u0v2w4x6y8z0a2b4c6d8e0f2a4b6c8d0e',
    escrowContractId: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    isEscalatedToSP: false,
  },
  {
    efirId: '98126c3d-5e6f-6a7b-c8d9-e0f1a2b3c4d5',
    displayId: '98126',
    incidentId: 'inc-dl-2026-98126',
    createdAt: '2026-11-02T12:00:00.000Z',
    signDeadlineAt: '2026-11-05T12:00:00.000Z',
    hoursRemaining: 11,
    minutesRemaining: 25,
    secondsRemaining: 30,
    bnsSections: ['BNS §79 (Word/Gesture Insulting Modesty)', 'BNS §351(2) (Criminal Intimidation)'],
    originalLanguage: 'Bengali (বাংলা)',
    status: 'RECORDED',
    location: 'Barakhamba Road Junction, New Delhi',
    encryptedTranscriptCID: 'bafybeig9h1j3k5l7m9n1p3r5t7v9x1z3b5d7f9h1j3k5l7m9n1p3r5t7v',
    escrowContractId: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
    isEscalatedToSP: false,
  },
  {
    efirId: '98127d4e-6f7a-7b8c-d9e0-f1a2b3c4d5e6',
    displayId: '98127',
    incidentId: 'inc-dl-2026-98127',
    createdAt: '2026-11-03T02:00:00.000Z',
    signDeadlineAt: '2026-11-06T02:00:00.000Z',
    hoursRemaining: 54,
    minutesRemaining: 15,
    secondsRemaining: 10,
    bnsSections: ['BNS §85 (Cruelty by Husband or Relatives)'],
    originalLanguage: 'Marathi (मराठी)',
    status: 'RECORDED',
    location: 'Lodhi Colony Sector 2, New Delhi',
    encryptedTranscriptCID: 'bafybeia2b4c6d8e0f2g4h6j8k0l2m4n6p8q0r2s4t6u8v0w2x4y6z8a0b',
    escrowContractId: '0x34567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    isEscalatedToSP: false,
  },
];

// ---------------------------------------------------------------------------
// 2. Mock NGO Escalation Dossiers (48h Warnings & ZK Reports)
// ---------------------------------------------------------------------------
export const MOCK_ESCROW_WARNINGS: MockEscrowWarningItem[] = [
  {
    id: 'warn-48h-001',
    efirDisplayId: '98125',
    bnsSections: ['BNS §75 (Sexual Harassment)'],
    location: 'Janpath Metro Corridor, New Delhi',
    hoursElapsed: 54,
    hoursRemaining: 18,
    minutesRemaining: 10,
    delayingStation: 'Parliament Street Police Station (PS-DL-04)',
    spEscalationAt: '05 Nov 2026, 18:00 IST',
    ngoNotified: ['National Commission for Women (NCW)', 'Delhi State Legal Services Authority (DSLSA)'],
    status: 'SP_ESCALATION_PENDING',
  },
  {
    id: 'warn-48h-002',
    efirDisplayId: '98126',
    bnsSections: ['BNS §79 (Word/Gesture Insulting Modesty)', 'BNS §351(2) (Criminal Intimidation)'],
    location: 'Barakhamba Road Junction, New Delhi',
    hoursElapsed: 60,
    hoursRemaining: 11,
    minutesRemaining: 25,
    delayingStation: 'Connaught Place Police Station (PS-DL-01)',
    spEscalationAt: '05 Nov 2026, 12:00 IST',
    ngoNotified: ['Jagori Legal Aid Defense', 'NCW Quick Response Cell'],
    status: 'SP_ESCALATION_PENDING',
  },
];

export const MOCK_ZK_REPORTS: MockZKReportItem[] = [
  {
    submissionId: 'zk-sub-2026-0041',
    submittedAt: '2026-11-04T22:15:00.000Z',
    poseidonNullifierHash: '0x4f89c2b3e8a1d7f6c5b4a39281706f5e4d3c2b1a0987654321fedcba09876543',
    geohashBucket: 'ttnf7z',
    incidentCategoryCode: 'BNS_78',
    categoryLabel: 'BNS §78 (Stalking / Unlawful Pursuit)',
    timestampBucketEpochHour: 498214,
    onChainTxHash: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    isNullifierVerified: true,
    zkeyVersion: 'v2.1.0-prod',
  },
  {
    submissionId: 'zk-sub-2026-0042',
    submittedAt: '2026-11-04T20:45:00.000Z',
    poseidonNullifierHash: '0x9b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c',
    geohashBucket: 'ttnf7w',
    incidentCategoryCode: 'BNS_74',
    categoryLabel: 'BNS §74 (Assault / Use of Criminal Force)',
    timestampBucketEpochHour: 498212,
    onChainTxHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
    isNullifierVerified: true,
    zkeyVersion: 'v2.1.0-prod',
  },
  {
    submissionId: 'zk-sub-2026-0043',
    submittedAt: '2026-11-04T19:10:00.000Z',
    poseidonNullifierHash: '0xe2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3',
    geohashBucket: 'ttnf7y',
    incidentCategoryCode: 'BNS_75',
    categoryLabel: 'BNS §75 (Physical Contact / Sexual Harassment)',
    timestampBucketEpochHour: 498211,
    onChainTxHash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
    isNullifierVerified: true,
    zkeyVersion: 'v2.1.0-prod',
  },
];

// ---------------------------------------------------------------------------
// 3. Mock Evidence Files & BSA §63 Digital Custody Packs
// ---------------------------------------------------------------------------
export const MOCK_EVIDENCE_FILES: MockEvidenceFileItem[] = [
  {
    fileId: 'ev-file-01',
    fileName: 'evidence_chunk_01_audio.aac.enc',
    fileSize: '5.2 MB',
    mediaType: 'Audio (128kbps AAC)',
    chunkCount: 12,
    authTag128Bit: '0x7f4b82d3e91a0c4f8b2d1e9a3c5e7b9d',
    cidV1: 'bafybeicv5c2j6h2z3x4m5n6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3a',
    polygonTxHash: '0x89d2c49e7b1a03fc652e91da0183b9c7198a2d1f67890abcde1234567890abcd',
    blockNumber: 49821092,
    teeType: 'ANDROID_STRONGBOX',
    securityLevel: 'Hardware TEE Keymaster v3.4',
    isVerified: true,
    timestamp: '04 Nov 2026, 20:15:32 IST',
  },
  {
    fileId: 'ev-file-02',
    fileName: 'evidence_survivor_h265_chunk_02.mp4.enc',
    fileSize: '18.4 MB',
    mediaType: 'Video (1080p H.265 Encrypted)',
    chunkCount: 36,
    authTag128Bit: '0xa3b5c7d9e1f2a4b6c8d0e2f4a6b8c0d2',
    cidV1: 'bafybeid9k2f4g6h8j0l1m3n5p7q9r1t3v5x7z9b1d3f5h7j9l1n3p5r7t9',
    polygonTxHash: '0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d',
    blockNumber: 49821104,
    teeType: 'ANDROID_STRONGBOX',
    securityLevel: 'Hardware TEE Keymaster v3.4',
    isVerified: true,
    timestamp: '04 Nov 2026, 20:18:14 IST',
  },
  {
    fileId: 'ev-file-03',
    fileName: 'strongbox_tflite_attestation.json.enc',
    fileSize: '142 KB',
    mediaType: 'Attestation Manifest (JSON-LD)',
    chunkCount: 1,
    authTag128Bit: '0x1c3e5a7b9d1f3a5c7e9b1d3f5a7c9e1b',
    cidV1: 'bafybeih4j6k8l0m2n4p6r8t0v2x4z6b8d0f2h4j6k8l0m2n4p6r8t0v2x',
    polygonTxHash: '0x2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e',
    blockNumber: 49821118,
    teeType: 'ANDROID_STRONGBOX',
    securityLevel: 'Hardware TEE Keymaster v3.4',
    isVerified: true,
    timestamp: '04 Nov 2026, 20:20:05 IST',
  },
  {
    fileId: 'ev-file-04',
    fileName: 'survivor_duress_voice_03.aac.enc',
    fileSize: '2.8 MB',
    mediaType: 'Audio (128kbps AAC)',
    chunkCount: 6,
    authTag128Bit: '0x9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f',
    cidV1: 'bafybeib7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d',
    polygonTxHash: '0x9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
    blockNumber: 49821129,
    teeType: 'ANDROID_STRONGBOX',
    securityLevel: 'Hardware TEE Keymaster v3.4',
    isVerified: true,
    timestamp: '04 Nov 2026, 20:22:48 IST',
  },
];

