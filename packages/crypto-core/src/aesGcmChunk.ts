/**
 * @she-raksha/crypto-core — AES-256-GCM 5-Second Media Chunker & Envelope Encryption
 *
 * Implements NFR-SEC-001, NFR-SEC-002, and NFR-PERF-001:
 *  - 5-second continuous media chunks encrypted in RAM using AES-256-GCM
 *  - Session keys derived via HKDF-SHA256 (info: "she-raksha-evidence-vault-ephemeral")
 *  - Unique CSPRNG 96-bit IV (12 bytes) and 128-bit auth tag (16 bytes) per chunk
 *  - Zero-Plaintext RAM Sanitization: buffer.fill(0) inside finally blocks immediately after encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, hkdfSync, createHash } from 'node:crypto';

export const HKDF_INFO_VAULT = 'she-raksha-evidence-vault-ephemeral' as const;
export const AES_GCM_IV_LENGTH = 12; // 96 bits
export const AES_GCM_TAG_LENGTH = 16; // 128 bits
export const AES_KEY_LENGTH = 32; // 256 bits

export interface EncryptedChunkResult {
  /** Ciphertext buffer (encrypted media) */
  ciphertext: Buffer;
  /** 96-bit IV as lowercase hex (24 chars) */
  ivHex: string;
  /** 128-bit authentication tag as lowercase hex (32 chars) */
  authTagHex: string;
  /** SHA-256 digest of plaintext computed in RAM before zero-fill (64 hex chars) */
  plaintextSha256: string;
  /** SHA-256 digest of ciphertext (64 hex chars) */
  ciphertextSha256: string;
  /** Ciphertext size in bytes */
  ciphertextBytes: number;
}

/**
 * Sanitizes sensitive memory by overwriting buffer contents with zeroes.
 */
export function sanitizeBuffer(buf: Buffer | Uint8Array): void {
  buf.fill(0);
}

/**
 * Derives an ephemeral AES-256 key from a master key/secret using HKDF-SHA256.
 *
 * @param masterSecret - High-entropy master key or device-enclave secret
 * @param salt - Salt for HKDF (minimum 16 bytes recommended)
 * @param sessionKeyId - Optional session identifier included in info context
 */
export function deriveSessionKey(
  masterSecret: Buffer | Uint8Array,
  salt: Buffer | Uint8Array,
  sessionKeyId?: string
): Buffer {
  const info = sessionKeyId
    ? `${HKDF_INFO_VAULT}:${sessionKeyId}`
    : HKDF_INFO_VAULT;

  const derived = hkdfSync(
    'sha256',
    masterSecret,
    salt,
    Buffer.from(info, 'utf-8'),
    AES_KEY_LENGTH
  );

  return Buffer.from(derived);
}

/**
 * Encrypts a 5-second media chunk in RAM using AES-256-GCM.
 * Explicitly sanitizes (zero-fills) the plaintext buffer in a `finally` block.
 *
 * @param plaintext - Raw audio/video/sensor bytes in memory (will be zero-filled!)
 * @param sessionKey - 32-byte AES-256 key derived via HKDF
 * @param wipePlaintext - If true (default), zeroes plaintext buffer after encryption
 */
export function encryptMediaChunk(
  plaintext: Buffer,
  sessionKey: Buffer,
  wipePlaintext: boolean = true
): EncryptedChunkResult {
  if (sessionKey.length !== AES_KEY_LENGTH) {
    throw new Error(`Invalid session key length: expected ${AES_KEY_LENGTH} bytes, got ${sessionKey.length}`);
  }

  // 1. Generate unique CSPRNG 96-bit IV
  const iv = randomBytes(AES_GCM_IV_LENGTH);

  try {
    // 2. Compute SHA-256 of plaintext in RAM before encryption (for Merkle tree & BSA §63)
    const plaintextSha256 = createHash('sha256').update(plaintext).digest('hex');

    // 3. Encrypt via AES-256-GCM
    const cipher = createCipheriv('aes-256-gcm', sessionKey, iv, {
      authTagLength: AES_GCM_TAG_LENGTH,
    });

    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const ciphertextSha256 = createHash('sha256').update(ciphertext).digest('hex');

    return {
      ciphertext,
      ivHex: iv.toString('hex'),
      authTagHex: authTag.toString('hex'),
      plaintextSha256,
      ciphertextSha256,
      ciphertextBytes: ciphertext.length,
    };
  } finally {
    // 4. Invariant NFR-SEC-001 & NFR-SEC-002: Overwrite plaintext buffer in RAM immediately
    if (wipePlaintext) {
      sanitizeBuffer(plaintext);
    }
  }
}

/**
 * Decrypts an AES-256-GCM encrypted media chunk.
 *
 * @param ciphertext - Encrypted chunk bytes
 * @param sessionKey - 32-byte AES-256 key
 * @param iv - 12-byte IV (Buffer or hex string)
 * @param authTag - 16-byte auth tag (Buffer or hex string)
 */
export function decryptMediaChunk(
  ciphertext: Buffer,
  sessionKey: Buffer,
  iv: Buffer | string,
  authTag: Buffer | string
): Buffer {
  const ivBuf = typeof iv === 'string' ? Buffer.from(iv, 'hex') : iv;
  const tagBuf = typeof authTag === 'string' ? Buffer.from(authTag, 'hex') : authTag;

  if (sessionKey.length !== AES_KEY_LENGTH) {
    throw new Error(`Invalid session key length: expected ${AES_KEY_LENGTH} bytes`);
  }
  if (ivBuf.length !== AES_GCM_IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${AES_GCM_IV_LENGTH} bytes`);
  }
  if (tagBuf.length !== AES_GCM_TAG_LENGTH) {
    throw new Error(`Invalid auth tag length: expected ${AES_GCM_TAG_LENGTH} bytes`);
  }

  const decipher = createDecipheriv('aes-256-gcm', sessionKey, ivBuf, {
    authTagLength: AES_GCM_TAG_LENGTH,
  });
  decipher.setAuthTag(tagBuf);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

