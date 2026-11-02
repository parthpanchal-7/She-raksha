/**
 * @she-raksha/sdk — Public API
 * Unified Web3, ERC-4337 Account Abstraction & Decentralized Storage SDK
 *
 * Implements Phase 7:
 *  1. SmartAccountClient (Web3Auth MPC, W3C WebAuthn Passkeys, Gasless UserOperations, Paymaster)
 *  2. PinataVaultClient (Encrypted AES-256-GCM chunk streaming to IPFS/Filecoin CIDv1, >=3 node replication check)
 *  3. Typed contract bindings using viem for all 6+1 Polygon L2 contracts
 *  4. ZK attribute-redacting Aadhaar e-Sign wrapper (FR-ID-004, zero cleartext PII)
 */

export const SDK_VERSION = '1.0.0';

// 1. ABIs
export * from './abis/index.js';

// 2. Network Config & Defaults
export * from './config/index.js';

// 3. Smart Account Client (ERC-4337, Web3Auth MPC & Passkeys)
export * from './smart-account/index.js';

// 4. Decentralized Storage (Pinata IPFS/Filecoin Vault)
export * from './storage/index.js';

// 5. Typed Contract Services (viem)
export * from './contracts/index.js';

// 6. Aadhaar Privacy-Preserving e-Sign (FR-ID-004)
export * from './aadhaar/index.js';
