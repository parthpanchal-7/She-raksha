She-Raksha: ERD & Database Design Specification

## Cryptographic Multi-Tier Architecture & Data Persistence Framework

# 1. Executive Summary & Data Architecture Philosophy

She-Raksha implements a multi-tier, fault-tolerant persistence architecture engineered to reconcile two fundamentally opposing constraints: high-throughput, low-latency incident coordination during critical life-safety events, and rigorous compliance with global privacy regulations alongside India's Digital Personal Data Protection (DPDP) Act, 2023.

## 1.1 Core Architecture Composition

The database topology is divided across four distinct layers:

- **On-Device Edge Storage (SQLCipher):** Local, zero-knowledge offline engine securing transient telemetry, raw sensor dumps, and local queues using hardware-backed AES-256-GCM encryption with cryptographic keys derived from Android Keystore / iOS Secure Enclave.
- **Decentralized Media Persistence (IPFS / Filecoin):** Content-addressed, encrypted blob storage for evidentiary artifacts (audio chunks, frame bursts, device telemetry manifests). Content IDs (CIDs) are pinned to decentralized storage clusters and cryptographically referenced within centralized and on-chain records.
- **Immutable State Engine (Polygon PoS / L2 EVM):** Smart contract registries enforcing tamper-proof execution timelines, anchoring cryptographic Merkle roots for legal chain-of-custody, validating zero-knowledge proofs (ZKP) for non-attributable community safety audits, and orchestrating trustless escrow timers for police First Information Reports (e-FIR).
- **Spatial & Relational Central Core (PostgreSQL 16 + PostGIS 3.4):** Enterprise-grade operational store handling real-time geospatial dispatch calculations, operational indexing, web-socket connection state persistence, and identity management.

## 1.2 Privacy & DPDP Compliance Mandate

- **Zero Cleartext PII:** No plain-text Personally Identifiable Information (phone numbers, full names, government identities, precise home locations) is written to centralized relational tables or ledger states. Telephony values are stored as deterministic salted hashes (SHA-256) for deduplication or encrypted via envelope encryption using recipient public keys (X25519-XSalsa20-Poly1305).
- **Sovereign Key Lifecycle:** Users maintain sovereign cryptographic identities via W3C WebAuthn / Passkeys (secp256r1) mapped to ERC-4337 Smart Contract Accounts. Session tokens do not expose underlying private credentials.
- **Automated Data Minimization & TTL Purging:** Incident-specific coordinates default to dynamic aggregation grids after case resolution. Unanchored raw ambient audio frames undergo strict 72-hour TTL cascades executed via automated database worker routines.
- **Cryptographic Unlinkability:** Anonymous hazard notifications utilize Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (ZK-SNARKs). The operational database records nullifier hashes rather than user references, guaranteeing mathematical unlinkability between an authenticated platform account and reported vulnerability data.

# 2. Global Entity Relationship Diagram (ASCII Schema & Notations)

## 2.1 Notation Standard & Structural Legend

The ASCII diagram below employs Crow's Foot notations with structural classifications:

- ||--o{ : One-to-Zero-or-Many  
  |---|One-to-One-or-Many
- ||--|| : One-to-One
- }|--o| : Many-to-Zero-or-One
- \[PG\] : Central PostgreSQL/PostGIS Table
- \[SQLC\]: On-Device SQLCipher Engine Table
- \[CHAIN\]: Polygon L2 Smart Contract State
- \[IPFS\]: Decentralized Content-Addressed Object Store

## 2.2 Global Multi-Engine Architecture Diagram

 +---------------------------------------------------------------------------------------------------+

