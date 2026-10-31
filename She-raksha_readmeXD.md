# She-Raksha (शी-रक्षा) — Decentralized Legal Defense & Emergency Infrastructure

> **"Capture once, prove forever, share only what you choose."**
> **Target Hackathon:** Shakti Hackathon (Durga Puja Special) | **Architecture:** 9-Package TypeScript Monorepo | **Chain:** Polygon PoS / Amoy L2 (ERC-4337 Gasless) | **Statutory Alignment:** BNS, BNSS §173, BSA §63, DPDP Act 2023

---

## 1. Executive Summary & Problem Statement

**She-Raksha** transforms ordinary consumer smartphones into court-admissible legal recorders and offline-resilient personal defense nodes. By combining client-side **`AES-256-GCM` envelope encryption**, **Circom 2.1 / SnarkJS Groth16 zero-knowledge proofs**, **IPFS/Filecoin decentralized storage**, **ERC-4337 gasless smart accounts**, and **automated statutory workflows under the Bharatiya Nagarik Suraksha Sanhita (BNSS) and Bharatiya Sakshya Adhiniyam (BSA)**, She-Raksha eliminates single points of technical and institutional failure during life-safety emergencies.

### Quantitative Baseline (National Crime Records Bureau Context)

| Metric | NCRB / Judicial Figure | Operational Gap Addressed by She-Raksha |
| :--- | :--- | :--- |
| **Annual Registered Crimes Against Women** | **4,48,211 cases/year** (~1,228/day; 1 every ~70s) | Eliminates jurisdictional refusal via automated **BNSS §173 Zero-FIR / e-FIR** filing and **72-hour §173(4) SP escalation**. |
| **District Court Trial Pendency Rate** | **90.8% pendency** | Prevents evidentiary rejection under **BSA §63** via real-time `SHA-256` Merkle anchoring on Polygon L2 and hardware-attested **PDF/A-3 Custody Certificates**. |
| **Dead-Zone & Throttling Vulnerability** | **Single-rail app failure** in basements/transit | Guarantees packet delivery via **3-Rail Failover**: `WSS (< 500ms)` $\rightarrow$ `5.0s` auto-drop to `Base91 GSM-7 SMS (< 140B)` $\rightarrow$ `BLE 5.2 Mesh` + `SQLCipher` offline queue. |
| **Bystander Retaliation Paralysis** | **Unreported public assaults** due to witness fear | Protects eyewitnesses via **Groth16 zk-SNARKs + Semaphore** and **Poseidon nullifiers** (`geohash-6` quantization with zero PII exposure). |

---

## 2. Product Glimpses & UI Showcase (`@she-raksha/design-tokens`)

All client interfaces (`packages/mobile` React Native and `packages/web` Next.js 14 PWA) implement the **She-Raksha Dark-First Brand System** (`#0A0D12` Midnight Obsidian canvas, `#121824` Dark Slate surfaces, `1px solid #222F3E` borders, `#FF3B5C` Crimson Coral strictly reserved for SOS triggers, `#00D084` Emerald Shield verification pills, and `#7B3FE4` Polygon Purple ZK badges).

### Glimpse 1 — Multi-Rail SOS Command Center & Hardware Trigger HUD (`packages/mobile`)

```text
┌──────────────────────────────────────────────────────────────────────┐
│  SHE-RAKSHA (शी-रक्षा)                    [● ERC-4337 GASLESS READY] │
│  Smart Account: 0x1a2b...9a0b             [✓ PASSKEY ENCLAVE ACTIVE] │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│                     ╭──────────────────────────╮                     │
│                     │     HOLD OR 4x POWER     │                     │
│                     │       SOS TRIGGER        │  <-- #FF3B5C Coral  │
│                     │     (48x48pt+ Haptic)    │      10% Radial Glow│
│                     ╰──────────────────────────╯                     │
│                                                                      │
│  ACTIVE TRANSPORT RAILS (RTT EVALUATED IN 42ms)                      │
│  ┌────────────────────┬────────────────────┬──────────────────────┐  │
│  │ ● RAIL A: WSS      │ ● RAIL B: SMS      │ ● RAIL C: BLE 5.2    │  │
│  │ TLS 1.3 Connected  │ Base91 (<140B) Rdy │ 4 Mesh Peers (85m)   │  │
│  └────────────────────┴────────────────────┴──────────────────────┘  │
│                                                                      │
│  PROXIMATE GUARDIANS (H3 Res-9: 893c52e1e0bffff · 800m Ring)         │
│  [✓ 3 Verified Guardians on Standby]   [Safe-Journey Timer: 00:14:22]│
└──────────────────────────────────────────────────────────────────────┘
```
*Screenshot Asset Path:* `docs/screenshots/01-sos-command-center-multirail.png`

