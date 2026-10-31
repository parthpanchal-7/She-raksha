# She-Raksha (शी-रक्षा) — Antigravity Agent Master Prompt Playbook, MCP Gatekeeper & DevOps Suite

> **Purpose:** Copy-paste prompt engineering playbook built for **Antigravity / Claude Code / Cursor Agents** to autonomously initialize, enforce MCP & credential connections, build all 9 monorepo packages, track live progress in `PHASES_COMPLETED.md`, deploy across Web3/Cloud/Mobile infrastructure, and produce a judge-ready **Shakti Hackathon `README.md`** complete with UI glimpses and verification proofs.

---

## Part 1: Master Initialization, MCP Enforcement & Credential Gatekeeper Prompt

Copy and paste **Prompt 0** first to start the project. It instructs the Antigravity agent to verify system dependencies, mandate **MCP (Model Context Protocol)** connections for supported platforms, interactively collect API keys/endpoints for remaining services before writing integration code, and initialize the `PHASES_COMPLETED.md` tracker.

### Prompt 0 — Autonomous Environment Setup, MCP Gatekeeper & Credential Handshake

```markdown
@she-raksha
Act as the Lead Principal Systems Architect and Autonomous Antigravity Engineering Agent for **She-Raksha (शी-रक्षा)** — a decentralized, offline-first women's safety, multi-rail SOS dispatch, zero-knowledge bystander reporting, and automated BNSS §173 / BSA §63 legal platform.

Before writing application code, execute this strict **4-Stage Initialization & Gatekeeper Protocol**:

### Stage 1: Automated Prerequisite & Toolchain Verification
Ask for my permission to run terminal commands, then verify and install all required global/workspace toolchains:
1. Check `node >= 20.11.0`, `pnpm >= 9.0.0`, `turbo`, `git`, and `docker` (or local `psql` with PostgreSQL 16 + PostGIS 3.4).
2. Verify/install Web3 & ZK compilers: `hardhat`, `circom >= 2.1.6`, `snarkjs`, and `@semaphore-protocol/contracts`.
3. Verify/install Mobile & Cloud CLIs: `eas-cli` (Expo Application Services) and `vercel`.

### Stage 2: Mandatory MCP (Model Context Protocol) Enforcement Gate
Inspect your active MCP servers. You MUST enforce using MCP servers for the following platforms rather than raw ad-hoc scripts whenever available:
1. **PostgreSQL / Supabase MCP (`postgres` or `supabase` MCP):** Required for executing 3NF DDL migrations, PostGIS `GEOGRAPHY(Point, 4326)` GiST indexing, and spatial `ST_DWithin` verification queries.
2. **GitHub MCP (`github` MCP):** Required for branch management, automated commit tagging per phase, and CI workflow verification.
3. **Vercel MCP (`vercel` MCP):** Required for Next.js 14 PWA deployment, WASM header configuration, and environment variable syncing.
4. **Filesystem / Brave / Sequential Thinking MCP:** Required for deterministic monorepo file operations and statutory verification.

If any of the above MCP servers are not connected, **STOP and instruct me on how to enable the MCP server in my Antigravity config** (or ask for my explicit permission to proceed with local CLI fallback only after logging the fallback state).

### Stage 3: Interactive Platform Credential & Endpoint Collection Gate
For external platforms that require API keys, RPC endpoints, or signing secrets, **PAUSE and prompt me interactively** to provide the credentials below (grouped by tier). Validate each provided endpoint before writing it to `.env.local` (never commit secrets to Git):
1. **Polygon L2 & Account Abstraction (Alchemy/Infura + Web3Auth + Biconomy/ZeroDev):**
   - `POLYGON_AMOY_RPC_URL` (Alchemy or Infura HTTPS/WSS endpoint)
   - `DEPLOYER_PRIVATE_KEY` (Hex private key funded with Amoy POL for contract deployment)
   - `POLYGONSCAN_API_KEY` (For automated contract source verification)
   - `WEB3AUTH_CLIENT_ID` (For MPC passkey/biometric onboarding)
   - `PAYMASTER_BUNDLER_URL` & `PAYMASTER_API_KEY` (Biconomy or ZeroDev ERC-4337 gasless sponsorship)
2. **Decentralized Storage (Pinata IPFS / Filecoin):**
   - `PINATA_JWT`, `PINATA_API_KEY`, `PINATA_SECRET_API_KEY`, and `PINATA_GATEWAY_DOMAIN`
3. **Multi-Rail Telecom & Emergency Relays (Twilio SMS + ERSS-112 Gateway):**
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`, and `TWILIO_FROM_NUMBER`
   - `ERSS_112_WEBHOOK_URL` and `ERSS_112_MTLS_CLIENT_CERT_PATH` (Offer to generate self-signed development mTLS certs if I select sandbox mode)
4. **Database & Mobile Packaging (Supabase/PostGIS + Expo EAS):**
   - `DATABASE_URL` (`postgresql://...` with PostGIS enabled)
   - `EXPO_TOKEN` and `EAS_PROJECT_ID`

### Stage 4: Initialize `PHASES_COMPLETED.md` Progress Ledger
Create a root file named `PHASES_COMPLETED.md` containing a live checklist table of all **12 Development Phases** and **5 Deployment & Testing Phases**, tracking:
- Phase ID & Name
- Package(s) Modified
- MCP / Credentials Verified
- Automated Test & NFR Benchmark Status (`PENDING` | `IN_PROGRESS` | `COMPLETED`)
- Completion Timestamp & Commit Hash

After every prompt we complete together, automatically update `PHASES_COMPLETED.md` and display the updated progress table before asking me to run the next prompt.
```

---

## Part 2: 12 Sequential Development Prompts (Full-Stack Monorepo Execution)

Run Prompts 1 through 12 in order. Each prompt completes a distinct architectural slice, runs automated tests, and updates `PHASES_COMPLETED.md`.

### Prompt 1 — Monorepo Architecture, Turborepo Pipeline & `@she-raksha/design-tokens`

```markdown
@she-raksha
Execute **Development Phase 1: Monorepo Foundation & Brand Design System**.

1. Initialize a `pnpm` workspace and `turbo.json` build pipeline with 9 packages under `packages/`:
   - `packages/design-tokens`
   - `packages/schemas`
   - `packages/crypto-core`
   - `packages/contracts`
   - `packages/circuits`
   - `packages/sdk`
   - `packages/backend`
   - `packages/mobile`
   - `packages/web`