```
 |                                   ON-DEVICE SQLCIPHER LAYER                                       |
 +---------------------------------------------------------------------------------------------------+
 |  [SQLC] local_captures                                      [SQLC] offline_queue                  |
 |  =====================                                      ====================                  |
 |  PK  capture_id                                             PK  queue_id                          |
 |      chunk_index                                                payload_blob                      |
 |      iv_hex                                                     payload_type                      |
 |      auth_tag_hex                                               retry_count                       |
 |      sha256_digest                                              last_attempt                      |
 |      ipfs_cid  - - - - - - - +                                  status                            |
 |      is_anchored             |                                                                    |
 +------------------------------|--------------------------------------------------------------------+
                                | (Async Sync via Gateway)
                                v
 +---------------------------------------------------------------------------------------------------+
 |                               DECENTRALIZED IPFS BLOB PERSISTENCE                                 |
 +---------------------------------------------------------------------------------------------------+
 |  [IPFS] Encrypted Media Chunks & Metadata Manifests                                               |
 |  * Raw Video/Audio Frames (AES-GCM Encrypted)                                                     |
 |  * Device Sensor Telemetry JSON (Signed by Device Private Key)                                    |
 |  * Section 63 BSA Digital Evidence Certificate JSON                                               |
 +---------------------------------------------------------------------------------------------------+
                                ^
                                | (Pinned Hash References)
 +------------------------------|--------------------------------------------------------------------+
 |                               CENTRAL POSTGRESQL / POSTGIS ENGINE                                 |
 +---------------------------------------------------------------------------------------------------+
 |                                                                                                   |
 |   +-----------------------------+                                                                 |
 |   | [PG] users                  |                                                                 |
 |   +-----------------------------+                                                                 |
 |   | PK  user_id                 |                                                                 |
 |   |     smart_account_address   |                                                                 |
 |   |     passkey_pubkey_id       |                                                                 |
 |   |     created_at              |                                                                 |
 |   |     role                    |                                                                 |
 |   |     status                  |                                                                 |
 |   +-----------------------------+                                                                 |
 |          |               |                                                                        |
 |          | 1:N           | 1:N                                                                    |
 |          v               v                                                                        |
 |   +--------------------+ +--------------------+                                                   |
 |   | [PG] emerg_contacts| | [PG] guardians     |                                                   |
 |   +--------------------+ +--------------------+                                                   |
 |   | PK contact_id      | | PK guardian_id     |                                                   |
 |   | FK user_id         | | FK user_id         |                                                   |
 |   |    phone_hash      | |    status          |                                                   |
 |   |    enc_details     | |    verify_type     |                                                   |
 |   |    priority_tier   | |    current_geohash |                                                   |
 |   +--------------------+ |    radius_meters   |                                                   |
 |                          |    stake_status    |                                                   |
 |                          +--------------------+                                                   |
 |          |                                                                                        |
 |          | 1:N                                                                                    |
 |          v                                                                                        |
 |   +-----------------------------+                                                                 |
 |   | [PG] sos_incidents          |                                                                 |
 |   +-----------------------------+                                                                 |
 |   | PK  incident_id             |                                                                 |
 |   | FK  user_id                 |                                                                 |
 |   |     session_uuid            |                                                                 |
 |   |     alert_level             |                                                                 |
 |   |     trigger_mode            |                                                                 |
 |   |     status                  |                                                                 |
 |   |     origin_lat / origin_long|                                                                 |
 |   |     geom (PostGIS Point)    |                                                                 |
 |   |     created_at              |                                                                 |
 |   +-----------------------------+                                                                 |
 |          |               |                                                                        |
 |          | 1:N           | 1:1                                                                    |
 |          v               v                                                                        |
 |   +--------------------+ +--------------------+                                                   |
 |   | [PG] dispatch_logs | | [PG] efir_records  |                                                   |
 |   +--------------------+ +--------------------+                                                   |
 |   | PK dispatch_id     | | PK efir_id         |                                                   |
 |   | FK incident_id     | | FK incident_id     |                                                   |
 |   |    rail_type       | |    fir_number      |                                                   |
 |   |    status          | |    station_code    |                                                   |
 |   |    payload_hash    | |    status          |                                                   |
 |   |    dispatched_at   | |    bns_sections    |                                                   |
 |   |    ack_at          | |    created_at      |                                                   |
 |   +--------------------+ |    sign_deadline   |                                                   |
 |                          |    sp_escalated    |                                                   |
 |                          +--------------------+                                                   |
 |                                  |                                                                |
 |                                  | 1:1                                                            |
 |                                  v                                                                |
 |                          +--------------------+                                                   |
 |                          | [PG] bsa63_certs   |                                                   |
 |                          +--------------------+                                                   |
 |                          | PK cert_id         |                                                   |
 |                          | FK efir_id         |                                                   |
 |                          |    merkle_hash     |                                                   |
 |                          |    device_attest   |                                                   |
 |                          |    payload_cid - - + - - -> Points to [IPFS] Metadata Manifest         |
 |                          |    generated_at    |                                                   |
 |                          +--------------------+                                                   |
 |                                                                                                   |
 |   +-----------------------------+                                                                 |
 |   | [PG] anonymous_reports      | (Unlinked from users table via ZK nullifiers)                   |
 |   +-----------------------------+                                                                 |
 |   | PK  report_id               |                                                                 |
 |   | UQ  nullifier_hash  - - - - | - - - - - - - - - - - - - - - - - - - - - - - -+                |
 |   |     geohash_bucket          |                                                |                |
 |   |     category_code           |                                                |                |
 |   |     timestamp_bucket        |                                                |                |
 |   |     onchain_tx_hash         |                                                |                |
 |   |     status                  |                                                |                |
 |   +-----------------------------+                                                |                |
 +----------------------------------------------------------------------------------|----------------+
                                                                                    |
                                                                                    v
 +---------------------------------------------------------------------------------------------------+
 |                                 POLYGON L2 EVM CONTRACT STATE                                     |
 +---------------------------------------------------------------------------------------------------+
 |  [CHAIN] ZKReportVerifier        [CHAIN] SOSLog                  [CHAIN] ComplaintEscrow          |
 |  ========================        ==============                  =======================          |
 |  mapping(bytes32 => bool)        mapping(bytes32 => Anchor)      mapping(uint256 => EscrowState)  |
 |    nullifierHashes < - - - - - - - +                             uint256 signDeadline             |
 |  uint256 verifiedReportCount     bytes32 rootMerkleTree          bool isEscalated                 |
 |                                  uint256 anchorTimestamp         bool isSigned                    |
 |                                                                                                   |
 |  [CHAIN] EvidenceRegistry                                                                        |
 |  ========================                                                                        |
 |  mapping(bytes32 => mapping(bytes32 => Record)) sessionRoot                                      |
 +---------------------------------------------------------------------------------------------------+
```