### Glimpse 2 — Tamper-Proof Evidence Vault & BSA §63 Certificate Pack (`packages/mobile` & `packages/web`)

```text
┌──────────────────────────────────────────────────────────────────────┐
│  EVIDENCE VAULT · SESSION #a8f9c4d2       [✓ BSA §63 ADMISSIBLE PACK]│
│  "Evidence encrypted on-device. Digest anchored on Polygon L2."      │
├──────────────────────────────────────────────────────────────────────┤
│  CHUNK #12 (5.0s · H.265 1080p + AAC + NavIC Telemetry)              │
│  • Cipher: AES-256-GCM (96-bit IV: 9f1c7d8a4b2e6f0a1c3e5a7b)         │
│  • RAM Sanitization: Plaintext buffer zero-filled (0x00) in 18ms     │
│  • IPFS CIDv1:  [ ✓ bafybeicv5...73g2yq ]  (#00D084 Emerald Pill)    │
│  • Polygon Tx:  [ ⬡ 0x89d2c...10f2 · Block #58201948 ] (#7B3FE4 Pill)│
│                                                                      │
│  STATUTORY e-FIR & ESCROW STATUS (BNSS §173 / ComplaintEscrow.sol)   │
│  • Applied BNS Sections: [ BNS §78 Stalking ] [ BNS §351(2) Intim. ] │
│  • Jurisdiction: PS-ND-002 (Parliament Street PS, New Delhi)         │
│  • Statutory Escalation Timer: 71h : 18m : 04s remaining             │
│    (Auto-escalates to District SP under BNSS §173(4) at 00:00:00)    │
│                                                                      │
│  [ Download Signed PDF/A-3 BSA §63 Certificate ]  [ Delegate Key ]   │
└──────────────────────────────────────────────────────────────────────┘
```
*Screenshot Asset Path:* `docs/screenshots/02-evidence-vault-bsa63-certificate.png`

### Glimpse 3 — Zero-Knowledge Anonymous Bystander Portal (`packages/web`)

```text
┌──────────────────────────────────────────────────────────────────────┐
│  ZERO-KNOWLEDGE BYSTANDER REPORT          [⬡ GROTH16 + SEMAPHORE v2] │
│  "Zero-knowledge proof generated. Identity attributes confidential." │
├──────────────────────────────────────────────────────────────────────┤
│  PRIVATE WITNESS INPUTS (NEVER LEAVE YOUR DEVICE)                    │
│  • Civic Identity Secret (sk):  ••••••••••••••••••••••••••••••••     │
│  • Exact GPS Coordinates:       28.613939° N, 77.209021° E (Hidden)  │
│                                                                      │
│  PUBLIC VERIFIED OUTPUTS (SUBMITTED TO ZKReportVerifier.sol)         │
│  • Spatial Bucket (Geohash-6):  [ ttnf7z (~1.2km x 0.6km) ]          │
│  • Timestamp Bucket (1-Hr):     [ Epoch Hour #476839 ]               │
│  • Poseidon Nullifier Hash:     [ 0x0f1e2d3c...d2e1f0 (Unspent ✓) ]  │
│  • Client Proving Time:         3.82 seconds (WebAssembly Worker)    │
│                                                                      │
│  [ Submit Gasless Anonymous Report via ERC-4337 Paymaster ]          │
└──────────────────────────────────────────────────────────────────────┘
```
*Screenshot Asset Path:* `docs/screenshots/04-zk-bystander-groth16-prover.png`