2. Implement `@she-raksha/design-tokens` exporting both a Tailwind CSS preset and React Native theme tokens strictly enforcing the 10-token Brand Style Guide:
   - Canvas/Root: Midnight Obsidian (`#0A0D12`)
   - Surface Base: Dark Slate (`#121824`)
   - Brand Signal (SOS & Critical CTAs only): Crimson Coral (`#FF3B5C`)
   - High Accent (Timers & Warnings): Electric Amber (`#FF9F1C`)
   - Cryptographic Trust: Polygon Purple (`#7B3FE4`)
   - Verified State: Emerald Shield (`#00D084`)
   - Structural Neutral (1px borders, no drop shadows): Subtle Wire (`#222F3E`)
   - Text Hierarchy: Pure Frost (`#F8FAFC`), Muted Silver (`#94A3B8`), Dim Steel (`#64748B`)
   - Typography: `Plus Jakarta Sans` (700/600), `Inter` (400/500), `JetBrains Mono` (500 tabular uppercase for hashes/CIDs)
   - Component Radii & Touch Targets: `12px-16px` cards, `8px` buttons, `9999px` full-pill hash badges, minimum `48x48pt` SOS touch targets.
3. Run `pnpm turbo run build` and mark **Phase 1 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 2 — Canonical JSON Schemas, 3NF PostgreSQL/PostGIS Migrations & SQLCipher Schema (`@she-raksha/schemas`)

```markdown
@she-raksha
Execute **Development Phase 2: Canonical Data Contracts & Multi-Tier Database Schemas** inside `packages/schemas`.

1. Define the canonical shared enums (including the unified `TriggerMode` enum: `'HARDWARE_TAP_FOUR_PRESS' | 'SHAKE_ACCELEROMETER' | 'VOICE_DURESS_TFLITE' | 'FALL_DETECTION' | 'DEAD_MAN_SWITCH' | 'MANUAL_BUTTON'`) and compile JSON Schema + Zod validators for all 6 DFD data contracts:
   - `IncidentCapturePayload`
   - `EncryptedEvidenceRecord`
   - `SOSAlertPacket`
   - `ZKProofSubmission`
   - `eFIRRecord` (enforcing the 72-hour BNSS §173 deadline + optional 48-hour NGO early warning)
   - `BSA63CertificatePack`
2. Using the connected **PostgreSQL / Supabase MCP** (or migration runner after verifying `DATABASE_URL`), create and apply the 3NF SQL migrations enabling `postgis` and `pgcrypto` for all 8 central tables:
   - `users`, `emergency_contacts` (salted `contact_phone_hash CHAR(64)` + `encrypted_contact_details BYTEA`, zero cleartext PII), `guardians` (with `geom GEOGRAPHY(Point, 4326)` GiST index and `radius_meters` default 2000), `sos_incidents` (with `geom GEOMETRY(Point, 4326)` GiST index), `sos_dispatch_logs`, `anonymous_reports` (unlinked from `users`, unique `nullifier_hash CHAR(64)`, `spatial_bucket VARCHAR(6)` for `geohash-6`), `efir_records`, and `bsa63_certificates`.
3. Export the on-device SQLCipher DDL definitions for `local_captures` and `offline_queue`.
4. Write schema validation unit tests, run `pnpm --filter @she-raksha/schemas test`, and mark **Phase 2 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 3 — Client-Side Cryptographic Engine & Base91 SMS Codec (`@she-raksha/crypto-core`)

```markdown
@she-raksha
Execute **Development Phase 3: Cryptographic Primitives & Zero-Plaintext Buffer Engine** inside `packages/crypto-core`.

1. Implement deterministic 5-second media chunk envelope encryption using **`AES-256-GCM`**:
   - Derive ephemeral session keys via **`HKDF-SHA256`** with `info: "she-raksha-evidence-vault-ephemeral"`.
   - Generate a unique CSPRNG **96-bit IV** and **128-bit authentication tag** per chunk.
   - Enforce zero-plaintext persistence: explicitly overwrite raw input buffers (`buffer.fill(0)`) inside `finally` blocks immediately after encryption.
2. Implement the incremental **`SHA-256` Merkle Tree** builder that aggregates sequential chunk digests into a deterministic `sessionRoot` for batch anchoring (supporting up to 1,000 chunks per root).
3. Implement the **`Base91` GSM-7 SMS Packet Serializer & Decoder**:
   - Compress `{ sessionUuid, lat, long, h3IndexRes9, accuracyRadius, battery, triggerMode, timestamp, signature }` into `< 140 bytes` raw binary and encode to a `<= 160-character` GSM-7 safe Base91 string for Rail B fallback.
4. Implement `X25519-XSalsa20-Poly1305` asymmetric envelope encryption for `emergency_contacts` details.
5. Write benchmark and unit tests verifying `NFR-PERF-001` (50MB AES-256-GCM encryption in `<= 2.0s`), and mark **Phase 3 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 4 — Polygon L2 Smart Contracts Part 1: Evidence, SOS & Guardian Registries (`@she-raksha/contracts`)

```markdown
@she-raksha
Execute **Development Phase 4: Core Polygon L2 Smart Contracts (Part 1)** inside `packages/contracts` using Solidity `0.8.24`, Hardhat, and OpenZeppelin v5.

1. Implement `EvidenceRegistry.sol`:
   - Store `mapping(bytes32 sessionId => mapping(bytes32 chunkId => Record)) public sessionRoot` where `Record` contains `{ bytes32 chunkHash, string ipfsCID, uint256 timestamp, address observer }`.
   - Implement `anchorEvidence(bytes32 sessionRoot, string calldata ipfsCID, bytes calldata signature)` and batch Merkle root anchoring (`anchorSessionMerkleRoot`), plus `verifyDigest(bytes32 sessionId, bytes32 chunkHash)`.
   - Enforce strict zero-PII checks (only hashes and CIDv1 references).
2. Implement `SOSLog.sol`:
   - Store `mapping(bytes32 incidentHash => BlockAnchor) public incidentAnchors` where `BlockAnchor` holds `{ bytes32 rootMerkleTree, uint256 anchorTimestamp, address signatory }`.
   - Implement `notarizeDistress` and `logDisconnectionQueue` for replaying offline SQLCipher queues with original signed device timestamps.
3. Implement `GuardianRegistry.sol`:
   - Manage opt-in community guardians, ephemeral geohash commitments, public keys, and slashing stake status.
4. Write comprehensive Hardhat tests achieving 100% line and branch coverage on all three contracts, and mark **Phase 4 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 5 — Polygon L2 Smart Contracts Part 2: Statutory Escrow, ZK Verifier, AccessGrant & Paymaster (`@she-raksha/contracts`)

```markdown
@she-raksha
Execute **Development Phase 5: Statutory Escrow, ZK Verifier, Key Delegation & ERC-4337 Paymaster** inside `packages/contracts`.

