-- =============================================================================
-- She-Raksha PostgreSQL 16 + PostGIS 3.4 Migration
-- Migration: 001_init_core_schema.sql
-- Phase: Development Phase 2 — Canonical Data Contracts & Multi-Tier DB Schemas
-- =============================================================================
-- 3NF design. Zero cleartext PII (DPDP Act 2023).
-- Phone numbers stored as salted SHA-256 hashes only.
-- All PII stored client-side encrypted (X25519-XSalsa20-Poly1305) in BYTEA blobs.
-- PostGIS GEOGRAPHY(Point, 4326) for guardian proximity matching (H3 Res 9, 800m).
-- PostGIS GEOMETRY(Point, 4326) GiST index for SOS incident spatial queries.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Enable required PostgreSQL extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS postgis;       -- PostGIS 3.4 spatial types & functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;      -- gen_random_uuid(), digest(), crypt()
CREATE EXTENSION IF NOT EXISTS btree_gist;    -- GiST index support for exclusion constraints

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

CREATE TYPE trigger_mode AS ENUM (
  'HARDWARE_TAP_FOUR_PRESS',
  'SHAKE_ACCELEROMETER',
  'VOICE_DURESS_TFLITE',
  'FALL_DETECTION',
  'DEAD_MAN_SWITCH',
  'MANUAL_BUTTON'
);
COMMENT ON TYPE trigger_mode IS
  'Unified SOS trigger mode — single source of truth matching TriggerMode enum in @she-raksha/schemas';

CREATE TYPE sos_status AS ENUM (
  'INITIATED',
  'DISPATCHING',
  'ACKNOWLEDGED',
  'RESOLVED',
  'CANCELLED',
  'ESCALATED'
);

CREATE TYPE dispatch_rail AS ENUM (
  'RAIL_A_WSS',
  'RAIL_B_SMS',
  'RAIL_C_BLE'
);

CREATE TYPE dispatch_status AS ENUM (
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'TIMEOUT'
);

CREATE TYPE efir_status AS ENUM (
  'PENDING_SIGN',
  'SIGNED',
  'ACKNOWLEDGED',
  'DEADLINE_BREACHED',
  'ESCALATED_SP'
);

CREATE TYPE bns_section AS ENUM (
  'BNS_74',
  'BNS_75',
  'BNS_78',
  'BNS_351_2'
);

-- ---------------------------------------------------------------------------
-- TABLE: users
-- Central user identity — zero cleartext PII stored here.
-- Phone is stored ONLY as a salted SHA-256 hash (pgcrypto gen_salt()).
-- All PII fields are client-side X25519-XSalsa20-Poly1305 encrypted BYTEA.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ERC-4337 Smart Account address (no wallet seed/PK here)
  smart_account_address      CHAR(42)    NOT NULL UNIQUE
                               CHECK (smart_account_address ~ '^0x[0-9a-fA-F]{40}$'),
  -- Web3Auth MPC DID (no raw identity secret)
  web3auth_did               TEXT        NOT NULL UNIQUE,
  -- Salted SHA-256 of the user's phone for deduplication only
  -- pgcrypto crypt() with bcrypt salt; NEVER store raw number
  phone_hash                 CHAR(64)    NOT NULL UNIQUE
                               CHECK (length(phone_hash) = 64),
  -- Client-side encrypted profile blob (X25519-XSalsa20-Poly1305)
  -- Contains: display name, preferred language, emergency contact ordering
  encrypted_profile_blob     BYTEA       NOT NULL,
  -- X25519 public key used to encrypt the profile blob
  profile_encryption_pubkey  CHAR(64)    NOT NULL,
  -- Whether the user has completed Aadhaar e-KYC (no Aadhaar number stored)
  is_kyc_verified            BOOLEAN     NOT NULL DEFAULT FALSE,
  -- ISO 639-1 preferred language code (22 Eighth Schedule languages)
  preferred_language         CHAR(2)     NOT NULL DEFAULT 'hi',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS
  'Central user identity table. Zero cleartext PII. Phone stored as salted SHA-256 hash only. '
  'All profile data is client-side encrypted (X25519-XSalsa20-Poly1305). DPDP Act 2023 compliant.';

