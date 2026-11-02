# She-Raksha (शी-रक्षा) — Multi-Tier Deployment Architecture Blueprint

> **System Classification:** Mission-Critical Women's Safety, Decentralized Multi-Rail SOS Dispatch, Zero-Knowledge Bystander Reporting & Automated Statutory Legal Pipeline (**BNS / BNSS §173 / BSA §63 / DPDP Act 2023**).  
> **Target Version:** Production Release 1.0 (Hackathon & National Rollout).  
> **Authoritative Specification:** Single Source of Truth for DevOps, Cloud Infrastructure, and Deployment Automation across all 9 `@she-raksha/*` packages.

---

## 1. Executive Summary & Production Topology

She-Raksha employs a hybrid decentralized cloud topology designed for **zero single-point-of-failure (SPOF)**, **sub-second emergency dispatch**, **offline-first fault tolerance**, and **uncompromising zero-PII cryptographic privacy**. 

The architecture decouples ephemeral, edge-computed client operations from stateful institutional legal workflows through five distinct operational tiers:

```mermaid
flowchart TD
    subgraph ClientEdge["Client Edge Tier"]
        Mobile["React Native + Expo EAS<br/>(4-Tap, IMU 50Hz, TFLite, BLE 5.2 Mesh)"]
        WebPWA["Next.js 14 Edge PWA<br/>(Vercel Pro + COOP/COEP WASM Prover)"]
    end

    subgraph RailDispatch["3-Rail Distress Dispatch Layer"]
        RailA["Rail A: Duplex TLS 1.3 WSS<br/>(Node.js Fastify Hub, RTT &lt; 150ms)"]
        RailB["Rail B: Twilio SMPP Base91 SMS<br/>(&lt;140B GSM-7 + ERSS-112 CAD)"]
        RailC["Rail C: BLE 5.2 Mesh Relay<br/>(Zero-Bearer 0xFD63 Frames)"]
    end

    subgraph BackendTier["Institutional Core & Spatial Backend"]
        Fastify["Fastify Stateful Cluster<br/>(AWS ECS Fargate / Railway Dedicated)"]
        Redis["Redis 7 Alpine<br/>(BullMQ 72h BNSS §173 &amp; 48h NGO Workers)"]
        PostGIS["Supabase Dedicated / AWS RDS<br/>(PostgreSQL 16 + PostGIS 3.4 3NF)"]
    end

    subgraph DecentralizedTier["Polygon L2 & Decentralized Storage"]
        Polygon["Polygon L2 (Amoy / PoS Mainnet)<br/>(EvidenceRegistry, ComplaintEscrow, SOSLog, ZKReportVerifier)"]
        Paymaster["ERC-4337 EntryPoint v0.7<br/>(SheRakshaPaymaster 100% Gas Sponsorship)"]
        Pinata["Pinata IPFS &amp; Filecoin Cluster<br/>(AES-256-GCM Ciphertext Chunks &gt;= 3 Geo Nodes)"]
    end

    subgraph InstitutionalGateway["Statutory Gateway Tier"]
        ERSS["National ERSS-112 CAD<br/>(AWS Nitro Enclave mTLS Channel)"]
        PolicePortal["Police SHO &amp; District SP Portal<br/>(PostGIS/H3 Radar &amp; BSA §63 Verifier)"]
        NGOPortal["Accredited NGO Portal<br/>(48h Early-Warning Access Grants)"]
    end

    Mobile -->|Primary Rail A| RailA
    Mobile -->|5.0s Timeout Rail B| RailB
    Mobile -->|Zero Bearer Rail C| RailC
    WebPWA -->|WSS SOS / ZK Report| RailA

    RailA --> Fastify
    RailB --> Fastify
    Fastify --> Redis
    Fastify --> PostGIS
    Fastify --> Pinata
    Fastify --> ERSS

    Mobile -->|Gasless UserOp| Paymaster
    WebPWA -->|Gasless UserOp| Paymaster
    Paymaster --> Polygon
    Fastify --> Polygon

    Fastify --> PolicePortal
    Fastify --> NGOPortal
```

