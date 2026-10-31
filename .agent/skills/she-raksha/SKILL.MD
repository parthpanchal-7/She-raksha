---
name: she-raksha
description: Authoritative architecture, cryptography, smart contract, database, legal compliance (BNS, BNSS, BSA, DPDP Act), and brand design system rulebook for the She-Raksha project.
---

# she-raksha

Authoritative engineering and architectural rulebook for designing, implementing, reviewing, and debugging the She-Raksha decentralized women's safety, multi-rail emergency dispatch, zero-knowledge bystander reporting, and automated e-FIR platform.

## When to Use

- Writing, reviewing, or debugging code in any of the 9 `@she-raksha/*` monorepo packages (`contracts`, `circuits`, `crypto-core`, `schemas`, `sdk`, `design-tokens`, `backend`, `mobile`, `web`)
- Implementing or auditing Polygon L2 smart contracts (`EvidenceRegistry.sol`, `ZKReportVerifier.sol`, `ComplaintEscrow.sol`, `SOSLog.sol`, `GuardianRegistry.sol`, `AccessGrant.sol`, `Paymaster.sol`)
- Building or optimizing Circom 2.1 / SnarkJS Groth16 zero-knowledge circuits for anonymous bystander reporting
- Designing client-side `AES-256-GCM` media chunk encryption, IPFS/Filecoin Pinata pinning, or SQLCipher offline queues
- Implementing Indian statutory workflows under the Bharatiya Nyaya Sanhita (BNS), Bharatiya Nagarik Suraksha Sanhita (BNSS Section 173), Bharatiya Sakshya Adhiniyam (BSA Section 63), or Digital Personal Data Protection (DPDP) Act 2023
- Creating React Native screens or Next.js 14 PWA views using the She-Raksha Brand Style Guide

## Steps

### 1. Enforce Canonical Spec Resolutions (Single Source of Truth)

Earlier specification drafts (PRD, SRS, DFD, ERD, Brand Style Guide) contained minor parameter variances. Always resolve them using these canonical rules so contracts, circuits, and schemas remain compatible:

| Domain | Canonical Rule to Enforce |
| :--- | :--- |
| **e-FIR Escalation Timer** | Enforce **72 hours** (`259,200 seconds`) as the statutory timer under **BNSS Section 173** in `ComplaintEscrow.sol` and `efir_records.sign_deadline`. Treat **48 hours** strictly as an optional, deployment-configurable NGO early-warning webhook. |
| **Shake Trigger Threshold** | Expose the accelerometer threshold via remote config. Default to **`2.5g`** sustained shake for distress activation (FR-SOS-001) and support **`3.8g`** as the high-impact fall-detection profile (DFD 3.1). |
| **Unified Trigger Mode Enum** | Share one enum across `schemas`, `mobile`, `web`, and `backend`: `'HARDWARE_TAP_FOUR_PRESS' \| 'SHAKE_ACCELEROMETER' \| 'VOICE_DURESS_TFLITE' \| 'FALL_DETECTION' \| 'DEAD_MAN_SWITCH' \| 'MANUAL_BUTTON'`. |
| **ZK Nullifier Formula** | Compute `NullifierHash = Poseidon(IdentitySecret, IncidentID)`. This guarantees one report per verified identity per incident while preserving mathematical unlinkability across distinct incidents. |
| **Spatial Indexing & Buckets** | Use **`geohash-6`** (`~1.2km x 0.6km`, e.g., `ttnf7z`) in `anonymous_reports.spatial_bucket` to match the Circom public input. Use **Uber H3 Resolution 9** (`~100m`) and PostGIS `geom GEOGRAPHY(Point, 4326)` for Guardian proximity matching within an **800m** active dispatch radius (`guardians.radius_meters` defaults to `2000m` as the guardian's configurable ceiling). |
| **Rail B (SMS Fallback)** | Keep raw serialized SOS payloads **`< 140 bytes`** and encode via **Base91** to fit inside a single **160-character GSM-7 SMS segment**. Dispatch to priority-ordered `emergency_contacts` (tiers 1 to 5) first, followed immediately by the **ERSS-112** gateway upon a **5.0-second** Rail A WebSocket ACK timeout. |
| **Brand Color & UI Tokens** | Use the **10-token Brand Style Guide** as the single source of truth (superseding the 4-token table in SRS 4.1). Import tokens from `@she-raksha/design-tokens`. |

### 2. Respect Monorepo Package Boundaries

Route every code change to its designated workspace package rather than duplicating types, cryptographic logic, or contract ABIs across apps:

| Package | Path | Tech Stack | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| **`contracts`** | `packages/contracts` | Solidity `0.8.24`, Hardhat, OpenZeppelin | `EvidenceRegistry`, `ZKReportVerifier`, `ComplaintEscrow`, `SOSLog`, `GuardianRegistry`, `AccessGrant`, ERC-4337 `Paymaster` on Polygon PoS / Amoy L2. |
| **`circuits`** | `packages/circuits` | Circom `2.1`, SnarkJS, Groth16, Poseidon | `AnonymousBystanderReportVerifier_v2` R1CS circuits, Powers of Tau / ZKey setup scripts, Solidity verifier generation. |
| **`crypto-core`** | `packages/crypto-core` | TypeScript, WebCrypto / Native JSI Crypto | Chunked `AES-256-GCM` envelope encryption, `HKDF-SHA256`, incremental `SHA-256` Merkle trees, `Base91` SMS codec, zero-fill memory sanitization. |
| **`schemas`** | `packages/schemas` | JSON Schema (Draft 2020-12), Zod, SQL | Validation for the 6 DFD data contracts, shared enums, and PostgreSQL 16 + PostGIS 3.4 / SQLCipher migrations. |
| **`sdk`** | `packages/sdk` | TypeScript, `viem`, Web3Auth MPC, Pinata | ERC-4337 `UserOperation` bundler client, Web3Auth passkey/biometric wallet initialization, IPFS/Filecoin mTLS pinning client, typed contract hooks. |
| **`design-tokens`** | `packages/design-tokens` | TypeScript, Tailwind Preset, React Native | Brand colors, typography scale (`Plus Jakarta Sans`, `Inter`, `JetBrains Mono`), spacing, radii, and semantic status styles. |
| **`backend`** | `packages/backend` | Node.js, Fastify, PostgreSQL 16, PostGIS 3.4 | Duplex `WSS` SOS hub, PostGIS/H3 guardian matcher, Twilio SMS & Mock ERSS-112 mTLS relays, 72-hr BNSS Section 173 timer worker, BNS statutory classifier, BSA Section 63 PDF/A-3 compiler. |
| **`mobile`** | `packages/mobile` | React Native (TS), JSI, SQLCipher, TFLite | Hardware triggers (4-tap power, IMU accelerometer, edge TFLite audio), 5-sec media chunker, BLE 5.2 Mesh advertiser/relay, SQLCipher offline sync queue. |
| **`web`** | `packages/web` | Next.js 14 (App Router), Tailwind CSS, PWA | Discreet utility-disguised survivor PWA, in-browser WebAssembly SnarkJS prover, Police SHO/SP & Accredited NGO casework dashboards. |

Use standard workspace verification commands after making changes:

```bash
pnpm turbo run build
pnpm turbo run test
pnpm --filter @she-raksha/contracts coverage
pnpm --filter @she-raksha/circuits build:circuit
pnpm --filter @she-raksha/schemas db:migrate
```

### 3. Enforce Security, Privacy, and Statutory Invariants

Every feature, database query, and smart contract must uphold five core invariants because any breach compromises victim safety or legal admissibility:

1. **Zero PII On-Chain and In Central Databases (DPDP Act 2023):**
   - Never write cleartext, pseudonymized, or encrypted PII to Polygon L2. Restrict on-chain state and events to `SHA-256`/`keccak256` digests, `Poseidon` nullifiers, `IPFS CIDv1` strings, Merkle roots, and epoch timestamps.
   - In PostgreSQL, store phone numbers exclusively as salted `SHA-256` hashes (`contact_phone_hash CHAR(64)`) for deduplication, paired with client-side asymmetrically encrypted blobs (`encrypted_contact_details BYTEA` using `X25519-XSalsa20-Poly1305`).
   - Preserve the cryptographic right to erasure (NFR-REG-001): keep master decryption keys solely in the user's device enclave or time-bound legal escrow (`AccessGrant.sol`) so key deletion renders IPFS/Filecoin ciphertexts permanently irrecoverable.

2. **Zero Plaintext Media on Flash Storage (NFR-SEC-001, NFR-SEC-002):**
   - Split continuous audio (`AAC 128kbps`), video (`H.265 1080p 30fps`), and sensor telemetry (GPS NMEA, altitude, HDOP, cell tower `MCC/MNC/CellID`) into deterministic **5-second chunks** in RAM.
   - Encrypt each chunk in-memory using **`AES-256-GCM`** with a fresh CSPRNG **96-bit IV** and **128-bit authentication tag**, deriving session keys via **`HKDF-SHA256`** (`info: "she-raksha-evidence-vault-ephemeral"`).
   - Overwrite raw memory buffers (`buffer.fill(0)`) inside `finally` blocks immediately after encryption so plaintext never touches secondary storage.

3. **Keyless ERC-4337 Account Abstraction & Gasless UX (FR-ID-001 to FR-ID-003):**
   - Authenticate via **Web3Auth MPC** bound to device biometrics / **W3C WebAuthn Passkeys (`secp256r1`)** mapped to an **ERC-4337 Smart Contract Account**.
   - Wrap all contract calls into `UserOperation` structs with monotonically increasing nonces (NFR-SEC-003) sponsored 100% by the She-Raksha **Paymaster**.
   - Batch chunk hashes into session Merkle roots in `EvidenceRegistry.sol` to target 1 on-chain transaction per 1,000 anchored evidence records.

4. **Resilient Multi-Rail Distress Failover (FR-SOS-001 to FR-SOS-005):**
   - Evaluate active network interfaces within **`150ms`** of trigger activation and sign the `SOSAlertPacket` with the user's Smart Account key.
   - Dispatch across three parallel/failover rails:
     - **Rail A (Primary - WSS / Push):** Bi-directional TLS 1.3 WebSocket stream + FCM/APNs push (`<= 500ms` dispatch latency).
     - **Rail B (Secondary - Cellular SMS Fallback):** Upon a **`5.0s` Rail A ACK timeout**, automatically send a Base91-compressed GSM-7 SMS (`< 140 bytes` raw) via native telecom stack / Twilio SMPP to emergency contacts and `ERSS-112`.
     - **Rail C (Tertiary - BLE 5.2 Mesh Zero-Bearer):** Broadcast non-connectable BLE 5.2 Extended Advertising packets (`50-100m` range) for peer relay.
   - Persist unacknowledged packets in local **SQLCipher (`offline_queue`)** and replay state anchors to `SOSLog.sol` with exponential backoff on reconnect.

5. **Indian Statutory Alignment (BNS, BNSS, BSA 2023):**
   - **BNS Classification (FR-EV-004):** Transcribe witness/victim audio across any of the **22 Eighth Schedule Indian languages** and map allegations to BNS sections (e.g., **BNS Section 74** Assault on woman with intent to outrage modesty, **BNS Section 75** Sexual harassment, **BNS Section 78** Stalking, **BNS Section 351(2)** Criminal intimidation).
   - **BNSS Section 173 & Section 173(4) (FR-EV-005, FR-EV-006):** Track the 72-hour signing and police acknowledgement window in `ComplaintEscrow.sol`; auto-dispatch the Section 173(4) escalation dossier to the District Superintendent of Police (SP) and accredited NGOs on expiry.
   - **BSA Section 63 Certificate Pack (FR-EV-007):** Generate a cryptographically signed **PDF/A-3 and JSON-LD** certificate containing hardware enclave attestation (Android StrongBox / iOS Secure Enclave / AWS Nitro TEE), OS build specs, SHA-256 hash chains, IPFS `CIDv1` consensus status, and Polygon L2 transaction receipts.

### 4. Implement Smart Contracts, Circuits, and Schemas Accurately

#### Polygon L2 Smart Contracts (`packages/contracts`, Solidity `0.8.24`, 100% Coverage)

- **`EvidenceRegistry.sol`**: Maps `sessionRoot[sessionId][chunkId]` to `Record { bytes32 chunkHash, string ipfsCID, uint256 timestamp, address observer }`. Exposes `anchorEvidence(bytes32 sessionRoot, string calldata ipfsCID, bytes calldata signature)` and `verifyDigest(bytes32 sessionId, bytes32 chunkHash)`.
- **`ZKReportVerifier.sol`**: Verifies Groth16 proofs (`pi_a`, `pi_b`, `pi_c`) against public inputs `[poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour]`. Tracks spent nullifiers in `mapping(bytes32 => bool) public nullifierHashes` and emits `AnonymousReportLogged`.
- **`ComplaintEscrow.sol`**: Stores `EscrowState { uint256 incidentId, uint256 signDeadline, bool isEscalated, bool isSigned }` with `initEscrow` and `trigger72HrEscalation(uint256 complaintId)`.
- **`SOSLog.sol`**: Anchors incident Merkle roots via `BlockAnchor { bytes32 rootMerkleTree, uint256 anchorTimestamp, address signatory }`.
- **`GuardianRegistry.sol` & `AccessGrant.sol`**: Manage guardian spatial hashes/stakes and time-bound, revocable decryption key grants (`grantLawEnforcement`, `revokeAccess`).

#### Circom ZK Circuit (`packages/circuits`)

- **Circuit**: `AnonymousBystanderReportVerifier_v2.circom`
- **Private Inputs**: `identitySecret (sk)`, `identityMerklePath`, `exactLatitude`, `exactLongitude`, `exactTimestamp`, `salt`.
- **Public Inputs**: `poseidonNullifierHash`, `geohashBucket` (6-char geohash), `incidentCategoryCode`, `timestampBucketEpochHour` (1-hour quantized window).
- **Performance Target**: Keep mobile Groth16 proving time **`<= 8.0 seconds`** in Phase 1 MVP and **`< 4.0 seconds`** in Phase 3 on Snapdragon 700-class devices.

#### Multi-Tier Persistence & Payload Schemas (`packages/schemas`)

- **PostgreSQL 16 + PostGIS 3.4 (3NF)**: `users`, `emergency_contacts` (CASCADE), `guardians` (CASCADE, includes `geom GEOGRAPHY(Point, 4326)` GiST index), `sos_incidents` (RESTRICT on user delete), `sos_dispatch_logs` (CASCADE), `anonymous_reports` (unlinked from `users`, unique `nullifier_hash`, `spatial_bucket VARCHAR(6)`), `efir_records` (RESTRICT on incident delete), and `bsa63_certificates` (CASCADE).
- **On-Device SQLCipher**: `local_captures` (`capture_id`, `chunk_index`, `iv_hex`, `auth_tag_hex`, `sha256_digest`, `ipfs_cid`, `is_anchored`) and `offline_queue` (`queue_id`, `payload_blob`, `payload_type`, `retry_count`, `last_attempt`, `status`).
- **6 Canonical JSON Schemas**: Validate all payloads against `IncidentCapturePayload.json`, `EncryptedEvidenceRecord.json`, `SOSAlertPacket.json`, `ZKProofSubmission.json`, `eFIRRecord.json`, and `BSA63CertificatePack.json`.

### 5. Apply Brand Design Tokens and Calm Authoritative Voice

When building React Native (`packages/mobile`) or Next.js 14 (`packages/web`) interfaces, use the 10-token palette and typography rules:

| Token Role | Name | Hex | Usage Rule |
| :--- | :--- | :--- | :--- |
| **Canvas / Root** | Midnight Obsidian | `#0A0D12` | Global dark background, viewport root, deep background cards. |
| **Surface Base** | Dark Slate | `#121824` | Component containers, modals, bottom sheets, navigation bars. |
| **Brand Signal** | Crimson Coral | `#FF3B5C` | Strictly reserved for SOS triggers, critical CTAs, and live countdown alerts. Never use on routine dismissals or secondary actions. |
| **High Accent** | Electric Amber | `#FF9F1C` | Escalation warnings, pending 72-hr timers, active status markers. |
| **Cryptographic Trust** | Polygon Purple | `#7B3FE4` | ZK proof badges, smart contract links, wallet/blockchain status. |
| **Verified State** | Emerald Shield | `#00D084` | Hash anchored confirmation, guardian connected, receipt verified checkmarks. |
| **Structural Neutral** | Subtle Wire | `#222F3E` | `1px solid` card borders, dividers, inactive container strokes. |
| **Text Primary** | Pure Frost | `#F8FAFC` | Display headings, screen titles, primary metrics, active button labels. |
| **Text Secondary** | Muted Silver | `#94A3B8` | Standard body copy, secondary descriptive labels, captions. |
| **Text Tertiary** | Dim Steel | `#64748B` | Timestamps, raw contract hashes, disabled states. |

- **Typography**: `Plus Jakarta Sans` (`700 Bold` / `600 SemiBold`) for headings, `Inter` (`400 Regular` / `500 Medium`) for body/UI, and `JetBrains Mono` (`500 Medium`, tabular-nums, uppercase in full-pill `9999px` badges with an `#00D084` Emerald Shield check) for hashes, CIDs, timers, and legal codes.
- **Surfaces & Accessibility**: Use `12px-16px` card radius, `8px` button radius, `1px solid #222F3E` borders without heavy drop shadows (use a `10%` opacity radial accent glow for active SOS/e-FIR cards), minimum **`48x48 pt`** touch targets, WCAG 2.1 AA contrast, and Feather/Lucide icons (`1.75px-2px` stroke).
- **Content Voice**: Write direct, calm, authoritative, empowering microcopy (e.g., *"Evidence encrypted on-device. Digest anchored on Polygon L2."* or *"Emergency protocol initiated. 3 trusted guardians notified with verified location."*). Never use alarmist or patronizing phrasing.

## Gotchas

- **Mobile OS Sandbox Restrictions**: Android and iOS restrict raw hardware power-button interception, continuous background microphone access, silent SMS transmission, and background BLE advertising. Implement Android foreground services and accessibility hooks with explicit fallbacks (volume-button or on-screen stealth gestures and opt-in battery-metered TFLite audio classification) and clear iOS platform capability guards.
- **Accidental PII Logging**: Never log raw GPS coordinates, phone numbers, audio buffers, or ZK witness secrets (`identitySecret`) to console logs, error trackers, or smart contract events.
- **IV Reuse & Unwiped Buffers**: Never reuse an `AES-256-GCM` initialization vector across 5-second media chunks, and always zero-fill plaintext byte buffers in `finally` blocks immediately after encryption.
- **Phase Alignment**: Keep deliverables aligned with the 3 gated phases (Phase 1 MVP Weeks 1-4 on Polygon Amoy; Phase 2 Pilot Months 2-4 with Mock 112 ERSS, Aadhaar e-Sign, NGO portal, and external contract audit; Phase 3 Rollout Months 5-8 with `< 4.0s` proving and Filecoin smart-contract pinning).