CREATE INDEX IF NOT EXISTS users_smart_account_idx ON users (smart_account_address);

-- ---------------------------------------------------------------------------
-- TABLE: emergency_contacts
-- Salted phone hash + encrypted contact details blob. Zero cleartext PII.
-- Priority tiers 1-5 (Rail B SMS dispatch order per SKILL.MD).
-- CASCADE on user delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emergency_contacts (
  contact_id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL
    REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- Priority tier 1 (highest) to 5 (lowest) for Rail B SMS dispatch ordering
  priority_tier               SMALLINT    NOT NULL CHECK (priority_tier BETWEEN 1 AND 5),
  -- Salted SHA-256 hash of the contact's phone number for deduplication
  -- NEVER store the raw phone number — DPDP Act 2023 §5
  contact_phone_hash          CHAR(64)    NOT NULL
                                CHECK (length(contact_phone_hash) = 64),
  -- X25519-XSalsa20-Poly1305 encrypted blob containing:
  --   { name: string, phoneE164: string, relationship: string }
  encrypted_contact_details   BYTEA       NOT NULL,
  -- X25519 public key used for this contact's encryption envelope
  contact_encryption_pubkey   CHAR(64)    NOT NULL,
  -- Whether the contact has accepted a guardian invitation (for app users)
  is_confirmed                BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce unique phone hash per user (no duplicate contacts)
  CONSTRAINT uq_user_contact_phone UNIQUE (user_id, contact_phone_hash)
);

COMMENT ON TABLE emergency_contacts IS
  'Emergency contacts with salted SHA-256 phone hash and X25519-XSalsa20-Poly1305 encrypted PII. '
  'Priority tiers 1-5 determine Rail B SMS dispatch order. CASCADE on user delete.';

COMMENT ON COLUMN emergency_contacts.contact_phone_hash IS
  'Salted SHA-256 CHAR(64) — used ONLY for deduplication. Never store raw phone number (DPDP Act 2023 §5).';

COMMENT ON COLUMN emergency_contacts.encrypted_contact_details IS
  'Client-side asymmetrically encrypted BYTEA (X25519-XSalsa20-Poly1305). '
  'Decryptable ONLY by the user''s device enclave key. Zero server-side PII.';

CREATE INDEX IF NOT EXISTS ec_user_id_idx        ON emergency_contacts (user_id);
CREATE INDEX IF NOT EXISTS ec_priority_tier_idx  ON emergency_contacts (user_id, priority_tier);

