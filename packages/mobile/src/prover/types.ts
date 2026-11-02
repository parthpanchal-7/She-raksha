/**
 * @she-raksha/mobile — Zero-Knowledge Bystander Prover Types
 *
 * Implements Circom 2.1 / Groth16 anonymous bystander proving:
 *  - Semaphore identity commitment & depth-20 Merkle path
 *  - Geohash-6 spatial privacy shield (~1.2km x 0.6km)
 *  - 1-Hour temporal quantization window
 *  - Sybil-resistant Poseidon nullifier hash
 */

export interface BystanderReportRawInput {
  identitySecret: bigint | string;
  incidentId: bigint | string;
  exactLatitude: number;
  exactLongitude: number;
  exactTimestamp: number | Date;
  incidentCategoryCode: number; // 1: Assault/Modesty, 2: Harassment, 3: Stalking, 4: Threat
  salt?: bigint | string;
  description?: string;
  encryptedAttachmentCID?: string;
}

export interface SpatialQuantizationResult {
  geohash6: string;
  latScaled: bigint;
  longScaled: bigint;
  latBucket: bigint;
  longBucket: bigint;
  poseidonGeohashBucket: bigint;
}

export interface Groth16ProofComponents {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface BystanderProofResult {
  proof: Groth16ProofComponents;
  publicSignals: string[];
  poseidonNullifierHash: string;
  geohashBucket: string;
  geohash6: string;
  incidentCategoryCode: string;
  timestampBucketEpochHour: string;
  identityMerkleRoot: string;
  incidentId: string;
  provingTimeMs: number;
  isValid: boolean;
}

export interface ZKProverArtifacts {
  wasmPath?: string;
  zkeyPath?: string;
  vKeyPath?: string;
}
