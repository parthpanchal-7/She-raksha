/**
 * @she-raksha/schemas — SQLCipher Schema Exports
 *
 * Exports the raw SQLCipher DDL as a TypeScript string constant
 * (inline — no runtime file I/O) so packages/mobile can apply it
 * programmatically via react-native-sqlcipher / op-sqlite with SQLCipher.
 */

/**
 * Raw SQLCipher DDL for local_captures and offline_queue tables.
 * Apply via: db.execute(SQLCIPHER_DDL) after PRAGMA key is set.
 *
 * See: src/sqlcipher/sqlcipher_schema.sql for full annotated source.
 */
export const SQLCIPHER_DDL = `
-- She-Raksha On-Device SQLCipher DDL (v1.0.0)
-- Apply AFTER setting PRAGMA key from device enclave.
-- Zero plaintext on flash storage — NFR-SEC-001, NFR-SEC-002.

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA secure_delete = ON;

-- TABLE: local_captures
-- One row per 5-second AES-256-GCM encrypted media chunk.
-- iv_hex must be unique per chunk (CSPRNG 96-bit, never reused).
CREATE TABLE IF NOT EXISTS local_captures (
  capture_id        INTEGER   PRIMARY KEY AUTOINCREMENT,
  incident_id       TEXT      NOT NULL CHECK (length(incident_id) = 36),
  chunk_index       INTEGER   NOT NULL CHECK (chunk_index >= 0),
  media_type        TEXT      NOT NULL CHECK (media_type IN ('AUDIO_AAC', 'VIDEO_H265', 'SENSOR_TELEMETRY')),
  iv_hex            TEXT      NOT NULL CHECK (length(iv_hex) = 24),
  auth_tag_hex      TEXT      NOT NULL CHECK (length(auth_tag_hex) = 32),
  sha256_digest     TEXT      NOT NULL CHECK (length(sha256_digest) = 64),
  ciphertext_sha256 TEXT      NOT NULL CHECK (length(ciphertext_sha256) = 64),
  ipfs_cid          TEXT,
  ciphertext_bytes  INTEGER   NOT NULL CHECK (ciphertext_bytes > 0),
  chunk_duration_s  REAL      NOT NULL DEFAULT 5.0 CHECK (chunk_duration_s > 0),
  encrypted_at      TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  is_anchored       INTEGER   NOT NULL DEFAULT 0 CHECK (is_anchored IN (0, 1)),
  anchor_tx_hash    TEXT,
  anchored_at       TEXT,
  UNIQUE (incident_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS lc_incident_idx  ON local_captures (incident_id);
CREATE INDEX IF NOT EXISTS lc_anchored_idx  ON local_captures (is_anchored, incident_id);
CREATE INDEX IF NOT EXISTS lc_ipfs_cid_idx  ON local_captures (ipfs_cid) WHERE ipfs_cid IS NOT NULL;

-- TABLE: offline_queue
-- Encrypted payload blobs awaiting network delivery (exponential backoff).
-- payload_blob contains AES-256-GCM encrypted JSON — decrypted in RAM only.
CREATE TABLE IF NOT EXISTS offline_queue (
  queue_id          INTEGER   PRIMARY KEY AUTOINCREMENT,
  payload_blob      BLOB      NOT NULL,
  payload_type      TEXT      NOT NULL CHECK (payload_type IN (
                      'SOS_ALERT', 'EVIDENCE_CHUNK', 'EFIR_SUBMISSION',
                      'ZK_PROOF', 'GUARDIAN_UPDATE')),
  incident_id       TEXT      CHECK (incident_id IS NULL OR length(incident_id) = 36),
  status            TEXT      NOT NULL DEFAULT 'QUEUED' CHECK (status IN (
                      'QUEUED', 'RETRYING', 'DELIVERED', 'DEAD_LETTER')),
  retry_count       INTEGER   NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  max_retries       INTEGER   NOT NULL DEFAULT 10 CHECK (max_retries >= 1),
  last_attempt_at   TEXT,
  next_retry_at     TEXT,
  delivered_at      TEXT,
  last_error        TEXT,
  priority          INTEGER   NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  payload_bytes     INTEGER   NOT NULL CHECK (payload_bytes > 0),
  created_at        TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at        TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS oq_status_priority_idx ON offline_queue (status, priority, next_retry_at)
  WHERE status IN ('QUEUED', 'RETRYING');
CREATE INDEX IF NOT EXISTS oq_incident_idx        ON offline_queue (incident_id) WHERE incident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS oq_payload_type_idx    ON offline_queue (payload_type);
` as const;

/**
 * Builds the SQLCipher connection pragmas to apply immediately after opening the DB.
 * The key must be derived from the device enclave via HKDF-SHA256.
 *
 * @param keyHex - 32-byte AES key derived from device enclave (64 lowercase hex chars)
 */
export function buildSQLCipherPragmas(keyHex: string): string {
  if (!/^[0-9a-f]{64}$/.test(keyHex)) {
    throw new Error(
      'SQLCipher key must be a 64-character lowercase hex string (32 bytes). ' +
      'Derive it via HKDF-SHA256 from the device enclave — never hardcode.'
    );
  }
  return [
    `PRAGMA key = "x'${keyHex}'";`,
    `PRAGMA cipher_page_size = 4096;`,
    `PRAGMA kdf_iter = 256000;`,
    `PRAGMA cipher_hmac_algorithm = HMAC_SHA512;`,
    `PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;`,
    `PRAGMA journal_mode = WAL;`,
    `PRAGMA foreign_keys = ON;`,
    `PRAGMA secure_delete = ON;`,
  ].join('\n');
}

/**
 * HKDF-SHA256 info string for SQLCipher session key derivation.
 * Must match the info parameter used in packages/crypto-core HKDF-SHA256.
 */
export const SQLCIPHER_HKDF_INFO = 'she-raksha-sqlcipher-local-db' as const;

/**
 * Local capture table name constant.
 */
export const TABLE_LOCAL_CAPTURES = 'local_captures' as const;

/**
 * Offline queue table name constant.
 */
export const TABLE_OFFLINE_QUEUE = 'offline_queue' as const;