1. Implement `ComplaintEscrow.sol`:
   - Track `struct EscrowState { uint256 incidentId; uint256 signDeadline; bool isEscalated; bool isSigned; }`.
   - Set `signDeadline = block.timestamp + 72 hours` (`259,200 seconds`) upon `initEscrow` in compliance with **BNSS §173**.
   - Implement `recordVictimSignature`, `recordPoliceAcknowledgement`, and `trigger72HrEscalation(uint256 complaintId)` emitting `EscrowEscalated(uint256 indexed complaintId, uint256 timestamp)` for automatic **BNSS §173(4)** Superintendent of Police (SP) escalation.
2. Implement `ZKReportVerifier.sol`:
   - Integrate the Groth16 pairing verifier interface for `AnonymousBystanderReportVerifier_v2` with public inputs `[poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour]`.
   - Maintain `mapping(bytes32 => bool) public nullifierHashes` and revert with `DuplicateNullifier(bytes32 nullifier)` if a nullifier is reused.
   - Emit `AnonymousReportLogged(bytes32 indexed nullifier, bytes32 indexed geohashBucket, uint256 timestampBucket)`.
3. Implement `AccessGrant.sol`:
   - Provide time-bound, revocable cryptographic access grants (`grantLawEnforcement`, `grantNGOCaseworker`, `revokeAccess`) so victims and escrow rules control who can decrypt specific IPFS evidence vaults.
4. Implement `SheRakshaPaymaster.sol`:
   - ERC-4337 Verifying Paymaster sponsoring 100% of gas fees for registered Smart Accounts calling `EvidenceRegistry`, `SOSLog`, `ComplaintEscrow`, `ZKReportVerifier`, and `AccessGrant`, with monotonically increasing nonce replay protection (`NFR-SEC-003`) and low-balance alert events.
5. Run `pnpm --filter @she-raksha/contracts coverage` to verify **100% line and branch coverage (`NFR-SEC-004`)**, and mark **Phase 5 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 6 — Circom 2.1 Zero-Knowledge Anonymous Bystander Circuit & Semaphore Integration (`@she-raksha/circuits`)

```markdown
@she-raksha
Execute **Development Phase 6: Zero-Knowledge Anonymous Bystander Reporting Engine** inside `packages/circuits`.

1. Author `AnonymousBystanderReportVerifier_v2.circom` using Circom `2.1` and `circomlib` (`Poseidon`, `MerkleTreeChecker`, comparators):
   - **Private Inputs:** `identitySecret`, `identityPathElements[20]`, `identityPathIndices[20]`, `exactLatScaled`, `exactLongScaled`, `exactTimestamp`, `salt`.
   - **Public Inputs:** `poseidonNullifierHash`, `geohashBucket`, `incidentCategoryCode`, `timestampBucketEpochHour`, `identityMerkleRoot`, `incidentId`.
   - **R1CS Constraints:**
     a. Verify Semaphore-compatible identity commitment `Poseidon(identitySecret)` is a valid leaf in `identityMerkleRoot`.
     b. Verify spatial quantization of `(exactLatScaled, exactLongScaled)` matches `geohashBucket` (`geohash-6`, `~1.2km x 0.6km`) within the municipal jurisdiction boundary without exposing exact GPS coordinates.
     c. Verify `exactTimestamp` falls within `timestampBucketEpochHour` (1-hour quantization window).
     d. Enforce canonical Sybil-resistant nullifier: `poseidonNullifierHash === Poseidon(identitySecret, incidentId)`.
2. Create automated build scripts to compile the `.circom` circuit to `.r1cs` and `.wasm`, run the Groth16 trusted setup (Powers of Tau + phase 2 `.zkey`), export `verification_key.json`, and regenerate the Solidity pairing contract in `packages/contracts`.
3. Write a SnarkJS test suite proving:
   - Valid witness generates a Groth16 proof in `< 8.0 seconds` (`NFR-PERF-003`).
   - Submitting a second report with the same `(identitySecret, incidentId)` produces the identical `poseidonNullifierHash` and is rejected on-chain by `ZKReportVerifier.sol`.
4. Mark **Phase 6 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 7 — Keyless Account Abstraction, Web3Auth MPC & Pinata IPFS SDK (`@she-raksha/sdk`)

```markdown
@she-raksha
Execute **Development Phase 7: Unified Web3, ERC-4337 & Decentralized Storage SDK** inside `packages/sdk`.

1. Using the credentials collected in Stage 3, implement `SmartAccountClient`:
   - Integrate **Web3Auth MPC** + **W3C WebAuthn Passkeys (`secp256r1`)** so users onboard via FaceID/Fingerprint with zero seed phrases (`FR-ID-001`, `FR-ID-002`).
   - Connect the Biconomy / ZeroDev ERC-4337 Bundler and `SheRakshaPaymaster` so all contract calls execute as gasless `UserOperation` transactions (`FR-ID-003`).
2. Implement `PinataVaultClient`:
   - Stream encrypted `AES-256-GCM` chunks over mTLS/HTTPS to Pinata IPFS/Filecoin gateways, returning immutable base32 `CIDv1` identifiers (`FR-EV-002`).
   - Include a pin-health verifier asserting replication across `>= 3` nodes (`NFR-REL-003`).
3. Implement typed contract bindings using `viem` for `EvidenceRegistry`, `SOSLog`, `ComplaintEscrow`, `ZKReportVerifier`, `GuardianRegistry`, and `AccessGrant`.
4. Implement the ZK attribute-redacting Aadhaar e-Sign wrapper (`FR-ID-004`).
5. Write integration tests and mark **Phase 7 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 8 — Fastify Backend Part 1: Multi-Rail SOS Hub, PostGIS/H3 Guardian Matcher & Twilio/ERSS-112 Relays (`@she-raksha/backend`)

