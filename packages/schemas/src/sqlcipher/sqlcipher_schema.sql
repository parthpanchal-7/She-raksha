-- =============================================================================
-- She-Raksha On-Device SQLCipher DDL
-- File: sqlcipher_schema.sql
-- Phase: Development Phase 2 — On-Device Encrypted Local Storage
-- =============================================================================
-- These DDL statements are applied to a SQLCipher-encrypted SQLite database
-- on the user's device (Android/iOS). The database key is derived from the
-- device hardware enclave (Android StrongBox / iOS Secure Enclave).
--
-- SECURITY INVARIANTS:
--   1. The SQLCipher database itself is encrypted at rest with AES-256-CBC.
--   2. local_captures stores only ciphertext, IV, auth tag, and digests —
--      NO plaintext media ever touches the database or flash storage (NFR-SEC-001).
--   3. offline_queue stores encrypted, serialized payload blobs for retry.
--   4. The database encryption key is NEVER written to flash — only held in
--      the device enclave and derived per-session via HKDF-SHA256.
--
-- SQLCipher 4.x pragmas applied at connection time (in packages/mobile):
--   PRAGMA key = '<device-enclave-derived-key>';
--   PRAGMA cipher_page_size = 4096;
--   PRAGMA kdf_iter = 256000;
--   PRAGMA cipher_hmac_algorithm = HMAC_SHA512;
--   PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;
-- =============================================================================

-- ---------------------------------------------------------------------------
-- TABLE: local_captures
-- One row per 5-second AES-256-GCM encrypted media chunk.
-- NEVER contains plaintext audio/video/sensor data.
-- Stores: chunk metadata, IV, auth tag, SHA-256 digests, IPFS CID, anchor status.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS local_captures (
  -- Auto-increment local primary key
  capture_id        INTEGER   PRIMARY KEY AUTOINCREMENT,
  -- Parent incident UUID (matches sos_incidents.incident_id in PostgreSQL)
  incident_id       TEXT      NOT NULL
                      CHECK (length(incident_id) = 36),
  -- Sequential 0-indexed chunk position within the capture session
  chunk_index       INTEGER   NOT NULL CHECK (chunk_index >= 0),
  -- Media type: 'AUDIO_AAC' | 'VIDEO_H265' | 'SENSOR_TELEMETRY'
  media_type        TEXT      NOT NULL
                      CHECK (media_type IN ('AUDIO_AAC', 'VIDEO_H265', 'SENSOR_TELEMETRY')),
  -- AES-256-GCM 96-bit IV as lowercase hex (24 chars = 12 bytes)
  -- SKILL.MD invariant: unique CSPRNG IV per chunk — NEVER reused
  iv_hex            TEXT      NOT NULL
                      CHECK (length(iv_hex) = 24 AND iv_hex GLOB '[0-9a-f]*'),
  -- AES-256-GCM 128-bit authentication tag as lowercase hex (32 chars = 16 bytes)
  auth_tag_hex      TEXT      NOT NULL
                      CHECK (length(auth_tag_hex) = 32 AND auth_tag_hex GLOB '[0-9a-f]*'),
  -- SHA-256 digest of the raw PLAINTEXT chunk computed in RAM before zero-fill
  -- Used for Merkle tree construction and BSA §63 hash chain verification
  -- NEVER reflects plaintext content stored anywhere on flash
  sha256_digest     TEXT      NOT NULL
                      CHECK (length(sha256_digest) = 64 AND sha256_digest GLOB '[0-9a-f]*'),
  -- SHA-256 digest of the ciphertext blob (integrity check for the stored blob)
  ciphertext_sha256 TEXT      NOT NULL
                      CHECK (length(ciphertext_sha256) = 64 AND ciphertext_sha256 GLOB '[0-9a-f]*'),
  -- IPFS CIDv1 of the encrypted chunk blob pinned via Pinata mTLS
  -- NULL if not yet uploaded (pending offline sync)
  ipfs_cid          TEXT,
  -- Size of the encrypted chunk in bytes
  ciphertext_bytes  INTEGER   NOT NULL CHECK (ciphertext_bytes > 0),
  -- Nominal chunk duration in seconds (target: 5)
  chunk_duration_s  REAL      NOT NULL DEFAULT 5.0 CHECK (chunk_duration_s > 0),
  -- ISO 8601 UTC timestamp when this chunk was encrypted
  encrypted_at      TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- Whether this chunk hash has been anchored on EvidenceRegistry.sol
  -- 0 = not anchored, 1 = anchored
  is_anchored       INTEGER   NOT NULL DEFAULT 0 CHECK (is_anchored IN (0, 1)),
  -- Polygon L2 transaction hash of the EvidenceRegistry.sol anchoring tx
  anchor_tx_hash    TEXT
                      CHECK (anchor_tx_hash IS NULL OR
                             (length(anchor_tx_hash) = 66 AND anchor_tx_hash GLOB '0x*')),
  -- ISO 8601 timestamp when chunk was anchored on-chain
  anchored_at       TEXT,
  -- UNIQUE constraint: one row per (incident, chunk_index)
  UNIQUE (incident_id, chunk_index)
);

