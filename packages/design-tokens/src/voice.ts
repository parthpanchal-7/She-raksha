/**
 * She-Raksha (शी-रक्षा) Calm & Authoritative Voice Guidelines & Copy Constants
 * Core principle: Direct, calm, authoritative, empowering microcopy. Never alarmist or patronizing.
 */

export const voice = {
  evidenceAnchored: 'Evidence encrypted on-device. Digest anchored on Polygon L2.',
  sosDispatched: 'Emergency protocol initiated. 3 trusted guardians notified with verified location.',
  railAActive: 'Rail A active: WSS duplex telemetry streaming with <500ms latency.',
  railBFailover: 'Rail A timeout (5.0s). Rail B Base91 GSM-7 SMS dispatched to emergency contacts & ERSS-112.',
  railCMesh: 'Rail C active: BLE 5.2 Extended Advertising mesh beaconing to proximate peers.',
  efirGenerated: 'e-FIR generated under BNSS §173. Statutory 72-hour signing window active.',
  efirEscalated: '72-hour window elapsed without police acknowledgement. Case dossier escalated to District Superintendent of Police under BNSS §173(4).',
  zkProofGenerated: 'Bystander report verified via Groth16 zk-SNARK. Identity nullifier spent; exact location masked to municipal geohash-6.',
  bsa63Certified: 'BSA §63 Digital Evidence Certificate compiled with hardware enclave attestation.',
  erasureConfirmed: 'Cryptographic right to erasure enforced. Master keys permanently destroyed from secure enclave.',
} as const;

export type VoiceConstants = typeof voice;