```markdown
@she-raksha
Execute **Development Phase 8: High-Throughput Multi-Rail SOS Dispatch & Geospatial Backend** inside `packages/backend`.

1. Build the Fastify server with TLS 1.3 REST endpoints and a low-latency duplex **WebSocket (`WSS`) SOS Hub** (`Rail A`):
   - Verify incoming `SOSAlertPacket` ECDSA/Smart Account signatures, persist to `sos_incidents` and `sos_dispatch_logs`, and acknowledge packets within `< 500ms` (`NFR-PERF-002`).
2. Implement the **Geofence Spatial Resolution & Guardian Target Matcher**:
   - Compute the victim's **Uber H3 Resolution 9** cell (`~100m`) and execute a PostGIS `ST_DWithin` GiST-indexed spatial query on `guardians.geom` to match active `STANDBY` guardians within **800 meters** (`FR-SOS-003`).
   - Obfuscate victim coordinates to a ~100m coarse vector on initial guardian push dispatch to preserve victim privacy until engagement.
3. Implement the **Rail B Cellular SMS & ERSS-112 Ingestion Gateway**:
   - Decode incoming `Base91` compressed SMS payloads from Twilio SMPP webhooks.
   - Dispatch priority-ordered outbound SMS alerts to `emergency_contacts` (tiers 1 to 5) followed immediately by the **Mock 112 ERSS** mTLS endpoint.
4. Implement the **Safe-Journey Dead-Man Check-In Monitor** (`FR-SOS-004`) that triggers stage-1 guardian alerts and stage-2 full SOS dispatch if a traveler misses their check-in by 120 seconds.
5. Write integration tests (including socket timeout and Base91 SMS decoding) and mark **Phase 8 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 9 — Fastify Backend Part 2: Multilingual BNS AI Engine, 72-Hr BNSS §173 Escalation Worker & BSA §63 Compiler (`@she-raksha/backend`)

```markdown
@she-raksha
Execute **Development Phase 9: Automated Statutory Legal Lifecycle & Multilingual AI Engine** inside `packages/backend`.

1. Implement the **Multilingual NLP & BNS Statutory Mapping Engine (`FR-EV-004`)**:
   - Accept voice/text narratives across the **22 Eighth Schedule Indian languages**.
   - Extract chronological incident entities and deterministically classify applicable sections of the **Bharatiya Nyaya Sanhita (BNS), 2023** (including **BNS §74** Assault on woman with intent to outrage modesty, **BNS §75** Sexual harassment, **BNS §78** Stalking, **BNS §79** Word/gesture intended to insult modesty, **BNS §85** Cruelty by husband or relatives, and **BNS §351(2)** Criminal intimidation).
   - Output a valid `eFIRRecord` JSON document compliant with **BNSS §173(1)** (Zero-FIR / e-FIR).
2. Implement the **72-Hour BNSS §173 Countdown & §173(4) SP Escalation Worker (`FR-EV-005`, `FR-EV-006`)**:
   - Run a deterministic background queue monitoring `efir_records.sign_deadline` (72 hours) synchronized with `ComplaintEscrow.sol`.
   - Trigger optional 48-hour early-warning webhooks to accredited legal aid NGOs.
   - At 72 hours without police registration/acknowledgement, invoke `trigger72HrEscalation` on-chain and dispatch the statutory **BNSS §173(4)** escalation dossier to the District Superintendent of Police (SP).
3. Implement the **BSA Section 63 Digital Evidence Certificate Compiler (`FR-EV-007`)**:
   - Generate a cryptographically signed **PDF/A-3 compliance pack** and **JSON-LD manifest** (`BSA63CertificatePack`) containing StrongBox/Secure Enclave hardware attestation, OS build metadata, sequential SHA-256 chunk hashes, Merkle root, IPFS `CIDv1` pinning proof, Polygon L2 transaction hash/block number, and the mandatory Section 63 admissibility declaration.
   - Pin the certificate pack to IPFS via Pinata and record it in `bsa63_certificates`.
4. Write unit and statutory verification tests (`NFR-REG-002`, `NFR-REG-003`) and mark **Phase 9 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 10 — React Native Mobile App Part 1: Stealth Hardware Triggers, Edge TFLite Voice Model & Multi-Rail Dispatch (`@she-raksha/mobile`)

```markdown
@she-raksha
Execute **Development Phase 10: Mobile Edge Hardware Triggers, TFLite Audio Classifier & Multi-Rail Failover Engine** inside `packages/mobile` (React Native + Expo EAS custom dev client).

1. Implement the **Stealth Hardware & Sensor Trigger Layer (`FR-SOS-001`)** with Android Foreground Service & iOS platform capability guards:
   - **4-Tap Power Button Interrupt** (with volume-button / stealth on-screen gesture fallback for OS-restricted environments).
   - **IMU Accelerometer Jerk-Vector Listener** sampled at `>= 50Hz` with remote-configurable threshold defaulting to **`2.5g`** (sustained shake) and **`3.8g`** (high-impact fall profile).
   - **On-Device Quantized TFLite Audio Classifier:** Run local DSP/NPU inference for acoustic distress wake-words/screams without streaming raw audio off-device.
2. Implement the **Dynamic Network Evaluator & 3-Rail Failover Engine (`FR-SOS-002`, `NFR-REL-002`)**:
   - Evaluate interface RTT within **`150ms`** and dispatch via **Rail A (`WSS`)**.
   - Enforce the **`5.0-second` hardware timer**: if Rail A does not return a cryptographic server ACK within 5.0 seconds, automatically drop to **Rail B (`Base91` GSM-7 SMS)** via native cellular stack / Twilio relay without user interaction.
   - Simultaneously broadcast **Rail C (`BLE 5.2 Extended Advertising Mesh`)** frames with hop-limited peer relay so nearby She-Raksha devices forward the distress beacon when cellular coverage is zero.
3. Implement the **SQLCipher Offline Synchronization Queue (`FR-SOS-005`)**:
   - Persist unacknowledged `SOS_SIGNAL`, `LOC_HEARTBEAT`, and `CHUNK_MANIFEST` records into encrypted SQLite (`offline_queue`) and automatically drain/anchor to `SOSLog.sol` with exponential backoff upon reconnect.
4. Write automated fault-injection tests verifying the 5.0-second Rail A -> Rail B failover and mark **Phase 10 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 11 — React Native Mobile App Part 2: Evidence Vault UI, Circom Mobile Prover & Brand Screens (`@she-raksha/mobile`)

```markdown
@she-raksha
Execute **Development Phase 11: Mobile Evidence Vault, Bystander ZK Prover & Brand UI Screens** inside `packages/mobile`.

1. Build the **5-Second Chunked Capture & Encryption Pipeline (`FR-EV-001` to `FR-EV-003`)**:
   - Record 1080p H.265 video, AAC audio, and high-accuracy GPS/NavIC + cell tower telemetry in rolling 5-second buffers.
   - Encrypt in-memory via `@she-raksha/crypto-core` (`AES-256-GCM`), log metadata to SQLCipher `local_captures`, stream ciphertext to Pinata IPFS, and anchor the session Merkle root to `EvidenceRegistry.sol` via gasless ERC-4337 `UserOperation`.