# 3. Detailed Entity Schemas

## 3.1 PostgreSQL / PostGIS Central Relational Engine

### Table: users

Identity registry for smart account owners, providing linkability to decentralized account abstracts while obfuscating personal identifiers.

| Column Name             | Physical Data Type | Modifiers / Constraints                                                            | Description                                        |
| ----------------------- | ------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| `user_id`               | `UUID`             | `PK, DEFAULT gen_random_uuid()`                                                    | Immutable internal unique identifier.              |
| ---                     | ---                | ---                                                                                | ---                                                |
| `smart_account_address` | `VARCHAR(42)`      | `NOT NULL, UNIQUE`                                                                 | EIP-4337 smart wallet contract address on Polygon. |
| ---                     | ---                | ---                                                                                | ---                                                |
| `passkey_pubkey_id`     | `TEXT`             | `NOT NULL, UNIQUE`                                                                 | WebAuthn credential identifier for authentication. |
| ---                     | ---                | ---                                                                                | ---                                                |
| `created_at`            | `TIMESTAMPTZ`      | `NOT NULL, DEFAULT clock_timestamp()`                                              | Registration epoch with microsecond precision.     |
| ---                     | ---                | ---                                                                                | ---                                                |
| `role`                  | `VARCHAR(20)`      | `NOT NULL, CHECK (role IN ('CITIZEN', 'GUARDIAN', 'ADMIN', 'FIRST_RESPONDER'))`    | System access role determining RBAC permissions.   |
| ---                     | ---                | ---                                                                                | ---                                                |
| `status`                | `VARCHAR(16)`      | `NOT NULL, DEFAULT 'ACTIVE', CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED'))` | Operational account status flag.                   |
| ---                     | ---                | ---                                                                                | ---                                                |

### Table: emergency_contacts

Secure secondary contacts notified during alert escalations. Encrypted using client asymmetric keys.

| Column Name                 | Physical Data Type | Modifiers / Constraints                          | Description                                                |
| --------------------------- | ------------------ | ------------------------------------------------ | ---------------------------------------------------------- |
| `contact_id`                | `UUID`             | PK, DEFAULT gen_random_uuid()                    | Contact record primary key.                                |
| ---                         | ---                | ---                                              | ---                                                        |
| `user_id`                   | `UUID`             | NOT NULL, FK -> users(user_id) ON DELETE CASCADE | Parent reference to user initiating contact record.        |
| ---                         | ---                | ---                                              | ---                                                        |
| `contact_phone_hash`        | `CHAR(64)`         | NOT NULL, INDEX                                  | Salted SHA-256 hash of telephone number for deduplication. |
| ---                         | ---                | ---                                              | ---                                                        |
| `encrypted_contact_details` | `BYTEA`            | `NOT NULL`                                       | Asymmetrically encrypted phone/relationship payload.       |
| ---                         | ---                | ---                                              | ---                                                        |
| `priority_tier`             | `SMALLINT`         | NOT NULL, CHECK (priority_tier BETWEEN 1 AND 5)  | Sequence index indicating dispatch order during an SOS.    |
| ---                         | ---                | ---                                              | ---                                                        |

