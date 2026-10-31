/**
 * @she-raksha/schemas — Migration 001: Core Schema
 *
 * Exports the full PostgreSQL 16 + PostGIS 3.4 migration SQL as a
 * TypeScript string constant for programmatic use in:
 *   - Migration runner (runner.ts)
 *   - Integration tests
 *   - Supabase MCP or CI/CD pipeline application
 *
 * Full annotated DDL: src/migrations/001_init_core_schema.sql
 */

export const MIGRATION_001 = `
-- She-Raksha PostgreSQL 16 + PostGIS 3.4 Migration 001
-- Phase 2: Canonical Data Contracts & Multi-Tier Database Schemas
-- 3NF design. Zero cleartext PII (DPDP Act 2023).

BEGIN;

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE trigger_mode AS ENUM (
  'HARDWARE_TAP_FOUR_PRESS',
  'SHAKE_ACCELEROMETER',
  'VOICE_DURESS_TFLITE',
  'FALL_DETECTION',
  'DEAD_MAN_SWITCH',
  'MANUAL_BUTTON'
);

CREATE TYPE sos_status AS ENUM (
  'INITIATED','DISPATCHING','ACKNOWLEDGED','RESOLVED','CANCELLED','ESCALATED'
);

CREATE TYPE dispatch_rail AS ENUM ('RAIL_A_WSS','RAIL_B_SMS','RAIL_C_BLE');
CREATE TYPE dispatch_status AS ENUM ('PENDING','SENT','DELIVERED','FAILED','TIMEOUT');

CREATE TYPE efir_status AS ENUM (
  'PENDING_SIGN','SIGNED','ACKNOWLEDGED','DEADLINE_BREACHED','ESCALATED_SP'
);

CREATE TYPE bns_section AS ENUM ('BNS_74','BNS_75','BNS_78','BNS_351_2');

-- users: zero cleartext PII
CREATE TABLE IF NOT EXISTS users (
  user_id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_account_address      CHAR(42)    NOT NULL UNIQUE CHECK (smart_account_address ~ '^0x[0-9a-fA-F]{40}$'),
  web3auth_did               TEXT        NOT NULL UNIQUE,
  phone_hash                 CHAR(64)    NOT NULL UNIQUE CHECK (length(phone_hash) = 64),
  encrypted_profile_blob     BYTEA       NOT NULL,
  profile_encryption_pubkey  CHAR(64)    NOT NULL,
  is_kyc_verified            BOOLEAN     NOT NULL DEFAULT FALSE,
  preferred_language         CHAR(2)     NOT NULL DEFAULT 'hi',
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS users_smart_account_idx ON users (smart_account_address);

-- emergency_contacts: salted phone hash + encrypted BYTEA blob, no cleartext PII
CREATE TABLE IF NOT EXISTS emergency_contacts (
  contact_id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  priority_tier               SMALLINT    NOT NULL CHECK (priority_tier BETWEEN 1 AND 5),
  contact_phone_hash          CHAR(64)    NOT NULL CHECK (length(contact_phone_hash) = 64),
  encrypted_contact_details   BYTEA       NOT NULL,
  contact_encryption_pubkey   CHAR(64)    NOT NULL,
  is_confirmed                BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_contact_phone UNIQUE (user_id, contact_phone_hash)
);
CREATE INDEX IF NOT EXISTS ec_user_id_idx       ON emergency_contacts (user_id);
CREATE INDEX IF NOT EXISTS ec_priority_tier_idx ON emergency_contacts (user_id, priority_tier);

-- guardians: GEOGRAPHY(Point, 4326) GiST index, radius_meters default 2000
CREATE TABLE IF NOT EXISTS guardians (
  guardian_id                  UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                      UUID           NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  geom                         GEOGRAPHY(Point, 4326) NOT NULL,
  radius_meters                INTEGER        NOT NULL DEFAULT 2000 CHECK (radius_meters BETWEEN 100 AND 50000),
  h3_index_res9                TEXT           NOT NULL,
  is_active                    BOOLEAN        NOT NULL DEFAULT FALSE,
  stake_wei                    NUMERIC(78, 0) NOT NULL DEFAULT 0,
  on_chain_guardian_id         CHAR(66)       CHECK (on_chain_guardian_id ~ '^0x[0-9a-fA-F]{64}$'),
  last_heartbeat_at            TIMESTAMPTZ,
  created_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS guardians_geom_gist_idx ON guardians USING GIST (geom);
CREATE INDEX IF NOT EXISTS guardians_user_id_idx   ON guardians (user_id);
CREATE INDEX IF NOT EXISTS guardians_active_idx    ON guardians (is_active) WHERE is_active = TRUE;

-- sos_incidents: GEOMETRY(Point, 4326) GiST index, RESTRICT on user delete
CREATE TABLE IF NOT EXISTS sos_incidents (
  incident_id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID           NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  trigger_mode               trigger_mode   NOT NULL,
  status                     sos_status     NOT NULL DEFAULT 'INITIATED',
  geom                       GEOMETRY(Point, 4326),
  spatial_bucket             VARCHAR(6)     CHECK (spatial_bucket ~ '^[0-9b-hjkmnp-z]{6}$'),
  session_merkle_root        CHAR(64)       CHECK (length(session_merkle_root) = 64),
  evidence_bundle_cid        TEXT,
  evidence_anchor_tx_hash    CHAR(66)       CHECK (evidence_anchor_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  total_chunks               INTEGER        NOT NULL DEFAULT 0 CHECK (total_chunks >= 0),
  peak_acceleration_g        NUMERIC(5, 3),
  triggered_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  resolved_at                TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sos_incidents_geom_gist_idx ON sos_incidents USING GIST (geom);
CREATE INDEX IF NOT EXISTS sos_incidents_user_idx      ON sos_incidents (user_id);
CREATE INDEX IF NOT EXISTS sos_incidents_status_idx    ON sos_incidents (status);
CREATE INDEX IF NOT EXISTS sos_incidents_triggered_idx ON sos_incidents (triggered_at DESC);

-- sos_dispatch_logs: per-rail dispatch log, CASCADE on incident delete
CREATE TABLE IF NOT EXISTS sos_dispatch_logs (
  log_id                UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id           UUID            NOT NULL REFERENCES sos_incidents(incident_id) ON DELETE CASCADE ON UPDATE CASCADE,
  rail                  dispatch_rail   NOT NULL,
  status                dispatch_status NOT NULL DEFAULT 'PENDING',
  rail_tracking_id      TEXT,
  payload_bytes         INTEGER         CHECK (payload_bytes > 0 AND payload_bytes <= 200),
  attempted_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  acknowledged_at       TIMESTAMPTZ,
  failure_reason        TEXT,
  retry_count           SMALLINT        NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  created_at            TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sdl_incident_idx ON sos_dispatch_logs (incident_id);
CREATE INDEX IF NOT EXISTS sdl_rail_idx     ON sos_dispatch_logs (incident_id, rail);
CREATE INDEX IF NOT EXISTS sdl_status_idx   ON sos_dispatch_logs (status);

-- anonymous_reports: unlinked from users, unique nullifier_hash, spatial_bucket VARCHAR(6)
CREATE TABLE IF NOT EXISTS anonymous_reports (
  report_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nullifier_hash         CHAR(64)    NOT NULL UNIQUE CHECK (length(nullifier_hash) = 64),
  spatial_bucket         VARCHAR(6)  NOT NULL CHECK (spatial_bucket ~ '^[0-9b-hjkmnp-z]{6}$'),
  bns_section            bns_section NOT NULL,
  timestamp_epoch_hour   BIGINT      NOT NULL CHECK (timestamp_epoch_hour >= 0),
  zk_verify_tx_hash      CHAR(66)    CHECK (zk_verify_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  is_nullifier_verified  BOOLEAN     NOT NULL DEFAULT FALSE,
  zkey_version           TEXT        NOT NULL,
  submitted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ar_nullifier_idx ON anonymous_reports (nullifier_hash);
CREATE INDEX IF NOT EXISTS ar_spatial_idx   ON anonymous_reports (spatial_bucket);
CREATE INDEX IF NOT EXISTS ar_bns_epoch_idx ON anonymous_reports (bns_section, timestamp_epoch_hour);
CREATE INDEX IF NOT EXISTS ar_submitted_idx ON anonymous_reports (submitted_at DESC);

-- efir_records: BNSS §173 eFIR, RESTRICT on incident delete
-- sign_deadline GENERATED as created_at + 72h (259,200s statutory)
-- ngo_early_warning_at GENERATED as created_at + 48h (optional webhook)
CREATE TABLE IF NOT EXISTS efir_records (
  efir_id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                UUID          NOT NULL UNIQUE REFERENCES sos_incidents(incident_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  status                     efir_status   NOT NULL DEFAULT 'PENDING_SIGN',
  alleged_bns_sections       bns_section[] NOT NULL,
  original_language          CHAR(2)       NOT NULL DEFAULT 'hi',
  transcript_hash            CHAR(64)      CHECK (length(transcript_hash) = 64),
  encrypted_transcript_cid   TEXT,
  sign_deadline              TIMESTAMPTZ   NOT NULL GENERATED ALWAYS AS (created_at + INTERVAL '72 hours') STORED,
  ngo_early_warning_at       TIMESTAMPTZ   GENERATED ALWAYS AS (created_at + INTERVAL '48 hours') STORED,
  escrow_contract_id         CHAR(66)      CHECK (escrow_contract_id ~ '^0x[0-9a-fA-F]{64}$'),
  escrow_init_tx_hash        CHAR(66)      CHECK (escrow_init_tx_hash ~ '^0x[0-9a-fA-F]{64}$'),
  signed_at                  TIMESTAMPTZ,
  aadhaar_sign_hash          CHAR(64)      CHECK (length(aadhaar_sign_hash) = 64),
  acknowledged_at            TIMESTAMPTZ,
  is_escalated_to_sp         BOOLEAN       NOT NULL DEFAULT FALSE,
  escalated_at               TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS er_incident_idx  ON efir_records (incident_id);
CREATE INDEX IF NOT EXISTS er_status_idx    ON efir_records (status);
CREATE INDEX IF NOT EXISTS er_deadline_idx  ON efir_records (sign_deadline);
CREATE INDEX IF NOT EXISTS er_escalated_idx ON efir_records (is_escalated_to_sp) WHERE is_escalated_to_sp = FALSE;

-- bsa63_certificates: BSA §63 certificate packs, CASCADE on efir delete
CREATE TABLE IF NOT EXISTS bsa63_certificates (
  cert_id                     UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id                 UUID       NOT NULL REFERENCES sos_incidents(incident_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  efir_id                     UUID       NOT NULL UNIQUE REFERENCES efir_records(efir_id) ON DELETE CASCADE ON UPDATE CASCADE,
  tee_type                    TEXT       NOT NULL CHECK (tee_type IN ('ANDROID_STRONGBOX','IOS_SECURE_ENCLAVE','AWS_NITRO')),
  os_build_fingerprint_hash   CHAR(64)   CHECK (length(os_build_fingerprint_hash) = 64),
  evidence_chain_root         CHAR(64)   NOT NULL CHECK (length(evidence_chain_root) = 64),
  total_chunks                INTEGER    NOT NULL CHECK (total_chunks >= 1),
  bundle_cid                  TEXT       NOT NULL,
  filecoin_deal_count         SMALLINT   NOT NULL DEFAULT 0 CHECK (filecoin_deal_count >= 0),
  is_pinned                   BOOLEAN    NOT NULL DEFAULT FALSE,
  pdf_a3_cid                  TEXT       NOT NULL,
  json_ld_cid                 TEXT       NOT NULL,
  platform_signature          CHAR(132)  NOT NULL CHECK (platform_signature ~ '^0x[0-9a-fA-F]{130}$'),
  platform_signer_address     CHAR(42)   NOT NULL CHECK (platform_signer_address ~ '^0x[0-9a-fA-F]{40}$'),
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bsa_incident_idx ON bsa63_certificates (incident_id);
CREATE INDEX IF NOT EXISTS bsa_efir_idx     ON bsa63_certificates (efir_id);
CREATE INDEX IF NOT EXISTS bsa_pinned_idx   ON bsa63_certificates (is_pinned);

-- Auto-update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER emergency_contacts_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sos_incidents_updated_at BEFORE UPDATE ON sos_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER efir_records_updated_at BEFORE UPDATE ON efir_records FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS schema_migrations (
  migration_id SERIAL PRIMARY KEY,
  filename     TEXT   NOT NULL UNIQUE,
  applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO schema_migrations (filename) VALUES ('001_init_core_schema.sql') ON CONFLICT (filename) DO NOTHING;

COMMIT;
` as const;