2. Build the **5 Core Mobile Screens** strictly adhering to `@she-raksha/design-tokens` (`#0A0D12` Midnight Obsidian root, `#121824` Dark Slate cards, `1px solid #222F3E` borders, `#FF3B5C` Crimson Coral reserved strictly for SOS triggers, `48x48pt` minimum touch targets, distinct haptic cadences, and calm authoritative voice):
   - **Stealth Home & 1-Tap SOS Command Center** (with live multi-rail status indicators: `WSS`, `SMS Base91`, `BLE Mesh`).
   - **Tamper-Proof Evidence Vault & BSA §63 Certificate Viewer** (rendering IPFS `CIDv1` and Polygon transaction hashes in `JetBrains Mono` full-pill badges with `#00D084` Emerald Shield checkmarks).
   - **Automated BNSS §173 e-FIR Generator & 72-Hour Countdown Tracker** (with 22-language voice input and live BNS section badges).
   - **Zero-Knowledge Bystander Reporter** (executing on-device SnarkJS Groth16 proving with Semaphore identity commitment and `geohash-6` privacy shield).
   - **Safe-Journey Dead-Man Switch & Community Guardian Radar** (showing 800m H3 proximity ring).
3. Verify zero plaintext files exist on device storage post-capture (`NFR-SEC-002`) and mark **Phase 11 COMPLETED** in `PHASES_COMPLETED.md`.
```

### Prompt 12 — Next.js 14 Survivor PWA, Police/NGO Dashboards & Judge-Ready Hackathon `README.md` (`@she-raksha/web` + Root)

```markdown
@she-raksha
Execute **Development Phase 12: Next.js 14 Discreet PWA, Institutional Portals & Showcase Hackathon `README.md`**.

1. Build `@she-raksha/web` using Next.js 14 (App Router), Tailwind CSS (`@she-raksha/design-tokens`), and Service Workers:
   - **Discreet Utility-Disguised Survivor Portal:** Appears as a calm daily utility/weather calculator with an instant double-ESC / gesture decoy switch, full client-side `AES-256-GCM` Evidence Vault, and BNSS §173 e-FIR filing.
   - **In-Browser WebAssembly ZK Bystander Portal:** Compiles witness inputs in-browser via SnarkJS WebWorkers + Semaphore and submits gasless Groth16 proofs to `ZKReportVerifier.sol`.
   - **Law Enforcement (SHO / District SP) & Accredited NGO Caseworker Dashboard:** Displays real-time PostGIS/H3 incident heatmaps, 72-hour BNSS §173 countdown queues, 48-hour NGO escalation alerts, one-click BSA §63 cryptographic hash-chain verification, and `AccessGrant.sol` key-delegated media decryption.
2. Generate high-resolution **UI Screenshots / Glimpses** (using Playwright headless Chromium against the running Next.js & Expo web/mobile views, saved under `docs/screenshots/`) capturing:
   - `01-sos-command-center-multirail.png` (Midnight Obsidian UI with Crimson Coral SOS trigger & active Rail A/B/C telemetry)
   - `02-evidence-vault-bsa63-certificate.png` (AES-256-GCM chunk timeline, IPFS CIDv1 & Polygon L2 Emerald Shield pills)
   - `03-bnss173-efir-72hr-countdown.png` (Multilingual BNS §74/§78 mapping & 72-hour SP escalation timer)
   - `04-zk-bystander-groth16-prover.png` (Zero-knowledge `geohash-6` quantization & Poseidon nullifier verification)
   - `05-police-ngo-postgis-dashboard.png` (H3 hex-grid guardian dispatch & caseworker escrow view)
3. Author a comprehensive, visually striking root **`README.md`** tailored for **Shakti Hackathon Judges & Evaluators**, including:
   - Hero banner, tagline (*"Capture once, prove forever, share only what you choose"*), badges (Solidity 0.8.24, Circom 2.1, Polygon L2, ERC-4337, PostGIS, DPDP/BNSS/BSA Compliant), and quick-navigation links.
   - The 4 Ground-Level Operational Gaps & NCRB Quantitative Baseline (`4,48,211` annual cases, `90.8%` court pendency).
   - **Visual Product Glimpses & UI Gallery** embedding the 5 captured screenshots (`docs/screenshots/*.png`) with architectural annotations.
   - End-to-End Architecture & Multi-Tier Persistence Diagrams (Mermaid + clean tables).
   - Indian Statutory Compliance Matrix (**BNS**, **BNSS §173 & §173(4)**, **BSA §63**, **DPDP Act 2023**).
   - Complete 9-Package Monorepo Map, Quickstart & MCP Setup Guide, and a **3-Minute Judge Live Evaluation Script** testing all 4 primary KPIs.
4. Mark **Phase 12 COMPLETED** in `PHASES_COMPLETED.md`.
```

---

## Part 3: 5 Deployment, DevOps & End-to-End Testing Prompts (With Reference Architecture Blueprint)

Use Prompts **D1 through D5** after completing development to generate your production deployment configs, deploy the contracts and cloud services, package the mobile app, and execute the full NFR test suite.

### Prompt D1 — Master Senior DevOps & Web3 Infrastructure Architect Prompt

Copy and paste this exact prompt to generate and execute the unified deployment architecture and `.env` boilerplates (a complete reference output is also provided directly below it):

```markdown
@she-raksha
Act as a Senior DevOps and Web3 Infrastructure Architect. I am looking to deploy a comprehensive decentralized application based on the following technical architecture and technology stack.

Please provide a deployment plan, structural architecture recommendations, and configuration boilerplates for the following stack components, and wire the deployment configuration files directly into our monorepo (enforcing MCP server tools for Vercel, Supabase/PostgreSQL, and GitHub wherever available, and prompting me for any missing production credentials):

1. Frontend & Mobile Hosting:
  - Next.js 14 PWA (optimized for Vercel/serverless with COOP/COEP WebAssembly headers for SnarkJS)
  - React Native App (packaged/built using Expo Application Services - EAS)
2. Backend & Database:
  - Node.js API (Fastify REST/WebSocket backend)
  - PostgreSQL 16 + PostGIS 3.4 (Relational & spatial database management)
  - Twilio API Integration (SMS Gateway for Base91 Rail B fallback)