---

## 3. End-to-End Multi-Tier Architecture

| Tier | Technology Stack | Core Components & Responsibilities |
| :--- | :--- | :--- |
| **1. Edge Client Layer** | React Native (TS, JSI, SQLCipher, TFLite) & Next.js 14 PWA | 4-tap power & `2.5g`/`3.8g` IMU shake triggers, quantized TFLite distress audio classifier, 5-sec `AES-256-GCM` chunker, WebAssembly SnarkJS prover, `offline_queue` sync engine. |
| **2. Decentralized Storage** | IPFS / Filecoin via Pinata mTLS Gateway | Content-addressed persistence (`CIDv1`) across `>= 3` geographic nodes holding encrypted media chunks and signed `BSA63CertificatePack` PDF/A-3 + JSON-LD bundles. |
| **3. Immutable Ledger Layer** | Polygon PoS / Amoy L2 (Solidity `0.8.24`, ERC-4337) | `EvidenceRegistry.sol`, `ZKReportVerifier.sol`, `ComplaintEscrow.sol`, `SOSLog.sol`, `GuardianRegistry.sol`, `AccessGrant.sol`, and `SheRakshaPaymaster.sol`. |
| **4. Spatial & Relayer Core** | Node.js (Fastify), PostgreSQL 16 + PostGIS 3.4, Redis | Duplex `WSS` SOS hub (`< 500ms`), Uber H3 Res-9 + PostGIS `ST_DWithin` 800m Guardian matcher, Twilio `Base91` SMS & ERSS-112 relays, 22-language BNS classifier, 72-hr BNSS §173 timer worker. |

---

## 4. Indian Statutory & Regulatory Compliance Matrix

| Statute / Provision | Legal Mandate | She-Raksha Cryptographic & Architectural Implementation |
| :--- | :--- | :--- |
| **BNSS §173(1) (Zero-FIR / e-FIR)** | Mandates recording of cognizable offenses regardless of jurisdiction; e-complaints signed within 3 days. | Multilingual (22 Eighth Schedule languages) narrative synthesis auto-drafts structured e-FIRs and initializes a **72-hour (`259,200s`) countdown** in `ComplaintEscrow.sol`. |
| **BNSS §173(4) (SP Escalation)** | Complainant may escalate to the Superintendent of Police (SP) upon refusal or inaction by SHO. | On-chain timelock + BullMQ worker automatically dispatches the anchored evidence dossier to the District SP upon 72-hour timer expiration (plus optional 48-hr NGO early alert). |
| **BNS §74, §75, §78, §85, §351(2)** | Substantive penal definitions for assault, harassment, stalking, domestic cruelty, and intimidation. | Deterministic NLP classification maps extracted incident chronologies and acoustic/telemetry markers directly to applicable Bharatiya Nyaya Sanhita sections. |
| **BSA §63 (Electronic Evidence)** | Requires contemporaneous custody and device integrity certification for court admissibility. | Automatically generates a signed **PDF/A-3 + JSON-LD `BSA63CertificatePack`** combining StrongBox/Secure Enclave hardware attestation, SHA-256 Merkle roots, IPFS `CIDv1`, and Polygon block receipts. |
| **DPDP Act 2023 (Data Privacy)** | Enforces data minimization, purpose limitation, and the right to erasure. | **Zero PII on-chain or in cleartext DB tables** (`contact_phone_hash` via salted SHA-256 + `X25519` envelope encryption). Deleting user enclave keys renders IPFS ciphertext permanently undecryptable. |

---

## 5. Monorepo Structure (9 Packages)

