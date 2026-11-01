/**
 * @she-raksha/contracts
 * Polygon L2 Smart Contracts Suite, ABIs, and Deployment Specifications
 */

export const CONTRACTS_VERSION = '1.0.0';

/** Statutory 72-hour signing deadline constant under BNSS Section 173 (259,200 seconds) */
export const BNSS_173_STATUTORY_TIMEOUT_SECONDS = 259200;

/** Optional 48-hour NGO early warning threshold (172,800 seconds) */
export const NGO_EARLY_WARNING_SECONDS = 172800;

export const CONTRACT_NAMES = {
  EVIDENCE_REGISTRY: 'EvidenceRegistry',
  SOS_LOG: 'SOSLog',
  GUARDIAN_REGISTRY: 'GuardianRegistry',
  COMPLAINT_ESCROW: 'ComplaintEscrow',
  ZK_REPORT_VERIFIER: 'ZKReportVerifier',
  ACCESS_GRANT: 'AccessGrant',
  PAYMASTER: 'SheRakshaPaymaster',
} as const;

export type ContractName = (typeof CONTRACT_NAMES)[keyof typeof CONTRACT_NAMES];