3. Web3 & Blockchain (Polygon L2):
  - Smart Contracts: Solidity 0.8.24 managed via Hardhat
  - Contracts to deploy: EvidenceRegistry, ComplaintEscrow, SOSLog, ZKReportVerifier, GuardianRegistry, AccessGrant (plus ERC-4337 Paymaster)
  - Identity & Wallet: ERC-4337 smart wallet infrastructure with Web3Auth and a gasless paymaster (e.g., Biconomy or ZeroDev)
  - RPC Node Connectivity: Alchemy or Infura
4. Storage & Zero Knowledge (ZK):
  - IPFS / Filecoin pinning hosted via Pinata
  - Client-side encryption: AES-256-GCM (encrypted ciphertext pinned to IPFS)
  - ZK Proofs: Circom and SnarkJS (Groth16 protocol) with Semaphore for anonymous credential verification
5. AI Engine:
  - TFLite (TensorFlow Lite) voice model deployed on the client/edge
  - Multilingual NLP inference running on the Node.js backend

Please organize your output and repository configuration artifacts into:
- The recommended cloud infrastructure mapping (e.g., AWS, GCP, Vercel, Supabase, Railway/Fly.io).
- A step-by-step deployment timeline sequence (from smart contracts up to client hosting).
- Sample environment variable structure (.env templates) for the backend, smart contract, web, and mobile layers.
- Update `PHASES_COMPLETED.md` with **Deployment Phase D1 COMPLETED**.
```

#### Reference Architecture Output for Prompt D1 (Ready-to-Use Blueprint)

##### 1. Recommended Cloud & Web3 Infrastructure Mapping

| Architectural Layer | Component | Recommended Production Provider | Architectural Rationale & Scaling Configuration |
| :--- | :--- | :--- | :--- |
| **Web Client & Edge PWA** | Next.js 14 App Router (`packages/web`) | **Vercel Pro (Edge Network)** | Zero-config Next.js 14 serverless deployment; configure `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers so multi-threaded WebAssembly (`snarkjs` Groth16 prover) runs at native speed in browser workers. |
| **Mobile Client Build & OTA** | React Native + JSI + TFLite (`packages/mobile`) | **Expo Application Services (EAS Build & Submit)** | Compiles custom native Android (`.apk`/`.aab`) and iOS (`.ipa`) binaries bundling SQLCipher, BLE 5.2 peripheral advertising, and quantized `.tflite` wake-word models; supports signed OTA updates via `eas update`. |
| **Real-Time API & WSS Hub** | Node.js Fastify Server (`packages/backend`) | **AWS ECS Fargate (or Railway / Fly.io Dedicated VM)** | **Do not host the Fastify backend on stateless serverless lambdas** because Rail A requires persistent, long-lived bi-directional TLS 1.3 WebSockets (`< 500ms` SLA) and stateful 72-hour BNSS §173 timer workers (backed by Redis/BullMQ). |
| **Spatial & Relational DB** | PostgreSQL 16 + PostGIS 3.4 (`packages/schemas`) | **Supabase Dedicated (or AWS RDS PostgreSQL 16)** | Native support for `postgis` (`GEOGRAPHY(Point, 4326)` GiST indexing for sub-millisecond 800m Guardian matching), `pgcrypto`, connection pooling (Supavisor/PgBouncer), and automated point-in-time recovery. |
| **L2 Blockchain & RPC** | 6 Core Contracts + ERC-4337 (`packages/contracts`) | **Polygon PoS Mainnet / Amoy Testnet via Alchemy Supernode** | Sub-second block times and negligible L2 calldata costs; Alchemy provides dedicated `HTTPS` and `WSS` event listeners for `AnonymousReportLogged` and `EscrowEscalated`. |
| **Account Abstraction & MPC** | Keyless Smart Wallets (`packages/sdk`) | **Web3Auth (MPC Core Kit) + ZeroDev / Biconomy Paymaster** | Web3Auth maps device passkeys (`secp256r1`) to smart accounts; Biconomy/ZeroDev sponsors 100% of Polygon L2 gas fees via an ERC-4337 Verifying Paymaster with automated gas-tank refill alerts. |
| **Decentralized Evidence Vault** | Encrypted Media & BSA §63 Packs | **Pinata Dedicated IPFS Gateway + Filecoin Pinning** | Content-addressed `CIDv1` storage replicated across `>= 3` geographic regions (`NFR-REL-003`); serves only `AES-256-GCM` ciphertext blobs via mTLS/signed gateway URLs. |
| **Telecom & Emergency Relay** | Rail B SMS & ERSS-112 Bridge | **Twilio Programmable Messaging + AWS Nitro Enclave mTLS** | Twilio SMPP ingests/dispatches 160-char `Base91` GSM-7 emergency packets; AWS Nitro Enclave signs hardware-attested `BSA63CertificatePack` records and terminates mTLS with ERSS-112 endpoints. |

##### 2. Step-by-Step Deployment Timeline Sequence

1. **Step 1 — ZK Circuit Compilation & Trusted Setup (`packages/circuits`):**
   - Compile `AnonymousBystanderReportVerifier_v2.circom` $\rightarrow$ generate `.wasm` prover and `.zkey` proving key $\rightarrow$ export `Groth16Verifier.sol` into `packages/contracts/contracts/verifiers/` and upload `.wasm`/`.zkey` artifacts to a public immutable CDN/IPFS bucket for client caching.
2. **Step 2 — Polygon L2 Smart Contract Deployment & Verification (`packages/contracts`):**
   - Deploy in strict dependency order on Polygon Amoy / PoS Mainnet via Hardhat Ignition:
     1. `Groth16Verifier.sol` & Semaphore Registry
     2. `ZKReportVerifier.sol` (linked to `Groth16Verifier` address)
     3. `EvidenceRegistry.sol`
     4. `SOSLog.sol`
     5. `GuardianRegistry.sol`
     6. `ComplaintEscrow.sol` (configured with `72 hours = 259200s` statutory constant)
     7. `AccessGrant.sol`
     8. `SheRakshaPaymaster.sol` (funded with initial `POL` deposit on the ERC-4337 `EntryPoint v0.7` contract `0x0000000071727De22E5E9d8BAf0edAc6f37da032` and whitelisting contracts 2–7).
   - Verify all contract ABIs on Polygonscan and export deployed addresses to `packages/sdk/src/deployments/polygon.json`.
3. **Step 3 — Spatial Database Provisioning & Migrations (`packages/schemas`):**
   - Provision Supabase / RDS PostgreSQL 16 $\rightarrow$ enable `CREATE EXTENSION IF NOT EXISTS postgis;` and `pgcrypto;` $\rightarrow$ execute 3NF migrations (`users`, `emergency_contacts`, `guardians`, `sos_incidents`, `sos_dispatch_logs`, `anonymous_reports`, `efir_records`, `bsa63_certificates`) and verify GiST spatial indexes.