### Table: guardians

Vetted community safety nodes available for edge routing of distress beacons.

| Column Name         | Physical Data Type | Modifiers / Constraints                                                                | Description                                          |
| ------------------- | ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `guardian_id`       | `UUID`             | PK, DEFAULT gen_random_uuid()                                                          | Unique guardian registry identifier.                 |
| ---                 | ---                | ---                                                                                    | ---                                                  |
| `user_id`           | `UUID`             | NOT NULL, UNIQUE, FK -> users(user_id) ON DELETE CASCADE                               | One-to-one mapping to authenticated user account.    |
| ---                 | ---                | ---                                                                                    | ---                                                  |
| `status`            | `VARCHAR(20)`      | NOT NULL, DEFAULT 'STANDBY', CHECK (status IN ('STANDBY', 'ENGAGED', 'OFFLINE'))       | Real-time availability state.                        |
| ---                 | ---                | ---                                                                                    | ---                                                  |
| `verification_type` | `VARCHAR(32)`      | NOT NULL, CHECK (verification_type IN ('GOVT_ID', 'COMMUNITY_STAKE', 'PEER_ATTESTED')) | Guardian validation methodology.                     |
| ---                 | ---                | ---                                                                                    | ---                                                  |
| `current_geohash`   | `VARCHAR(12)`      | `NOT NULL`                                                                             | Ephemeral geo-bucket for rough spatial discovery.    |
| ---                 | ---                | ---                                                                                    | ---                                                  |
| `radius_meters`     | `INTEGER`          | NOT NULL, DEFAULT 2000, CHECK (radius_meters BETWEEN 500 AND 10000)                    | Active response radius bounds.                       |
| ---                 | ---                | ---                                                                                    | ---                                                  |
| `stake_status`      | `BOOLEAN`          | NOT NULL, DEFAULT false                                                                | Cryptographic slashing collateral verification flag. |
| ---                 | ---                | ---                                                                                    | ---                                                  |

### Table: sos_incidents

Active distress alerts and operational dispatch session records.

| Column Name    | Physical Data Type      | Modifiers / Constraints                                                                                     | Description                                              |
| -------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `incident_id`  | `UUID`                  | `PK, DEFAULT gen_random_uuid()`                                                                             | Internal incident tracking key.                          |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `user_id`      | `UUID`                  | `NOT NULL, FK -> users(user_id) ON DELETE RESTRICT`                                                         | Victim smart account reference.                          |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `session_uuid` | `UUID`                  | `NOT NULL, UNIQUE`                                                                                          | Client-generated session identifier for cross-rail sync. |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `alert_level`  | `VARCHAR(12)`           | `NOT NULL, CHECK (alert_level IN ('AMBER', 'RED', 'CRITICAL'))`                                             | Severity indicator determining automatic escalations.    |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `trigger_mode` | `VARCHAR(20)`           | `NOT NULL, CHECK (trigger_mode IN ('MANUAL_BUTTON', 'VOICE_DURESS', 'FALL_DETECTION', 'DEAD_MAN_SWITCH'))`  | Sensor or input vector initiating the alert.             |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `status`       | `VARCHAR(20)`           | `NOT NULL, DEFAULT 'TRIGGERED', CHECK (status IN ('TRIGGERED', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_ALARM'))` | Life-cycle status of the emergency.                      |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `origin_lat`   | `NUMERIC(10, 7)`        | `NOT NULL`                                                                                                  | Initial WGS 84 latitude coordinate.                      |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `origin_long`  | `NUMERIC(10, 7)`        | `NOT NULL`                                                                                                  | Initial WGS 84 longitude coordinate.                     |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `geom`         | `GEOMETRY(Point, 4326)` | `NOT NULL`                                                                                                  | PostGIS spatial point entity (WGS 84 SRID 4326).         |
| ---            | ---                     | ---                                                                                                         | ---                                                      |
| `created_at`   | `TIMESTAMPTZ`           | `NOT NULL, DEFAULT clock_timestamp()`                                                                       | Immutable server time of initial trigger capture.        |
| ---            | ---                     | ---                                                                                                         | ---                                                      |

### Table: sos_dispatch_logs

Multi-rail communications log capturing redundant dispatch pipelines.