-- ---------------------------------------------------------------------------
-- TABLE: guardians
-- Spatial guardian network with GEOGRAPHY(Point, 4326) for H3 Res 9 matching.
-- GiST index for ST_DWithin() 800m proximity queries.
-- CASCADE on user delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS guardians (
  guardian_id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID           NOT NULL
    REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- PostGIS GEOGRAPHY(Point, 4326) — WGS-84 for precise spherical distance
  -- ST_DWithin() uses this for 800m H3 Res-9 active dispatch matching
  geom                         GEOGRAPHY(Point, 4326) NOT NULL,
  -- Guardian's configurable notification radius ceiling (meters)
  -- SKILL.MD canonical rule: default 2000m ceiling, 800m active dispatch radius
  radius_meters                INTEGER        NOT NULL DEFAULT 2000
                                 CHECK (radius_meters BETWEEN 100 AND 50000),
  -- Uber H3 index at Resolution 9 (~100m hexagon) for fast spatial joins
  h3_index_res9                TEXT           NOT NULL,
  -- Whether the guardian is currently actively monitoring (heartbeat-based)
  is_active                    BOOLEAN        NOT NULL DEFAULT FALSE,
  -- Guardian stake on GuardianRegistry.sol (in wei, for accountability)
  stake_wei                    NUMERIC(78, 0) NOT NULL DEFAULT 0,
  -- GuardianRegistry.sol on-chain identifier
  on_chain_guardian_id         CHAR(66)
                                 CHECK (on_chain_guardian_id ~ '^0x[0-9a-fA-F]{64}$'),
  last_heartbeat_at            TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE guardians IS
  'Spatial guardian network. geom GEOGRAPHY(Point, 4326) with GiST index for '
  'ST_DWithin() 800m proximity matching. H3 Res-9 index for spatial joins. '
  'radius_meters default 2000m is guardian''s configurable ceiling per SKILL.MD.';

COMMENT ON COLUMN guardians.geom IS
  'PostGIS GEOGRAPHY(Point, 4326) — WGS-84 for spherical ST_DWithin() accuracy. '
  'Used by backend PostGIS/H3 guardian matcher (Phase 8).';

COMMENT ON COLUMN guardians.radius_meters IS
  'Guardian configurable notification ceiling in meters. Default 2000m. '
  'Active dispatch radius is fixed at 800m per SKILL.MD canonical rule.';

-- GiST spatial index on GEOGRAPHY — enables ST_DWithin() index scan
CREATE INDEX IF NOT EXISTS guardians_geom_gist_idx ON guardians USING GIST (geom);
CREATE INDEX IF NOT EXISTS guardians_user_id_idx   ON guardians (user_id);
CREATE INDEX IF NOT EXISTS guardians_active_idx    ON guardians (is_active) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- TABLE: sos_incidents
-- Core incident record. geom GEOMETRY(Point, 4326) GiST index for spatial queries.
-- RESTRICT on user delete (incidents must be preserved for legal purposes).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_incidents (
  incident_id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID           NOT NULL
    REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  -- How the SOS was triggered
  trigger_mode               trigger_mode   NOT NULL,
  -- Current lifecycle state
  status                     sos_status     NOT NULL DEFAULT 'INITIATED',
  -- PostGIS GEOMETRY(Point, 4326) for 2D spatial queries and display
  -- No raw coordinate stored in cleartext columns — only in PostGIS geom
  geom                       GEOMETRY(Point, 4326),
  -- Geohash-6 spatial bucket (~1.2km x 0.6km) — matches Circom public input
  -- and anonymous_reports.spatial_bucket for correlation without de-anonymization
  spatial_bucket             VARCHAR(6)
                               CHECK (spatial_bucket ~ '^[0-9b-hjkmnp-z]{6}$'),
  -- Session Merkle root accumulated from AES-256-GCM chunk hashes
  session_merkle_root        CHAR(64)
                               CHECK (length(session_merkle_root) = 64),
  -- IPFS CIDv1 of the encrypted evidence bundle
  evidence_bundle_cid        TEXT,
  -- EvidenceRegistry.sol on-chain anchoring transaction
  evidence_anchor_tx_hash    CHAR(66)
                               CHECK (evidence_anchor_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  -- Number of 5-second encrypted chunks captured
  total_chunks               INTEGER        NOT NULL DEFAULT 0 CHECK (total_chunks >= 0),
  -- Peak accelerometer reading at trigger (g-force, for shake/fall triggers)
  peak_acceleration_g        NUMERIC(5, 3),
  triggered_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  resolved_at                TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sos_incidents IS
  'Core SOS incident record. RESTRICT on user delete (legal preservation). '
  'geom GEOMETRY(Point, 4326) with GiST for spatial queries. '
  'spatial_bucket (geohash-6) for ZK circuit correlation.';

COMMENT ON COLUMN sos_incidents.geom IS
  'PostGIS GEOMETRY(Point, 4326) GiST indexed for 2D spatial queries. '
  'Contains incident GPS coordinates — access controlled via AccessGrant.sol.';

-- GiST index on GEOMETRY for fast spatial queries (ST_Within, ST_DWithin)
CREATE INDEX IF NOT EXISTS sos_incidents_geom_gist_idx ON sos_incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS sos_incidents_user_idx      ON sos_incidents (user_id);
CREATE INDEX IF NOT EXISTS sos_incidents_status_idx    ON sos_incidents (status);
CREATE INDEX IF NOT EXISTS sos_incidents_triggered_idx ON sos_incidents (triggered_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: sos_dispatch_logs
-- Per-rail dispatch attempt log. CASCADE on incident delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sos_dispatch_logs (
  log_id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID           NOT NULL
    REFERENCES sos_incidents(incident_id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- Which multi-rail channel was used
  rail                  dispatch_rail  NOT NULL,
  status                dispatch_status NOT NULL DEFAULT 'PENDING',
  -- For Rail A: WebSocket session ID; for Rail B: Twilio MessageSid
  rail_tracking_id      TEXT,
  -- Base91 payload bytes (Rail B SMS compliance check: <140 bytes)
  payload_bytes         INTEGER        CHECK (payload_bytes > 0 AND payload_bytes <= 200),
  -- ISO 8601 attempt and ACK timestamps
  attempted_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  acknowledged_at       TIMESTAMPTZ,
  -- Failure reason (if status = FAILED or TIMEOUT)
  failure_reason        TEXT,
  -- Number of retry attempts for this rail
  retry_count           SMALLINT       NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sos_dispatch_logs IS
  'Per-rail (RAIL_A_WSS, RAIL_B_SMS, RAIL_C_BLE) SOS dispatch attempt log. '
  'Rail B payload_bytes MUST be <140 for GSM-7 SMS compliance. '
  'CASCADE on incident delete.';

CREATE INDEX IF NOT EXISTS sdl_incident_idx ON sos_dispatch_logs (incident_id);
CREATE INDEX IF NOT EXISTS sdl_rail_idx     ON sos_dispatch_logs (incident_id, rail);
CREATE INDEX IF NOT EXISTS sdl_status_idx   ON sos_dispatch_logs (status);

-- ---------------------------------------------------------------------------
-- TABLE: anonymous_reports
-- ZK bystander reports. UNLINKED from users table by design (anonymity guarantee).
-- nullifier_hash is Poseidon(identitySecret, incidentID) — prevents double-report.
-- spatial_bucket VARCHAR(6) = geohash-6 matching Circom public input.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS anonymous_reports (
  report_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Poseidon nullifier: prevents double-report without revealing identity
  -- Stored in ZKReportVerifier.sol's nullifierHashes mapping AND here for indexing
  nullifier_hash         CHAR(64)    NOT NULL UNIQUE
                           CHECK (length(nullifier_hash) = 64),
  -- Geohash-6 spatial bucket matching the Circom circuit's geohashBucket public input
  spatial_bucket         VARCHAR(6)  NOT NULL
                           CHECK (spatial_bucket ~ '^[0-9b-hjkmnp-z]{6}$'),
  -- BNS section alleged by the anonymous report
  bns_section            bns_section NOT NULL,
  -- 1-hour quantized epoch bucket (timestamp / 3600) matching Circom timestampBucketEpochHour
  timestamp_epoch_hour   BIGINT      NOT NULL CHECK (timestamp_epoch_hour >= 0),
  -- Groth16 proof on-chain verification transaction hash
  zk_verify_tx_hash      CHAR(66)
                           CHECK (zk_verify_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  -- Whether the on-chain nullifier has been confirmed as unspent
  is_nullifier_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
  -- ZKey version/trusted setup identifier used to generate this proof
  zkey_version           TEXT        NOT NULL,
  -- NO user_id foreign key — anonymity is guaranteed by design
  -- NO raw GPS — only the 1.2km geohash-6 bucket
  submitted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE anonymous_reports IS
  'Anonymous ZK bystander reports. INTENTIONALLY UNLINKED from users table. '
  'nullifier_hash = Poseidon(identitySecret, incidentID) prevents double-report. '
  'spatial_bucket VARCHAR(6) = geohash-6 matching Circom public input (ttnf7z format). '
  'timestamp_epoch_hour = Unix epoch / 3600 for 1-hour anonymity window.';

COMMENT ON COLUMN anonymous_reports.nullifier_hash IS
  'Poseidon(identitySecret, incidentID) — unique per verified identity per incident. '
  'Guarantees one report per identity while preserving mathematical unlinkability across incidents.';

COMMENT ON COLUMN anonymous_reports.spatial_bucket IS
  'Geohash-6 (~1.2km x 0.6km) — matches Circom circuit''s public geohashBucket input. '
  'Coarse enough to not pinpoint the victim''s location.';

CREATE INDEX IF NOT EXISTS ar_nullifier_idx   ON anonymous_reports (nullifier_hash);
CREATE INDEX IF NOT EXISTS ar_spatial_idx     ON anonymous_reports (spatial_bucket);
CREATE INDEX IF NOT EXISTS ar_bns_epoch_idx   ON anonymous_reports (bns_section, timestamp_epoch_hour);
CREATE INDEX IF NOT EXISTS ar_submitted_idx   ON anonymous_reports (submitted_at DESC);

-- ---------------------------------------------------------------------------
-- TABLE: efir_records
-- BNSS §173 automated eFIR. 72-hour statutory deadline enforced via CHECK constraint.
-- RESTRICT on incident delete (legal record must be preserved).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS efir_records (
  efir_id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                UUID         NOT NULL UNIQUE
    REFERENCES sos_incidents(incident_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  status                     efir_status  NOT NULL DEFAULT 'PENDING_SIGN',
  -- BNS sections alleged (array, min 1)
  alleged_bns_sections       bns_section[] NOT NULL,
  -- ISO 639-1 language code of original audio
  original_language          CHAR(2)      NOT NULL DEFAULT 'hi',
  -- SHA-256 hash of the encrypted transcript (NOT raw text — DPDP Act)
  transcript_hash            CHAR(64)
                               CHECK (length(transcript_hash) = 64),
  -- IPFS CIDv1 of the AES-256-GCM encrypted transcript blob
  encrypted_transcript_cid   TEXT,
  -- BNSS §173 statutory 72-hour signing deadline
  -- CHECK constraint enforces: sign_deadline = created_at + INTERVAL '72 hours' (±30s)
  -- CANONICAL RULE: 72 hours = 259,200 seconds (from SKILL.MD)
  sign_deadline              TIMESTAMPTZ  NOT NULL
                               GENERATED ALWAYS AS (created_at + INTERVAL '72 hours') STORED,
  -- Optional 48-hour NGO early-warning webhook timestamp (deployment-configurable, NOT statutory)
  ngo_early_warning_at       TIMESTAMPTZ
                               GENERATED ALWAYS AS (created_at + INTERVAL '48 hours') STORED,
  -- ComplaintEscrow.sol bytes32 on-chain escrow ID
  escrow_contract_id         CHAR(66)
                               CHECK (escrow_contract_id ~ '^0x[0-9a-fA-F]{64}$'),
  -- Polygon L2 tx hash for initEscrow() call
  escrow_init_tx_hash        CHAR(66)
                               CHECK (escrow_init_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  -- ISO 8601 timestamp of Aadhaar e-Sign (survivor signature)
  signed_at                  TIMESTAMPTZ,
  -- SHA-256 of the Aadhaar e-Sign token (NOT the token itself)
  aadhaar_sign_hash          CHAR(64)
                               CHECK (length(aadhaar_sign_hash) = 64),
  -- ISO 8601 timestamp of police SHO/SP acknowledgement
  acknowledged_at            TIMESTAMPTZ,
  -- Whether §173(4) SP + accredited NGO escalation dossier was dispatched
  is_escalated_to_sp         BOOLEAN      NOT NULL DEFAULT FALSE,
  -- Timestamp when §173(4) escalation was triggered (if applicable)
  escalated_at               TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE efir_records IS
  'BNSS §173 automated eFIR records. RESTRICT on incident delete (legal preservation). '
  'sign_deadline is GENERATED as created_at + 72h (259,200s statutory per SKILL.MD). '
  'ngo_early_warning_at is GENERATED as created_at + 48h (optional, configurable). '
  'is_escalated_to_sp tracks §173(4) SP + NGO dossier dispatch.';

COMMENT ON COLUMN efir_records.sign_deadline IS
  'BNSS §173 statutory 72-hour signing deadline. GENERATED ALWAYS AS created_at + INTERVAL ''72 hours''. '
  'Canonical rule: 259,200 seconds. ComplaintEscrow.sol mirrors this value.';

COMMENT ON COLUMN efir_records.ngo_early_warning_at IS
  'Optional 48-hour NGO early-warning webhook trigger. GENERATED from created_at. '
  'NOT a statutory requirement — deployment-configurable webhook only.';

COMMENT ON COLUMN efir_records.transcript_hash IS
  'SHA-256 hash of the encrypted transcript. NEVER store raw transcript text here (DPDP Act §5).';

CREATE INDEX IF NOT EXISTS er_incident_idx      ON efir_records (incident_id);
CREATE INDEX IF NOT EXISTS er_status_idx        ON efir_records (status);
CREATE INDEX IF NOT EXISTS er_deadline_idx      ON efir_records (sign_deadline);
CREATE INDEX IF NOT EXISTS er_escalated_idx     ON efir_records (is_escalated_to_sp) WHERE is_escalated_to_sp = FALSE;

-- ---------------------------------------------------------------------------
-- TABLE: bsa63_certificates
-- BSA §63 cryptographic certificate packs. CASCADE on eFIR delete.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bsa63_certificates (
  cert_id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                 UUID         NOT NULL
    REFERENCES sos_incidents(incident_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  efir_id                     UUID         NOT NULL UNIQUE
    REFERENCES efir_records(efir_id) ON DELETE CASCADE ON UPDATE CASCADE,
  -- TEE type used for hardware attestation
  tee_type                    TEXT         NOT NULL
                                CHECK (tee_type IN ('ANDROID_STRONGBOX', 'IOS_SECURE_ENCLAVE', 'AWS_NITRO')),
  -- SHA-256 hash of the OS build fingerprint
  os_build_fingerprint_hash   CHAR(64)
                                CHECK (length(os_build_fingerprint_hash) = 64),
  -- SHA-256 hash chain root over all plaintext chunk digests
  evidence_chain_root         CHAR(64)     NOT NULL
                                CHECK (length(evidence_chain_root) = 64),
  -- Total chunks in the hash chain
  total_chunks                INTEGER      NOT NULL CHECK (total_chunks >= 1),
  -- IPFS CIDv1 of the encrypted evidence bundle (Pinata pinned)
  bundle_cid                  TEXT         NOT NULL,
  -- Number of Filecoin storage deal confirmations
  filecoin_deal_count         SMALLINT     NOT NULL DEFAULT 0 CHECK (filecoin_deal_count >= 0),
  -- Whether Pinata confirms active pinning
  is_pinned                   BOOLEAN      NOT NULL DEFAULT FALSE,
  -- PDF/A-3 legally-admissible certificate document CID
  pdf_a3_cid                  TEXT         NOT NULL,
  -- JSON-LD structured legal data certificate CID
  json_ld_cid                 TEXT         NOT NULL,
  -- ECDSA platform signature (65 bytes as hex) over certificate payload
  platform_signature          CHAR(132)    NOT NULL
                                CHECK (platform_signature ~ '^0x[0-9a-fA-F]{130}$'),
  -- EVM address of the She-Raksha platform signing key (AWS Nitro TEE)
  platform_signer_address     CHAR(42)     NOT NULL
                                CHECK (platform_signer_address ~ '^0x[0-9a-fA-F]{40}$'),
  generated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE bsa63_certificates IS
  'BSA §63 cryptographic certificate packs (FR-EV-007). '
  'Contains TEE attestation, SHA-256 hash chains, IPFS pin status, and Polygon L2 receipts. '
  'CASCADE on efir delete. pdf_a3_cid and json_ld_cid are legally-admissible documents.';

CREATE INDEX IF NOT EXISTS bsa_incident_idx   ON bsa63_certificates (incident_id);
CREATE INDEX IF NOT EXISTS bsa_efir_idx       ON bsa63_certificates (efir_id);
CREATE INDEX IF NOT EXISTS bsa_pinned_idx     ON bsa63_certificates (is_pinned);

-- ---------------------------------------------------------------------------
-- Triggers: auto-update updated_at timestamps
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER guardians_updated_at
  BEFORE UPDATE ON guardians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sos_incidents_updated_at
  BEFORE UPDATE ON sos_incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER efir_records_updated_at
  BEFORE UPDATE ON efir_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Schema metadata
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id    SERIAL      PRIMARY KEY,
  filename        TEXT        NOT NULL UNIQUE,
  applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (filename) VALUES ('001_init_core_schema.sql')
  ON CONFLICT (filename) DO NOTHING;

COMMIT;

