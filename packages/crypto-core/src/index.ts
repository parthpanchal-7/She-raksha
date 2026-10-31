/**
 * @she-raksha/crypto-core — Public API
 *
 * Client-Side Cryptographic Engine & Zero-Plaintext RAM Sanitizer
 *
 * Implements:
 *  - 5-second chunked AES-256-GCM envelope encryption (NFR-SEC-001, NFR-SEC-002, NFR-PERF-001)
 *  - HKDF-SHA256 session key derivation
 *  - Incremental SHA-256 Merkle tree builder for EvidenceRegistry.sol
 *  - High-density Base91 GSM-7 SMS serializer/decoder (< 140B raw, <= 160 GSM-7 chars)
 *  - X25519-XSalsa20-Poly1305 asymmetric envelope encryption for emergency contacts
 *  - Zero-plaintext RAM sanitization (buffer.fill(0))
 */

export const CRYPTO_CORE_VERSION = '1.0.0';

// 1. AES-256-GCM 5-Second Media Chunker
export {
  HKDF_INFO_VAULT,
  AES_GCM_IV_LENGTH,
  AES_GCM_TAG_LENGTH,
  AES_KEY_LENGTH,
  type EncryptedChunkResult,
  sanitizeBuffer,
  deriveSessionKey,
  encryptMediaChunk,
  decryptMediaChunk,
} from './aesGcmChunk.js';

// 2. Incremental SHA-256 Merkle Tree Builder
export {
  sha256,
  hashPair,
  type MerkleProof,
  IncrementalMerkleTree,
} from './merkleTree.js';

// 3. Base91 Codec & Rail B SMS Serializer
export {
  BASE91_ALPHABET,
  base91Encode,
  base91Decode,
} from './base91Codec.js';

export {
  type SOSAlertSMSPayload,
  serializeSOSToBinary,
  deserializeSOSFromBinary,
  serializeSOSToBase91SMS,
  deserializeSOSFromBase91SMS,
} from './smsSerializer.js';

// 4. X25519-XSalsa20-Poly1305 Asymmetric Envelope Encryption
export {
  type AsymmetricKeyPair,
  type EncryptedContactEnvelope,
  type ContactDetails,
  generateAsymmetricKeyPair,
  encryptContactDetails,
  decryptContactDetails,
} from './asymmetricBox.js';
