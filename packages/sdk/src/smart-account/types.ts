/**
 * @she-raksha/sdk — Smart Account Types
 * ERC-4337 UserOperation, Web3Auth MPC, and WebAuthn Passkey interfaces
 */

import { type Address, type Hex } from 'viem';

/**
 * Canonical ERC-4337 v0.6 UserOperation struct
 */
export interface UserOperation {
  sender: Address;
  nonce: bigint;
  initCode: Hex;
  callData: Hex;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: Hex;
  signature: Hex;
}

export interface UserOperationReceipt {
  userOpHash: Hex;
  sender: Address;
  nonce: bigint;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  success: boolean;
  receipt?: {
    transactionHash: Hex;
    blockNumber: bigint;
    blockHash: Hex;
  };
}

export interface PasskeyCredential {
  /** Credential ID (base64url or hex) */
  credentialId: string;
  /** Public key as hex (secp256r1 or secp256k1) */
  publicKeyHex: Hex;
  /** Derived EVM signer address */
  signerAddress: Address;
  /** Algorithm: ES256 (secp256r1) or Web3Auth MPC */
  algorithm: 'ES256' | 'secp256k1' | 'Web3Auth-MPC';
  /** Biometric modality */
  biometricType: 'FaceID' | 'Fingerprint' | 'TouchID' | 'Passkey';
}

export interface Web3AuthMPCSession {
  /** Decentralized identifier (DID) */
  did: string;
  /** User's deterministic ERC-4337 Smart Account address */
  smartAccountAddress: Address;
  /** Ephemeral signer address (Web3Auth MPC key share) */
  ownerSignerAddress: Address;
  /** ISO 8601 timestamp of session creation */
  authenticatedAt: string;
}

export interface PaymasterSponsorshipRequest {
  target: Address;
  callData: Hex;
  sender: Address;
  nonce: bigint;
  validityWindowSeconds?: number;
}

export interface PaymasterSponsorshipResult {
  paymasterAddress: Address;
  paymasterAndData: Hex;
  validUntil: number;
  validAfter: number;
  signature: Hex;
}

export interface GaslessTransactionParams {
  target: Address;
  data: Hex;
  value?: bigint;
}

export interface GaslessExecutionResult {
  userOpHash: Hex;
  sender: Address;
  target: Address;
  isSponsored: boolean;
  wait: () => Promise<UserOperationReceipt>;
}