| Column Name     | Physical Data Type | Modifiers / Constraints                                               | Description                                          |
| --------------- | ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------- |
| `dispatch_id`   | `UUID`             | PK, DEFAULT gen_random_uuid()                                         | Unique log entry identifier.                         |
| ---             | ---                | ---                                                                   | ---                                                  |
| `incident_id`   | `UUID`             | NOT NULL, FK -> sos_incidents(incident_id) ON DELETE CASCADE          | Parent incident identifier.                          |
| ---             | ---                | ---                                                                   | ---                                                  |
| `rail_type`     | `VARCHAR(10)`      | NOT NULL, CHECK (rail_type IN ('WSS', 'SMS', 'BLE_MESH'))             | Communications transport channel utilized.           |
| ---             | ---                | ---                                                                   | ---                                                  |
| `status`        | `VARCHAR(16)`      | NOT NULL, CHECK (status IN ('QUEUED', 'SENT', 'DELIVERED', 'FAILED')) | Dynamic carrier transmission status.                 |
| ---             | ---                | ---                                                                   | ---                                                  |
| `payload_hash`  | `CHAR(64)`         | `NOT NULL`                                                            | SHA-256 cryptographic checksum of delivered content. |
| ---             | ---                | ---                                                                   | ---                                                  |
| `dispatched_at` | `TIMESTAMPTZ`      | NOT NULL, DEFAULT clock_timestamp()                                   | Timestamp of transmission attempt.                   |
| ---             | ---                | ---                                                                   | ---                                                  |
| `ack_at`        | `TIMESTAMPTZ`      | `NULL`                                                                | Receipt confirmation timestamp from carrier/device.  |
| ---             | ---                | ---                                                                   | ---                                                  |

### Table: anonymous_reports

Unlinkable community hazard submissions powered by zero-knowledge validity proofs.

| Column Name              | Physical Data Type | Modifiers / Constraints                                                              | Description                                             |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `report_id`              | `UUID`             | `PK, DEFAULT gen_random_uuid()`                                                      | Internal analytics primary key.                         |
| ---                      | ---                | ---                                                                                  | ---                                                     |
| `nullifier_hash`         | `CHAR(64)`         | `NOT NULL, UNIQUE`                                                                   | ZK-SNARK nullifier preventing double-submission.        |
| ---                      | ---                | ---                                                                                  | ---                                                     |
| `geohash_bucket`         | `VARCHAR(6)`       | `NOT NULL`                                                                           | Obfuscated spatial bucket (precision ~1.2km x 0.6km).   |
| ---                      | ---                | ---                                                                                  | ---                                                     |
| `incident_category_code` | `VARCHAR(32)`      | `NOT NULL`                                                                           | Standardized municipal hazard identification code.      |
| ---                      | ---                | ---                                                                                  | ---                                                     |
| `timestamp_bucket`       | `TIMESTAMPTZ`      | `NOT NULL`                                                                           | Time truncated to 1-hour windows to defeat correlation. |
| ---                      | ---                | ---                                                                                  | ---                                                     |
| `onchain_tx_hash`        | `CHAR(66)`         | `NOT NULL, UNIQUE`                                                                   | Polygon transaction hash verifying ZK validity proof.   |
| ---                      | ---                | ---                                                                                  | ---                                                     |
| `status`                 | `VARCHAR(16)`      | `NOT NULL, DEFAULT 'VERIFIED', CHECK (status IN ('PENDING', 'VERIFIED', 'FLAGGED'))` | Proof verification status.                              |
| ---                      | ---                | ---                                                                                  | ---                                                     |

### Table: efir_records

First Information Report escrow coordination table interfaced with statutory police pipelines.

| Column Name           | Physical Data Type | Modifiers / Constraints                                                                                      | Description                                                    |
| --------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| `efir_id`             | `UUID`             | `PK, DEFAULT gen_random_uuid()`                                                                              | e-FIR unique internal record key.                              |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `incident_id`         | `UUID`             | `NOT NULL, UNIQUE, FK -> sos_incidents(incident_id) ON DELETE RESTRICT`                                      | Direct link to triggering SOS incident.                        |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `fir_number`          | `VARCHAR(64)`      | `NULL, UNIQUE`                                                                                               | Statutory state police registry number once issued.            |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `police_station_code` | `VARCHAR(32)`      | `NOT NULL`                                                                                                   | Jurisdictional station identifier.                             |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `status`              | `VARCHAR(24)`      | `NOT NULL, DEFAULT 'DRAFTED', CHECK (status IN ('DRAFTED', 'PENDING_SIGNATURE', 'REGISTERED', 'ESCALATED'))` | Statutory life-cycle stage.                                    |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `bns_sections`        | `TEXT[]`           | `NOT NULL`                                                                                                   | Applicable penal provisions under the Bharatiya Nyaya Sanhita. |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `created_at`          | `TIMESTAMPTZ`      | `NOT NULL, DEFAULT clock_timestamp()`                                                                        | Local system creation timestamp.                               |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `sign_deadline`       | `TIMESTAMPTZ`      | `NOT NULL`                                                                                                   | Statutory escrow deadline before programmatic escalation.      |
| ---                   | ---                | ---                                                                                                          | ---                                                            |
| `sp_escalated`        | `BOOLEAN`          | `NOT NULL, DEFAULT false`                                                                                    | Flag denoting Superintendent of Police (SP) oversight alert.   |
| ---                   | ---                | ---                                                                                                          | ---                                                            |