4. **Step 4 — Fastify Backend, Multilingual NLP & Relayer Deployment (`packages/backend`):**
   - Deploy containerized Node.js Fastify backend + Redis (for the 72-hour BNSS §173 & 48-hour NGO escalation BullMQ workers) to AWS ECS Fargate / Railway.
   - Configure Twilio inbound/status webhooks (`/api/v1/sos/sms-webhook`) and ERSS-112 mTLS certificates.
5. **Step 5 — Next.js 14 PWA Deployment (`packages/web`):**
   - Deploy `packages/web` to Vercel connected to the backend `WSS`/`HTTPS` URLs, Pinata gateway, Web3Auth Client ID, and Polygon contract addresses.
6. **Step 6 — React Native Mobile Packaging (`packages/mobile`):**
   - Bundle the quantized TFLite audio distress model (`distress_classifier_quant.tflite`) and Circom `.zkey` into native assets $\rightarrow$ build signed Android `.apk`/`.aab` and iOS `.ipa` via **Expo EAS (`eas build --platform all --profile production`)**.

##### 3. Sample Environment Variable Templates (`.env.example`)

**`packages/contracts/.env.example`**
```ini
# Polygon L2 RPC & Deployment Credentials
POLYGON_AMOY_RPC_URL="https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
POLYGON_MAINNET_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
DEPLOYER_PRIVATE_KEY="0xYOUR_64_HEX_CHAR_DEPLOYER_PRIVATE_KEY"
POLYGONSCAN_API_KEY="YOUR_POLYGONSCAN_API_KEY"

# ERC-4337 EntryPoint v0.7 & Paymaster Configuration
ERC4337_ENTRYPOINT_ADDRESS="0x0000000071727De22E5E9d8BAf0edAc6f37da032"
PAYMASTER_VERIFYING_SIGNER="0xYOUR_PAYMASTER_SIGNER_PUBLIC_ADDRESS"
INITIAL_PAYMASTER_DEPOSIT_POL="10.0"
STATUTORY_EFIR_ESCROW_SECONDS="259200" # 72 Hours (BNSS Section 173)
```

**`packages/backend/.env.example`**
```ini
# Server & Security
NODE_ENV="production"
PORT="8080"
HOST="0.0.0.0"
CORS_ALLOWED_ORIGINS="https://she-raksha.vercel.app"
ENCLAVE_ATTESTATION_PRIVATE_KEY="0xYOUR_TEE_ATTESTATION_SIGNING_KEY"

# PostgreSQL 16 + PostGIS 3.4 (Supabase / RDS)
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@db.your-project.supabase.co:5432/postgres?sslmode=require"
REDIS_URL="rediss://default:YOUR_REDIS_PASSWORD@your-redis-host:6379"

# Polygon L2 & Relayer Signer
POLYGON_CHAIN_ID="80002" # 80002 = Amoy Testnet, 137 = Polygon Mainnet
POLYGON_RPC_HTTPS_URL="https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
POLYGON_RPC_WSS_URL="wss://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY"
RELAYER_SIGNER_PRIVATE_KEY="0xYOUR_BACKEND_RELAYER_PRIVATE_KEY"

# Deployed Smart Contract Addresses
EVIDENCE_REGISTRY_ADDRESS="0x..."
ZK_REPORT_VERIFIER_ADDRESS="0x..."
COMPLAINT_ESCROW_ADDRESS="0x..."
SOS_LOG_ADDRESS="0x..."
GUARDIAN_REGISTRY_ADDRESS="0x..."
ACCESS_GRANT_ADDRESS="0x..."
PAYMASTER_ADDRESS="0x..."

# Pinata IPFS / Filecoin Storage
PINATA_JWT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
PINATA_API_KEY="YOUR_PINATA_API_KEY"
PINATA_SECRET_API_KEY="YOUR_PINATA_SECRET_KEY"
PINATA_GATEWAY_URL="https://gateway.pinata.cloud"

# Twilio SMS Fallback (Rail B) & ERSS-112 Gateway
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_twilio_auth_token"
TWILIO_FROM_NUMBER="+1234567890"
ERSS_112_GATEWAY_URL="https://erss112-sandbox.gov.in/api/v1/ingest"
ERSS_112_MTLS_CERT_PATH="/etc/secrets/erss112-client.crt"
ERSS_112_MTLS_KEY_PATH="/etc/secrets/erss112-client.key"
NGO_EARLY_WARNING_HOURS="48"

# Multilingual NLP & BNS Statutory Classifier
NLP_INFERENCE_PROVIDER="local-indic-bert-or-vertex-endpoint"
NLP_MODEL_ENDPOINT="http://localhost:8081/v1/classify-bns"
```

**`packages/web/.env.example` & `packages/mobile/.env.example`**
```ini
# Public Web & Mobile Client Environment Variables
NEXT_PUBLIC_BACKEND_HTTPS_URL="https://api.she-raksha.org"
NEXT_PUBLIC_BACKEND_WSS_URL="wss://api.she-raksha.org/ws/sos"
EXPO_PUBLIC_BACKEND_HTTPS_URL="https://api.she-raksha.org"
EXPO_PUBLIC_BACKEND_WSS_URL="wss://api.she-raksha.org/ws/sos"

# Web3Auth MPC & ERC-4337 Gasless Account Abstraction (Biconomy / ZeroDev)
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID="BPi5PB_UiIZ-cPz1GtV5i1I2iOSOHuimiXBI0e-Oe_u6X3oVAbCiAZOTEBtTXw4tsluTITPqA8zMsfxIKMjiqNQ"
NEXT_PUBLIC_WEB3AUTH_NETWORK="sapphire_devnet"
NEXT_PUBLIC_BICONOMY_BUNDLER_URL="https://bundler.biconomy.io/api/v2/80002/YOUR_BUNDLER_ID"
NEXT_PUBLIC_BICONOMY_PAYMASTER_API_KEY="YOUR_BICONOMY_PAYMASTER_API_KEY"

# Polygon Contract Addresses & ZK Proving Artifacts
NEXT_PUBLIC_POLYGON_CHAIN_ID="80002"
NEXT_PUBLIC_PINATA_GATEWAY_URL="https://gateway.pinata.cloud"
NEXT_PUBLIC_ZK_WASM_URL="/circuits/AnonymousBystanderReportVerifier_v2.wasm"
NEXT_PUBLIC_ZK_ZKEY_URL="/circuits/AnonymousBystanderReportVerifier_v2_final.zkey"

# Mobile Hardware Sensor Defaults (Remote Config Overridable)
EXPO_PUBLIC_SHAKE_THRESHOLD_G="2.5"
EXPO_PUBLIC_FALL_IMPACT_THRESHOLD_G="3.8"
EXPO_PUBLIC_RAIL_A_TIMEOUT_MS="5000"
```

