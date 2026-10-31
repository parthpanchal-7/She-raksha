/**
 * @she-raksha/crypto-core — X25519-XSalsa20-Poly1305 Asymmetric Envelope Encryption
 *
 * Implements DPDP Act 2023 §5 zero cleartext PII invariant for emergency_contacts:
 *  - Contact PII (name, phone number, relationship) is encrypted client-side using
 *    X25519-XSalsa20-Poly1305 (NaCl box) before reaching the central database.
 *  - Stored in PostgreSQL as encrypted_contact_details BYTEA.
 *  - Decryptable ONLY by the authorized user's device enclave key.
 */

import nacl from 'tweetnacl';

export interface AsymmetricKeyPair {
  publicKeyHex: string;
  secretKeyHex: string;
}

export interface EncryptedContactEnvelope {
  /** Combined nonce (24 bytes) + ciphertext (includes 16-byte Poly1305 tag) */
  encryptedBlob: Buffer;
  /** Ephemeral sender public key used for this envelope (32 bytes hex) */
  ephemeralPublicKeyHex: string;
}

export interface ContactDetails {
  name: string;
  phoneE164: string;
  relationship: string;
  [key: string]: unknown;
}

/**
 * Generates an X25519 key pair for asymmetric envelope encryption.
 */
export function generateAsymmetricKeyPair(): AsymmetricKeyPair {
  const pair = nacl.box.keyPair();
  return {
    publicKeyHex: Buffer.from(pair.publicKey).toString('hex'),
    secretKeyHex: Buffer.from(pair.secretKey).toString('hex'),
  };
}

/**
 * Encrypts contact details JSON using X25519-XSalsa20-Poly1305 envelope.
 * Uses an ephemeral key pair for forward secrecy so each contact has a distinct nonce/key.
 *
 * @param contactDetails - PII object to encrypt
 * @param recipientPublicKeyHex - Recipient's 32-byte X25519 public key (hex)
 */
export function encryptContactDetails(
  contactDetails: ContactDetails,
  recipientPublicKeyHex: string
): EncryptedContactEnvelope {
  const recipientPubKey = Buffer.from(recipientPublicKeyHex, 'hex');
  if (recipientPubKey.length !== nacl.box.publicKeyLength) {
    throw new Error(`Invalid recipient public key length: expected ${nacl.box.publicKeyLength} bytes`);
  }

  // Generate ephemeral sender key pair for this encryption session
  const ephemeralPair = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const plaintextJson = JSON.stringify(contactDetails);
  const plaintextBytes = Buffer.from(plaintextJson, 'utf-8');

  // Encrypt with nacl.box (X25519 ECDH + XSalsa20 + Poly1305)
  const ciphertext = nacl.box(
    new Uint8Array(plaintextBytes),
    nonce,
    new Uint8Array(recipientPubKey),
    ephemeralPair.secretKey
  );

  // Pack nonce (24 bytes) + ciphertext into a single byte buffer for DB BYTEA storage
  const combined = Buffer.concat([Buffer.from(nonce), Buffer.from(ciphertext)]);

  // Overwrite plaintext bytes in memory
  plaintextBytes.fill(0);

  return {
    encryptedBlob: combined,
    ephemeralPublicKeyHex: Buffer.from(ephemeralPair.publicKey).toString('hex'),
  };
}

/**
 * Decrypts an X25519-XSalsa20-Poly1305 encrypted contact details blob.
 *
 * @param encryptedBlob - Combined 24-byte nonce + ciphertext
 * @param ephemeralPublicKeyHex - Sender/ephemeral 32-byte public key (hex)
 * @param recipientSecretKeyHex - Recipient's 32-byte X25519 secret key (hex)
 */
export function decryptContactDetails<T = ContactDetails>(
  encryptedBlob: Buffer,
  ephemeralPublicKeyHex: string,
  recipientSecretKeyHex: string
): T {
  const nonceLength = nacl.box.nonceLength;
  if (encryptedBlob.length <= nonceLength + nacl.box.overheadLength) {
    throw new Error('Encrypted blob is too short');
  }

  const nonce = new Uint8Array(encryptedBlob.subarray(0, nonceLength));
  const ciphertext = new Uint8Array(encryptedBlob.subarray(nonceLength));

  const ephemeralPubKey = new Uint8Array(Buffer.from(ephemeralPublicKeyHex, 'hex'));
  const recipientSecKey = new Uint8Array(Buffer.from(recipientSecretKeyHex, 'hex'));

  const decrypted = nacl.box.open(ciphertext, nonce, ephemeralPubKey, recipientSecKey);
  if (!decrypted) {
    throw new Error('Decryption failed: invalid ciphertext, public key, or secret key');
  }

  const jsonString = Buffer.from(decrypted).toString('utf-8');
  return JSON.parse(jsonString) as T;
}