### Table: bsa63_certificates

Admissibility certificates compliant with Section 63 of the Bharatiya Sakshya Adhiniyam, 2023.

| Column Name               | Physical Data Type | Modifiers / Constraints                                           | Description                                              |
| ------------------------- | ------------------ | ----------------------------------------------------------------- | -------------------------------------------------------- |
| `cert_id`                 | `UUID`             | `PK, DEFAULT gen_random_uuid()`                                   | Primary certificate identifier.                          |
| ---                       | ---                | ---                                                               | ---                                                      |
| `efir_id`                 | `UUID`             | `NOT NULL, UNIQUE, FK -> efir_records(efir_id) ON DELETE CASCADE` | Associated e-FIR proceeding.                             |
| ---                       | ---                | ---                                                               | ---                                                      |
| `root_merkle_hash`        | `CHAR(64)`         | `NOT NULL`                                                        | SHA-256 Merkle root summarizing chronological chunks.    |
| ---                       | ---                | ---                                                               | ---                                                      |
| `device_attestation_hash` | `CHAR(64)`         | `NOT NULL`                                                        | Hardware keystore attestation signature hash.            |
| ---                       | ---                | ---                                                               | ---                                                      |
| `cert_payload_ipfs_cid`   | `VARCHAR(128)`     | `NOT NULL`                                                        | IPFS CID pointing to legal JSON-LD certificate document. |
| ---                       | ---                | ---                                                               | ---                                                      |
| `generated_at`            | `TIMESTAMPTZ`      | `NOT NULL, DEFAULT clock_timestamp()`                             | Creation timestamp verifying chain of custody.           |
| ---                       | ---                | ---                                                               | ---                                                      |

## 3.2 On-Device SQLite Local Storage (SQLCipher Encrypted Engine)

### Table: offline_queue

High-reliability queue buffering operational dispatches during connectivity dropouts.

| Column Name    | SQLite Data Type | Modifiers / Constraints                                                            | Description                                          |
| -------------- | ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `queue_id`     | `INTEGER`        | `PRIMARY KEY AUTOINCREMENT`                                                        | Auto-incrementing internal queue index.              |
| ---            | ---              | ---                                                                                | ---                                                  |
| `payload_blob` | `BLOB`           | `NOT NULL`                                                                         | Encrypted serialized JSON payload for transit.       |
| ---            | ---              | ---                                                                                | ---                                                  |
| `payload_type` | `TEXT`           | NOT NULL, CHECK(payload_type IN ('LOC_HEARTBEAT', 'SOS_SIGNAL', 'CHUNK_MANIFEST')) | Routing selector type.                               |
| ---            | ---              | ---                                                                                | ---                                                  |
| `retry_count`  | `INTEGER`        | `NOT NULL DEFAULT 0`                                                               | Transmission retry failure tracker.                  |
| ---            | ---              | ---                                                                                | ---                                                  |
| `last_attempt` | `INTEGER`        | `DEFAULT 0`                                                                        | Unix epoch time in milliseconds of previous attempt. |
| ---            | ---              | ---                                                                                | ---                                                  |
| `status`       | `TEXT`           | NOT NULL DEFAULT 'READY', CHECK(status IN ('READY', 'PROCESSING', 'FAILED'))       | Local execution state.                               |
| ---            | ---              | ---                                                                                | ---                                                  |

### Table: local_captures

Transient buffer for locally captured evidentiary media and integrity metadata.