```text
she-raksha/
├── CLAUDE.md                                   # AI Engineering & Architecture Rulebook
├── PHASES_COMPLETED.md                         # Live Automated Milestone & NFR Ledger
├── turbo.json                                  # Turborepo Pipeline Config
├── packages/
│   ├── design-tokens/                          # 10 Brand Tokens (Tailwind + React Native)
│   ├── schemas/                                # 6 DFD JSON Schemas + PostGIS/SQLCipher DDL
│   ├── crypto-core/                            # AES-256-GCM, HKDF, Merkle Tree, Base91 Codec
│   ├── contracts/                              # 6 Polygon L2 Solidity 0.8.24 Contracts + Paymaster
│   ├── circuits/                               # Circom 2.1 AnonymousBystanderReportVerifier_v2
│   ├── sdk/                                    # ERC-4337 Bundler, Web3Auth MPC, Pinata Client
│   ├── backend/                                # Fastify WSS Hub, PostGIS Matcher, BNS/BSA Engine
│   ├── mobile/                                 # React Native App (Triggers, TFLite, BLE 5.2 Mesh)
│   └── web/                                    # Next.js 14 Survivor PWA + Police/NGO Dashboards
└── docs/
    ├── screenshots/                            # High-Res Product Glimpses for Evaluation
    └── NFR_AUDIT_REPORT.md                     # Automated Quality Gate Benchmark Results
```

---

## 6. Quickstart & MCP / Credential Setup

### Step 1: Connect Recommended MCP Servers (For Antigravity / Claude Code)
Enable the following MCP servers in your agent configuration for automated provisioning:
- **Supabase / PostgreSQL MCP:** Automated 3NF + PostGIS 3.4 spatial migrations and GiST index verification.
- **Vercel MCP:** Automated Next.js 14 PWA deployment with WebAssembly `COOP`/`COEP` headers.
- **GitHub MCP:** Automated branch, PR, and phase-tag management.

### Step 2: Install, Build & Verify

```bash
# 1. Install all 9 workspace packages
pnpm install

# 2. Copy environment templates and populate Polygon Amoy, Web3Auth, Pinata & Twilio keys
cp packages/contracts/.env.example packages/contracts/.env
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env

# 3. Compile Circom 2.1 circuits & Solidity 0.8.24 contracts
pnpm --filter @she-raksha/circuits build:circuit
pnpm --filter @she-raksha/contracts compile

# 4. Run PostgreSQL 16 + PostGIS 3.4 migrations
pnpm --filter @she-raksha/schemas db:migrate

# 5. Execute full test suite & verify 100% smart contract coverage
pnpm turbo run test
pnpm --filter @she-raksha/contracts coverage
```

---

## 7. 3-Minute Hackathon Judge Evaluation Protocol

Judges can verify all four primary Key Performance Indicators (KPIs) in under 3 minutes:

| Evaluation Step | Command / Action | Target SLA | Verification Proof |
| :--- | :--- | :--- | :--- |
| **1. Sub-500ms SOS & 5.0s SMS Failover** | Trigger 4-tap SOS on Mobile/PWA, then toggle Airplane Mode / drop WSS socket. | **`<= 500ms`** WSS; **`<= 5.0s`** SMS drop | Inspect `sos_dispatch_logs` and decoded 160-char `Base91` payload on `ERSS-112` webhook. |
| **2. Chunked AES-256-GCM & BSA §63 Pack** | Record a 15-second distress clip in the Evidence Vault and click **Verify BSA §63**. | **`<= 2.0s`** per 50MB; **`0` plaintext** | Inspect Polygon Amoy tx hash in `EvidenceRegistry.sol`, Pinata `CIDv1`, and signed PDF/A-3 certificate. |
| **3. Anonymous Bystander ZK Proof** | Submit an eyewitness report in the PWA, then click **Replay Same Incident**. | **`<= 8.0s`** proving; **Sybil blocked** | First proof emits `AnonymousReportLogged`; second proof reverts with `DuplicateNullifier()`. |
| **4. Automated BNSS §173 e-FIR & Escalation** | Speak a Hindi/English incident narrative and fast-forward `ComplaintEscrow` timer by 72h. | **100% BNS match & SP alert** | Verify BNS §74/§78 classification and emitted `EscrowEscalated` event to District SP dashboard. |
