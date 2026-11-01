/**
 * @she-raksha/contracts
 * Polygon L2 Smart Contracts Suite, ABIs, and Deployment Specifications
 */

export const CONTRACTS_VERSION = '1.0.0';
export const BNSS_173_STATUTORY_TIMEOUT_SECONDS = 259200; // 72 Hours statutory deadline

export const CONTRACT_NAMES = {
  EVIDENCE_REGISTRY: 'EvidenceRegistry',
  SOS_LOG: 'SOSLog',
  GUARDIAN_REGISTRY: 'GuardianRegistry',
} as const;

export type ContractName = (typeof CONTRACT_NAMES)[keyof typeof CONTRACT_NAMES];