| Column Name     | SQLite Data Type | Modifiers / Constraints                            | Description                                               |
| --------------- | ---------------- | -------------------------------------------------- | --------------------------------------------------------- |
| `capture_id`    | `INTEGER`        | `PRIMARY KEY AUTOINCREMENT`                        | Local sequence identifier.                                |
| ---             | ---              | ---                                                | ---                                                       |
| `chunk_index`   | `INTEGER`        | `NOT NULL`                                         | Ordered partition sequence index for reassembly.          |
| ---             | ---              | ---                                                | ---                                                       |
| `iv_hex`        | `TEXT`           | `NOT NULL`                                         | 96-bit Initialization Vector for AES-GCM decryption.      |
| ---             | ---              | ---                                                | ---                                                       |
| `auth_tag_hex`  | `TEXT`           | `NOT NULL`                                         | 128-bit authentication tag validating payload integrity.  |
| ---             | ---              | ---                                                | ---                                                       |
| `sha256_digest` | `TEXT`           | `NOT NULL`                                         | Cryptographic checksum of raw captured frame buffer.      |
| ---             | ---              | ---                                                | ---                                                       |
| `ipfs_cid`      | `TEXT`           | `NULL`                                             | Content ID returned upon upstream IPFS pinning.           |
| ---             | ---              | ---                                                | ---                                                       |
| `is_anchored`   | `INTEGER`        | `NOT NULL DEFAULT 0, CHECK(is_anchored IN (0, 1))` | Boolean flag denoting inclusion in on-chain block anchor. |
| ---             | ---              | ---                                                | ---                                                       |

## 3.3 Polygon L2 Smart Contract State Schema

The Solidity smart contract layer defines explicit state variable layouts deployed on the Polygon L2 network.

### Contract: EvidenceRegistry.sol