-- Indexes for local_captures
CREATE INDEX IF NOT EXISTS lc_incident_idx  ON local_captures (incident_id);
CREATE INDEX IF NOT EXISTS lc_anchored_idx  ON local_captures (is_anchored, incident_id);
CREATE INDEX IF NOT EXISTS lc_ipfs_cid_idx  ON local_captures (ipfs_cid) WHERE ipfs_cid IS NOT NULL;

-- ---------------------------------------------------------------------------
-- TABLE: offline_queue
-- Encrypted payload blobs awaiting network delivery with exponential backoff.
-- Used when Rail A (WSS) is unavailable and the device reconnects.
-- payload_blob contains serialized, AES-256-GCM encrypted JSON payloads.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offline_queue (
  -- Auto-increment local primary key
  queue_id          INTEGER   PRIMARY KEY AUTOINCREMENT,
  -- Serialized + AES-256-GCM encrypted payload blob (opaque bytes)
  -- Decrypted in RAM, zero-filled after delivery — never decrypted to flash
  payload_blob      BLOB      NOT NULL,
  -- Payload type for deserialization routing after decryption
  -- 'SOS_ALERT' | 'EVIDENCE_CHUNK' | 'EFIR_SUBMISSION' | 'ZK_PROOF' | 'GUARDIAN_UPDATE'
  payload_type      TEXT      NOT NULL
                      CHECK (payload_type IN (
                        'SOS_ALERT', 'EVIDENCE_CHUNK', 'EFIR_SUBMISSION',
                        'ZK_PROOF', 'GUARDIAN_UPDATE'
                      )),
  -- Parent incident UUID (for correlation; may be NULL for GUARDIAN_UPDATE)
  incident_id       TEXT
                      CHECK (incident_id IS NULL OR length(incident_id) = 36),
  -- Delivery state machine
  -- 'QUEUED' | 'RETRYING' | 'DELIVERED' | 'DEAD_LETTER'
  status            TEXT      NOT NULL DEFAULT 'QUEUED'
                      CHECK (status IN ('QUEUED', 'RETRYING', 'DELIVERED', 'DEAD_LETTER')),
  -- Number of delivery attempts so far (0 = not yet attempted)
  retry_count       INTEGER   NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  -- Maximum retry attempts before marking DEAD_LETTER (configurable, default 10)
  max_retries       INTEGER   NOT NULL DEFAULT 10 CHECK (max_retries >= 1),
  -- ISO 8601 UTC timestamp of the last delivery attempt
  last_attempt_at   TEXT,
  -- ISO 8601 UTC timestamp of next scheduled retry (exponential backoff)
  next_retry_at     TEXT,
  -- ISO 8601 UTC timestamp when successfully delivered
  delivered_at      TEXT,
  -- Last error message (if status = RETRYING or DEAD_LETTER)
  last_error        TEXT,
  -- Priority: 1 = highest (SOS alerts), 5 = lowest (guardian updates)
  priority          INTEGER   NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  -- Size of the payload blob in bytes (for monitoring)
  payload_bytes     INTEGER   NOT NULL CHECK (payload_bytes > 0),
  -- ISO 8601 UTC timestamp when this entry was enqueued
  created_at        TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  -- ISO 8601 UTC timestamp when status last changed
  updated_at        TEXT      NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- Indexes for offline_queue
CREATE INDEX IF NOT EXISTS oq_status_priority_idx ON offline_queue (status, priority, next_retry_at)
  WHERE status IN ('QUEUED', 'RETRYING');
CREATE INDEX IF NOT EXISTS oq_incident_idx        ON offline_queue (incident_id) WHERE incident_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS oq_payload_type_idx    ON offline_queue (payload_type);
CREATE INDEX IF NOT EXISTS oq_delivered_idx       ON offline_queue (status) WHERE status = 'DELIVERED';

-- ---------------------------------------------------------------------------
-- SQLCipher connection pragma template (apply at DB open time in packages/mobile)
-- ---------------------------------------------------------------------------
-- PRAGMA key = '<HKDF-SHA256 derived key from device enclave>';
-- PRAGMA cipher_page_size = 4096;
-- PRAGMA kdf_iter = 256000;
-- PRAGMA cipher_hmac_algorithm = HMAC_SHA512;
-- PRAGMA cipher_kdf_algorithm = PBKDF2_HMAC_SHA512;
-- PRAGMA journal_mode = WAL;
-- PRAGMA foreign_keys = ON;
-- PRAGMA secure_delete = ON;  -- Zero-fill deleted pages
-- ---------------------------------------------------------------------------

