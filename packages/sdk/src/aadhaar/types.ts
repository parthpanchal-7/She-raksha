/**
 * @she-raksha/sdk — Aadhaar e-Sign Types
 * Zero-knowledge attribute redaction types conforming to FR-ID-004 and DPDP Act 2023.
 */

import { type Hex } from 'viem';

export type GenderCode = 'F' | 'M' | 'T' | 'PREFER_NOT_TO_SAY';

export interface AadhaarSignOptions {
  /** 32-byte SHA-256 hash of the e-FIR record */
  efirHash: Hex;
  /** Unique complaint ID (numeric or UUID) */
  complaintId: string | bigint;
  /** Mock/simulated Aadhaar token or India Stack e-Sign assertion */
  rawESignToken?: string;
  /** Signer's state code (2-letter ISO, e.g. 'DL', 'MH') */
  stateCode?: string;
  /** Declared/verified gender */
  gender?: GenderCode;
  /** Verified age (must be >= 18 for independent legal complaint execution) */
  age?: number;
}

export interface AadhaarRedactedDisclosure {
  /** 32-byte SHA-256 digest of the Aadhaar e-Sign verification token (stored in efir_records) */
  aadhaarSignHash: Hex;
  /** eFIR document digest signed */
  efirHash: Hex;
  /** Parent complaint ID */
  complaintId: string;
  /** Zero-knowledge proof that signer is >= 18 without disclosing exact date of birth */
  isAgeAbove18: boolean;
  /** Verified gender attribute */
  gender: GenderCode;
  /** 2-letter state code for jurisdiction routing without disclosing street address */
  stateCode: string;
  /** Poseidon/SHA-256 nullifier preventing sybil complaints without de-anonymizing survivor */
  nullifierHash: Hex;
  /** ISO 8601 UTC timestamp of signature execution */
  signedAt: string;
  /** Whether the cryptographic signature and ZK proof have been verified */
  isVerified: boolean;
  /** ZK proof parameters (if SNARK-backed e-Sign) */
  zkProof?: {
    a: [Hex, Hex];
    b: [[Hex, Hex], [Hex, Hex]];
    c: [Hex, Hex];
  };
}

export interface AadhaarVerificationResult {
  isValid: boolean;
  aadhaarSignHash: Hex;
  nullifierHash: Hex;
  isAgeAbove18: boolean;
  hasRedactedCleartextPII: boolean; // Must be true (asserts 0 cleartext Aadhaar number)
  verifiedAt: string;
}
