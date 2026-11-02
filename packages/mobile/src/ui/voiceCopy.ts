/**
 * @she-raksha/mobile — Calm Authoritative Voice Copy
 *
 * Implements Brand Voice Rulebook:
 *  - Calm, authoritative, direct, and empowering
 *  - Never use alarmist or patronizing phrasing
 */

export const VOICE_COPY = {
  HOME_STANDBY: 'Protection active. Multi-rail link standby.',
  HOME_DISGUISE_ACTIVE: 'Standard utility calculation mode.',
  SOS_INITIATED: 'Emergency protocol initiated. 3 trusted contacts notified with verified location.',
  SOS_FAILOVER_SMS: 'Cellular network degraded. Switched to Rail B Base91 SMS dispatch.',
  VAULT_ENCRYPTED: 'Evidence encrypted on-device. Digest anchored on Polygon L2.',
  VAULT_BSA63_VERIFIED: 'Tamper-proof BSA §63 certificate compiled with hardware attestation.',
  EFIR_COUNTDOWN: 'Statutory countdown active under BNSS §173. Automatic SP escalation in 71h 59m.',
  EFIR_SP_ESCALATED: 'Statutory window expired. Dossier escalated to District Superintendent of Police under BNSS §173(4).',
  BYSTANDER_PROVING: 'Generating Groth16 zero-knowledge proof on-device. Identity protected.',
  BYSTANDER_SUBMITTED: 'Anonymous bystander report anchored with geohash-6 privacy shield. Zero PII transmitted.',
  JOURNEY_ACTIVE: 'Journey monitoring active. Community guardian radar scanning 800m perimeter.',
  JOURNEY_CHECKIN_PROMPT: 'Check-in pending. 120-second grace countdown active.',
} as const;