---

## 2. Multi-Tier Cloud & Web3 Infrastructure Mapping Matrix

| Architectural Layer | Monorepo Package | Target Production Infrastructure | Configuration Specifications & SLA Targets |
| :--- | :--- | :--- | :--- |
| **Web Client & Edge PWA** | `packages/web` | **Vercel Pro (Global Edge Network)** | Serverless Next.js 14 App Router deployment. Configured with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` HTTP headers to unlock `SharedArrayBuffer` for multi-threaded WebAssembly (`snarkjs` Groth16 prover) at native speeds. Immutable asset caching (`max-age=31536000`) for `.zkey` and `.wasm` circuit binaries under `/circuits/*`. |
| **Mobile Client & OTA** | `packages/mobile` | **Expo Application Services (EAS Build & Update)** | Compiles custom native Android (`.apk`/`.aab`) and iOS (`.ipa`) binaries bundling SQLCipher, BLE 5.2 peripheral advertising, and the quantized `distress_classifier_quant.tflite` model. Provides signed over-the-air updates via `eas update` on channels `preview` and `production`. |
| **Real-Time API & WSS Hub** | `packages/backend` | **AWS ECS Fargate (or Dedicated Railway / Fly.io VM)** | **Strict Non-Serverless Architecture:** Fastify v5 cluster on dedicated containers to maintain persistent, duplex TLS 1.3 WebSocket connections (`< 500ms` dispatch latency `NFR-PERF-002`) and stateful timer workers. Exposes port 8080 with healthcheck probes on `/health`. |
| **Distributed Cache & Timers** | `packages/backend` | **Redis 7 Alpine (Upstash Redis / Dedicated AWS ElastiCache)** | Backs BullMQ job queues for the **72-hour BNSS §173 statutory escrow timer** and **48-hour NGO early-warning notifications**. Provides distributed locks (`Redlock`) preventing duplicate dispatch or re-escalation races. |
| **Spatial & Relational DB** | `packages/schemas` | **Supabase Dedicated / AWS RDS PostgreSQL 16** | Fully compliant 3NF relational schema with `PostGIS 3.4` spatial extension. Spatial indexing via `USING GIST (geom)` on `GEOGRAPHY(Point, 4326)` for sub-millisecond 800-meter guardian proximity queries (`ST_DWithin`). Enforces foreign key constraints (`RESTRICT` on incidents/e-FIRs; `CASCADE` on contacts/logs). |
| **L2 Blockchain & RPC** | `packages/contracts` | **Polygon PoS Mainnet / Amoy Testnet via Alchemy Supernode** | 6 core smart contracts (`EvidenceRegistry`, `ComplaintEscrow`, `SOSLog`, `ZKReportVerifier`, `GuardianRegistry`, `AccessGrant`) compiled with Solidity `0.8.24` Cancun EVM. Sub-second block times, low calldata fees, and dedicated Alchemy `WSS` event subscriptions for `AnonymousReportLogged` and `EscrowEscalated`. |
| **Account Abstraction & MPC** | `packages/sdk` | **Web3Auth MPC Core Kit + Biconomy / ZeroDev Verifying Paymaster** | Keyless biometric authentication via WebAuthn passkeys (`secp256r1`) mapped to ERC-4337 smart contract accounts on canonical `EntryPoint v0.7` (`0x0000000071727De22E5E9d8BAf0edAc6f37da032`). She-Raksha Paymaster sponsors 100% of gas fees for whitelisted methods with monotonic nonce enforcement (`NFR-SEC-003`). |
| **Decentralized Evidence Vault** | `packages/crypto-core`, `packages/sdk` | **Pinata Dedicated IPFS Gateway + Filecoin Persistent Pinning** | Content-addressed `CIDv1` storage with geographical multi-region replication across $\ge 3$ nodes (`NFR-REL-003`). Transmits and stores only in-memory encrypted `AES-256-GCM` ciphertext chunks; master decryption keys are held exclusively in device secure enclaves or time-bound escrow. |
| **Telecom & Emergency Bridge** | `packages/backend` | **Twilio SMPP + AWS Nitro Enclave (Mock ERSS-112 CAD mTLS)** | Ingests and dispatches `< 140-byte` Base91-encoded GSM-7 SMS emergency packets over native carrier networks upon Rail A timeout (5.0s). AWS Nitro Enclave terminates mutual TLS (mTLS) with state ERSS-112 CAD servers and signs hardware-attested `BSA63CertificatePack` records. |

---

## 3. Step-by-Step Deployment Timeline Sequence

```mermaid
sequenceDiagram
    autonumber
    participant DevOps as DevOps / CI Engine
    participant Circuits as Circuits (Circom 2.1)
    participant Contracts as Polygon L2 (Hardhat)
    participant DB as Supabase PostGIS 16
    participant Backend as Fastify & Redis (ECS)
    participant Web as Next.js 14 (Vercel)
    participant Mobile as Mobile App (Expo EAS)

    DevOps->>Circuits: 1. Compile Circom & Export Groth16Verifier.sol
    DevOps->>Contracts: 2. Deploy 6 Contracts + Paymaster on Polygon Amoy
    DevOps->>DB: 3. Run PostGIS 3.4 Migrations & Verify GiST Indexes
    DevOps->>Backend: 4. Deploy Fastify Container + BullMQ 72h Worker
    DevOps->>Web: 5. Deploy Next.js 14 to Vercel (COOP/COEP Headers)
    DevOps->>Mobile: 6. Trigger EAS Build for Custom Android .APK / iOS .IPA
```

### Step 1: Zero-Knowledge Circuit Compilation & Trusted Setup (`packages/circuits`)
1. Compile `AnonymousBystanderReportVerifier_v2.circom` with Circom 2.1 to generate R1CS constraints (5,607 constraints) and WebAssembly witness generator.
2. Complete Phase 2 Powers of Tau ceremony (`pot14_final.ptau`) and phase-2 `.zkey` proving key generation.
3. Export `verification_key.json` and generate `Groth16Verifier.sol`.
4. Publish `AnonymousBystanderReportVerifier_v2.wasm` and `_final.zkey` to public immutable IPFS/CDN storage with long-lived caching.

### Step 2: Polygon L2 Contract Deployment & Paymaster Staking (`packages/contracts`)
1. Deploy smart contracts in strict dependency order via Hardhat Ignition (`ignition/modules/SheRakshaSuite.ts`):
   - `Groth16Verifier.sol`
   - `ZKReportVerifier.sol` (linked to `Groth16Verifier`)
   - `EvidenceRegistry.sol`
   - `SOSLog.sol`
   - `GuardianRegistry.sol`
   - `ComplaintEscrow.sol` (initialized with statutory `72 hours = 259,200s`)
   - `AccessGrant.sol`
   - `SheRakshaPaymaster.sol` (whitelisting contracts 2–7)
2. Deposit initial `10.0 POL` onto ERC-4337 `EntryPoint v0.7` (`0x0000000071727De22E5E9d8BAf0edAc6f37da032`) via `paymaster.deposit()`.
3. Submit source code verification to Polygonscan API.
4. Export deployed contract addresses and ABIs to `packages/sdk/src/deployments/amoy.json`.

### Step 3: Spatial Database Provisioning & Migrations (`packages/schemas`)
1. Provision Supabase / PostgreSQL 16 database instance.
2. Enable extensions: `CREATE EXTENSION IF NOT EXISTS postgis;` and `CREATE EXTENSION IF NOT EXISTS pgcrypto;`.
3. Apply canonical migration `001_init_core_schema.sql` creating all 8 relational tables.
4. Verify spatial GiST index health: `SELECT indexrelid::regclass FROM pg_index WHERE indisvalid = true;`.

### Step 4: Backend Fastify SOS Hub & BullMQ Worker Deployment (`packages/backend`)
1. Build production container using `packages/backend/Dockerfile`.
2. Deploy to AWS ECS Fargate or dedicated VM connected to Supabase and Redis.
3. Verify TLS 1.3 WebSocket listener `/ws/sos` responds with `< 500ms` ACK (`NFR-PERF-002`).
4. Activate BullMQ workers monitoring 72-hour BNSS §173 escalations and 48-hour NGO early-warning notifications.
5. Configure Twilio webhook route (`/api/v1/sos/sms-webhook`) with HMAC-SHA1 signature validation.

### Step 5: Web Discreet PWA Deployment (`packages/web`)
1. Deploy `packages/web` to Vercel Pro via Vercel CLI / MCP.
2. Apply `vercel.json` and `next.config.mjs` security headers (`Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp`).
3. Wire production environment variables (`NEXT_PUBLIC_BACKEND_HTTPS_URL`, `NEXT_PUBLIC_POLYGON_CHAIN_ID`, contract addresses).
4. Verify in-browser WebAssembly SnarkJS proving executes without memory isolation exceptions.

### Step 6: Mobile Client Build & EAS Packaging (`packages/mobile`)
1. Validate embedded asset bundle (`distress_classifier_quant.tflite`, circuit `.zkey`, SQLCipher schema).
2. Configure `app.json` with Android background location, foreground service, and Bluetooth permissions.
3. Execute Expo EAS preview build: `eas build --platform android --profile preview`.
4. Distribute generated installable `.apk` for hackathon jury evaluation and device verification.

---

## 4. Network Security & mTLS ERSS-112 CAD Gateway Architecture

Emergency dispatch to India's **National Emergency Response Support System (ERSS-112)** requires strict mutual TLS authentication and high-availability CAD (Computer-Aided Dispatch) message framing:

```
[She-Raksha Backend] 
       │
       ▼ (mTLS x509 Client Cert + Private Key)
[AWS Nitro Enclave / Secure Egress Proxy]
       │
       ▼ (TLS 1.3 mutual auth / 4096-bit RSA)
[State Police ERSS-112 CAD Integration Ingestion Point]
```

### Key Security Protocols:
1. **Zero-PII Egress:** Outbound CAD packets transmit only validated GPS/NavIC coordinates, anonymized distress category codes, and time-bound BSA §63 digital verification links. Cleartext phone numbers are never forwarded across unencrypted boundaries.
2. **mTLS Certificate Rotation:** ERSS-112 client certificates (`/etc/secrets/erss112-client.crt`) are rotated every 90 days via automated AWS Secrets Manager / HashiCorp Vault hooks.
3. **Double-Sign Hardware Attestation:** Every legal evidence export is signed by both the user's on-device secure hardware enclave (Android StrongBox / iOS Secure Enclave) and the backend AWS Nitro Enclave before anchoring to `EvidenceRegistry.sol`.

---

## 5. Decentralized Storage & Geo-Replication Topologies

To comply with **NFR-REL-003**, all media evidence must remain accessible and tamper-proof across multiple geographic jurisdictions:

```
[Mobile Device RAM]
  ├── Continuous 1080p H.265 / AAC Audio / Telemetry (5s Chunks)
  ├── In-Memory AES-256-GCM Envelope Encryption (HKDF-SHA256)
  └── RAM Zero-Fill Sanitization (buffer.fill(0))
         │
         ▼ (Encrypted Ciphertext Stream)
[Pinata IPFS Gateway Cluster]
  ├── Region 1: Mumbai (ap-south-1)
  ├── Region 2: Frankfurt (eu-central-1)
  └── Region 3: Singapore (ap-southeast-1)
         │
         ▼ (CIDv1 Content Addressing)
[Filecoin Storage Provider Deals]
  └── Permanent Cold-Storage Replicas with Proof of Spacetime (PoSt)
```

1. **Deterministic Chunking:** Rolling 5-second buffers prevent loss of critical evidence if the device is forcibly powered off or destroyed during an attack.
2. **Zero Plaintext Flash Storage:** Plaintext audio and video are never written to disk (`NFR-SEC-002`). Unencrypted buffers are zeroed out in `finally` blocks immediately after encryption.
3. **Content Addressing:** All IPFS pointers use base32 `CIDv1` strings (`bafy...`) stored on Polygon L2 in `EvidenceRegistry.sol`.

---

## 6. Zero-Knowledge Proving Distribution

She-Raksha provides dual-mode zero-knowledge proof generation to ensure seamless bystander reporting regardless of client device capabilities:

```mermaid
flowchart LR
    Witness["Bystander Witness Inputs<br/>(Secret Key, GPS, Timestamp, Salt)"]
    
    subgraph ClientExecution["Client-Side Execution (Preferred)"]
        MobileProver["Mobile: SnarkJS Native JSI<br/>Snapdragon 700+ (~0.58s - 3.2s)"]
        WebProver["Web PWA: SnarkJS WebWorker<br/>WASM SharedArrayBuffer (~1.2s - 4.5s)"]
    end
    
    subgraph ProofVerification["On-Chain Verification"]
        VerifierContract["ZKReportVerifier.sol<br/>Groth16 Pairing Check (~210k Gas)"]
        NullifierCheck["mapping(bytes32 => bool) nullifiers<br/>Sybil Replay Guard"]
    end

    Witness --> MobileProver
    Witness --> WebProver
    MobileProver --> VerifierContract
    WebProver --> VerifierContract
    VerifierContract --> NullifierCheck
```

- **In-Browser Web Worker:** In `@she-raksha/web`, the Groth16 witness compiler executes inside a dedicated Web Worker off the main UI thread. COOP/COEP headers ensure high-performance multi-threaded execution.
- **On-Device Mobile Prover:** In `@she-raksha/mobile`, Circom witness generation runs directly in-process via JSI bindings, completing proofs in under `0.58 seconds` on modern hardware—well within the `< 8.0s` target of **NFR-PERF-003**.

---

## 7. Secrets Management & Environment Isolation Matrix

| Secret / Config Key | Local Dev (`.env.local`) | Staging / Testnet (`Amoy`) | Production (`Mainnet`) | Storage & Injection Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| `DEPLOYER_PRIVATE_KEY` | Hardhat Account #0 | Amoy Testnet Deployer | Multi-Sig / KMS Signer | AWS Secrets Manager / GitHub Actions Secret |
| `DATABASE_URL` | Local Docker PostGIS | Supabase Staging Pooler | Supabase Dedicated Cluster | Platform Environment Variable (Encrypted) |
| `REDIS_URL` | `localhost:6379` | Upstash Redis Dev | AWS ElastiCache Multi-AZ | Platform Environment Variable (Encrypted) |
| `PINATA_JWT` | Sandbox JWT | Staging Pinata JWT | Enterprise Pinata Account | Cloud Secret Injector |
| `TWILIO_AUTH_TOKEN` | Twilio Test Credentials | Twilio Sandbox Account | Twilio Production Carrier | Cloud Secret Injector |
| `ENCLAVE_SIGNING_KEY` | Test secp256k1 Key | Nitro Test Attestation Key | AWS KMS Hardware HSM | Nitro Enclave In-Memory KMS Decrypt |

---

## 8. Automated Monitoring, Health Checks & Disaster Recovery

### Health Probes:
- **`GET /health`:** Validates Fastify process uptime, PostgreSQL connectivity, PostGIS extension readiness, Redis ping status, and Polygon RPC block synchronization.
- **`GET /health/contracts`:** Verifies Paymaster balance on `EntryPoint v0.7` exceeds the low-balance alert threshold (`>= 2.0 POL`). Emits webhook alerts if gas reserves dip below threshold.

### Disaster Recovery Runbooks:
1. **Polygon RPC Failure:** Automatic client-side and backend failover across primary Alchemy, backup Infura, and public Polygon RPC endpoints.
2. **WebSocket Disconnection (Rail A Drop):** The mobile runtime automatically triggers the **5.0-second hardware timer**, dropping seamlessly to **Rail B Base91 GSM-7 SMS** without requiring victim intervention.
3. **Database Network Partition:** Unacknowledged captures and incident logs are preserved locally in encrypted **SQLCipher (`offline_queue`)** and drained in chronological order upon reconnection.

---
*Maintained autonomously by the She-Raksha Antigravity Engineering Agent.*