struct Record {

```
    bytes32 chunkHash;         // SHA-256 digest of media chunk
    string ipfsCID;            // IPFS v1 multihash content pointer
    uint256 timestamp;         // Block timestamp at time of record insertion
    address observer;          // Account abstraction wallet that committed anchor
}
// sessionRoot maps a session UUID (bytes32) to an indexed media chunk identifier
mapping(bytes32 => mapping(bytes32 => Record)) public sessionRoot;
```

### Contract: ZKReportVerifier.sol

// Nullifier tracking preventing double-submission of anonymous community proofs

```
mapping(bytes32 => bool) public nullifierHashes;
// Counter recording total verified non-attributable safety reports
uint256 public verifiedReportCount;
event AnonymousReportLogged(bytes32 indexed nullifier, bytes32 indexed geohashBucket, uint256 timestampBucket);
```

### Contract: ComplaintEscrow.sol

struct EscrowState {

```
    uint256 incidentId;        // Reference mapped to off-chain incident UUID
    uint256 signDeadline;      // Epoch unix timestamp before automatic escalation
    bool isEscalated;          // SP escalation flag
    bool isSigned;             // Digital affirmative victim signature verification
}
// complaintId represents a uint256 translation of the e-FIR UUID
mapping(uint256 => EscrowState) public complaints;
event EscrowEscalated(uint256 indexed complaintId, uint256 timestamp);
```

### Contract: SOSLog.sol

struct BlockAnchor {

```
    bytes32 rootMerkleTree;    // Merkle tree root consolidating incident session trace
    uint256 anchorTimestamp;   // Block timestamp anchoring incident resolution
    address signatory;         // Public key address validating attestation
}
// incidentHash maps unique session UUID hash to immutable audit anchor
mapping(bytes32 => BlockAnchor) public incidentAnchors;
```

# 4. Cardinality & Relationship Matrix

The operational integrity of the system requires deterministic foreign key relationships, precise cardinalities, and strict deletion policies to protect legal chain-of-custody data.

| Parent Entity       | Child Entity         | Cardinality   | Foreign Key Column | Target Primary Key          | On Delete Rule | Description / Invariant Enforcement                           |
| ------------------- | -------------------- | ------------- | ------------------ | --------------------------- | -------------- | ------------------------------------------------------------- |
| `users`             | `emergency_contacts` | 1:N           | `user_id`          | `users.user_id`             | `CASCADE`      | Purging a user purges private contact listings.               |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `users`             | `guardians`          | 1:1           | `user_id`          | `users.user_id`             | `CASCADE`      | Guardians map directly to verified user profiles.             |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `users`             | `sos_incidents`      | 1:N           | `user_id`          | `users.user_id`             | `RESTRICT`     | User profiles cannot be deleted while active incidents exist. |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `sos_incidents`     | `sos_dispatch_logs`  | 1:N           | `incident_id`      | `sos_incidents.incident_id` | `CASCADE`      | Incident logs are bound to parent emergency sessions.         |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `sos_incidents`     | `efir_records`       | 1:1           | `incident_id`      | `sos_incidents.incident_id` | `RESTRICT`     | Incidents associated with legal filings are locked.           |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `efir_records`      | `bsa63_certificates` | 1:1           | `efir_id`          | `efir_records.efir_id`      | `CASCADE`      | Evidence certificates require a registered legal filing.      |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `anonymous_reports` | `ZKReportVerifier`   | 1:1 (Logical) | `nullifier_hash`   | `nullifierHashes`           | `NO ACTION`    | On-chain state asserts uniqueness for anonymous hazards.      |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |
| `local_captures`    | `EvidenceRegistry`   | 1:1 (Logical) | `sha256_digest`    | `Record.chunkHash`          | `NO ACTION`    | Physical files correspond to cryptographic on-chain roots.    |
| ---                 | ---                  | ---           | ---                | ---                         | ---            | ---                                                           |

# 5. Data Normalization & Integrity Enforcement

## 5.1 Third Normal Form (3NF) Compliance Analysis

The schema satisfies Third Normal Form (3NF) requirements across relational structures:

- **First Normal Form (1NF):** Every table attribute contains atomic elements. Repeating groups are broken into child relations (e.g., emergency_contacts isolates dynamic contacts; sos_dispatch_logs abstracts transmission rails). The array attribute bns_sections in efir_records represents standardized, non-transitive categorical identifiers preserved as structured arrays for performance.
- **Second Normal Form (2NF):** No partial dependencies exist. All non-key attributes are fully functionally dependent on the entire composite or primary key.
- **Third Normal Form (3NF):** Non-key attributes depend exclusively on the primary key without transitive dependencies. Operational states, such as spatial attributes in sos_incidents, store raw points, deriving district codes and dynamic routing vectors dynamically via relational joins and spatial queries rather than denormalized columns.

## 5.2 Geospatial Indexing & Strategy

Geospatial coordination relies on spatial indexing via PostGIS and deterministic spatial partitioning via Uber H3 hex-grids.

### PostGIS Geometry R-Tree (GiST) Indexing

Location-based records are indexed utilizing Generalized Search Trees (GiST) on bounding-box coordinates for sub-millisecond execution of spatial containment and proximity queries.l  
\-- Spatial GiST Index for real-time proximity searches  
CREATE INDEX idx_sos_incidents_geom ON sos_incidents USING GIST (geom);

\-- Verification Query: Dispatching guardians within active radiuses  
SELECT g.guardian_id, u.smart_account_address  
FROM guardians g  
JOIN users u ON g.user_id = u.user_id  
WHERE g.status = 'STANDBY'  
AND ST_DWithin(  
g.geom,  
ST_SetSRID(ST_MakePoint(:incident_long, :incident_lat), 4326)::geography,  
g.radius_meters  
);



```
#### H3 Hexagonal Spatial Indexing for DPDP Minimization
Anonymous community records avoid continuous coordinates. Instead, spatial data is normalized into discrete H3 hexagonal bins (Resolution 7 ~1.22 km edge length) stored within the `geohash_bucket` field:
*   Precludes trilateration of reporting victims.
*   Enables efficient indexed aggregation of territorial hazard scores using integer lookups rather than compute-heavy bounding-box calculations.
### 5.3 Cryptographic Integrity Enforcement & Audit Trails
To guarantee evidentiary integrity admissible under Section 63 of the Bharatiya Sakshya Adhiniyam, 2023, data mutations are governed by cryptographic constraints:
*   **Nullifier Uniqueness:** Double-reporting and Sybil attacks on the anonymous safety layer are mitigated via unique constraints on `anonymous_reports.nullifier_hash`. The nullifier is computed off-device within a zero-knowledge circuit:
    $$\text{Nullifier} = \mathcal{H}_{\text{Poseidon}}(\text{User Secret Identity Key}, \text{Incident Epoch Bucket})$$
*   **Merkle Leaf Verification:** Local multimedia chunks cannot be modified post-capture. The `bsa63_certificates.root_merkle_hash` column stores an unalterable binary cryptographic root derived from individual sequential chunks:
    $$\text{Merkle Root} = \mathcal{H}\Big(\mathcal{H}(\text{Chunk}_0) \,\|\, \mathcal{H}(\text{Chunk}_1) \,\|\, \dots \,\|\, \mathcal{H}(\text{Chunk}_n)\Big)$$
*   **Append-Only State Logging:** Modifications to `sos_incidents` trigger PostgreSQL write-once audit logs, recording transaction identifiers and cryptographically signing snapshot states directly to the Polygon L2 `EvidenceRegistry` contract. This guarantees that internal server administrators cannot alter timestamps, location histories, or dispatch metrics without failing cryptographic verification.
```