---

### Prompt D2 — Polygon L2 Smart Contract Deployment, Verification & Paymaster Funding

```markdown
@she-raksha
Execute **Deployment Phase D2: Polygon L2 Contract Deployment, Polygonscan Verification & ERC-4337 Paymaster Setup**.

1. Verify that `POLYGON_AMOY_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, and `BICONOMY_PAYMASTER_API_KEY` (or `ZERODEV_PROJECT_ID`) are present in `.env`, or prompt me to provide them now.
2. Execute the Hardhat Ignition deployment script in `packages/contracts/ignition/modules/SheRakshaSuite.ts` to deploy all 6 contracts (`ZKReportVerifier`, `EvidenceRegistry`, `SOSLog`, `GuardianRegistry`, `ComplaintEscrow`, `AccessGrant`) plus `SheRakshaPaymaster` to Polygon Amoy Testnet.
3. Verify all deployed contracts on Polygonscan (`pnpm --filter @she-raksha/contracts verify:amoy`), stake and fund the Paymaster on ERC-4337 `EntryPoint v0.7`, and automatically write the verified contract addresses and ABIs to `packages/sdk/src/deployments/amoy.json`.
4. Run a live gasless `UserOperation` smoke test anchoring a sample SHA-256 digest and confirm `0 POL` was deducted from the user smart account.
5. Update `PHASES_COMPLETED.md` with **Deployment Phase D2 COMPLETED** (including all deployed contract addresses and Polygonscan links).
```

### Prompt D3 — Supabase/PostGIS Spatial Provisioning, Pinata IPFS Cluster & Fastify Backend Deployment

```markdown
@she-raksha
Execute **Deployment Phase D3: PostGIS Spatial Database, Pinata IPFS Gateway & Fastify Backend Deployment**.

1. Using the **Supabase / PostgreSQL MCP** (or `DATABASE_URL` after prompting me for credentials), apply all production SQL migrations in `packages/schemas/migrations`, verify `PostGIS 3.4` is active (`SELECT PostGIS_Full_Version();`), and verify the GiST spatial indexes on `guardians.geom` and `sos_incidents.geom`.
2. Verify `PINATA_JWT` and `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN`, then deploy `packages/backend` (using Docker + Railway/Fly.io/AWS ECS configuration) with sticky WebSocket (`WSS`) routing and the 72-hour BNSS §173 BullMQ worker active.
3. Run health checks against `/health`, `/ws/sos`, and `/api/v1/efir/classify-bns`, and update `PHASES_COMPLETED.md` with **Deployment Phase D3 COMPLETED**.
```

### Prompt D4 — Next.js 14 PWA (Vercel MCP) & React Native App (Expo EAS) Build Pipeline

```markdown
@she-raksha
Execute **Deployment Phase D4: Next.js 14 Vercel Deployment & React Native Expo EAS Build**.

1. Using the **Vercel MCP** (or `vercel` CLI after prompting me for project authorization), deploy `packages/web` to production:
   - Configure `next.config.mjs` and `vercel.json` with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` so WebAssembly multi-threaded SnarkJS proving works in-browser.
   - Sync all `NEXT_PUBLIC_*` contract addresses and Web3Auth/Paymaster keys.
2. In `packages/mobile`, configure `app.json` and `eas.json` with Android permissions (`FOREGROUND_SERVICE`, `RECORD_AUDIO`, `CAMERA`, `ACCESS_FINE_LOCATION`, `SEND_SMS`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_SCAN`) and bundle the quantized `.tflite` distress model and Circom `.zkey`.
3. Trigger `eas build --platform android --profile preview` (or local Gradle release build if requested) to produce the installable Hackathon evaluation `.apk`.
4. Update `PHASES_COMPLETED.md` with **Deployment Phase D4 COMPLETED**.
```

### Prompt D5 — Full NFR Quality Gate Suite, Fault-Injection Testing & Final Hackathon Audit

```markdown
@she-raksha
Execute **Deployment Phase D5: End-to-End NFR Quality Gate Verification, Fault-Injection Suite & Final Hackathon Audit**.

Run an automated end-to-end verification suite across the deployed stack and generate `docs/NFR_AUDIT_REPORT.md` proving every SRS requirement passes:
1. **`NFR-PERF-001` (Encryption Speed):** Benchmark `AES-256-GCM` encryption of a 50MB media buffer and assert execution time `<= 2.0s` with zero leftover plaintext files on disk (`NFR-SEC-002`).
2. **`NFR-PERF-002` & `NFR-REL-002` (SOS Latency & 5.0s Failover):**
   - Measure hardware trigger to `WSS` Rail A dispatch and assert `<= 500ms`.
   - Inject a network drop on Rail A and assert the client automatically dispatches the `< 140-byte` `Base91` GSM-7 SMS packet on Rail B within `5.0 seconds` without user action.
3. **`NFR-PERF-003` & Sybil Resistance (ZK Bystander Proving):**
   - Generate a Groth16 proof via `AnonymousBystanderReportVerifier_v2` in `< 8.0s`, verify `AnonymousReportLogged` on Polygon Amoy, then replay the same `(IdentitySecret, IncidentID)` and assert `ZKReportVerifier.sol` reverts with `DuplicateNullifier`.
4. **`NFR-REG-001`, `002`, `003` (Statutory & DPDP Compliance):**
   - Generate an e-FIR from a Hindi/English distress transcript, verify BNS §74/§78 classification and the 72-hour `ComplaintEscrow.sol` countdown, validate the generated `BSA63CertificatePack` PDF/A-3 + JSON-LD against the Polygon block timestamp and IPFS `CIDv1`, and verify that deleting the local user key renders the IPFS ciphertext mathematically undecryptable.
5. **Zero-PII On-Chain Scan (`SRS §2.4`):** Scan all emitted contract calldata and events to confirm zero cleartext or reversible PII exists on-chain.
6. Embed the final pass/fail benchmark table into `README.md` and mark **Deployment Phase D5 COMPLETED (100% Project Completion)** in `PHASES_COMPLETED.md`.
```
