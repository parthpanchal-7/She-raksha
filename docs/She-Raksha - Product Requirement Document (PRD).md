She-Raksha: Decentralized Legal Defense & Emergency Infrastructure

Decentralized Evidence Vault, Fault-Tolerant Distress Network, and Zero-Knowledge Justice Pipeline

# 1. Document Overview & Metadata

| Attribute              | Specification                                                                                                              |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Product Name           | She-Raksha (शी-रक्षा)                                                                                                      |
| ---                    | ---                                                                                                                        |
| Target Hackathon       | Shakti Hackathon (Durga Puja Special)                                                                                      |
| ---                    | ---                                                                                                                        |
| Product Stage          | Round 1 – Idea Submission & Prototype Design                                                                               |
| ---                    | ---                                                                                                                        |
| Document Version       | 1.0.0                                                                                                                      |
| ---                    | ---                                                                                                                        |
| Core Value Proposition | Tamper-proof evidence recording, offline-resilient multi-rail SOS signaling, and zero-knowledge anonymous abuse reporting. |
| ---                    | ---                                                                                                                        |
| Tagline                | _"Capture once, prove forever, share only what you choose."_                                                               |
| ---                    | ---                                                                                                                        |

# 2. Executive Summary & Strategic Problem Framing

## Mission Statement

She-Raksha transforms ordinary consumer smartphones into court-admissible legal recorders and fail-safe personal defense devices. By fusing client-side AES-256 encryption, zero-knowledge proofs (zk-SNARKs), decentralized content-addressed storage (IPFS/Filecoin), and automated legal workflows under the Bharatiya Nagarik Suraksha Sanhita (BNSS) and Bharatiya Sakshya Adhiniyam (BSA), the platform removes single points of human and technical failure across emergency defense and criminal justice onboarding.

## The 4 Ground-Level Operational Gaps

- **Complaint Refusal & Administrative Inertia:** Section 173 of the BNSS mandates e-FIR registration and Zero FIR protocols across jurisdictions. In practice, victims encounter procedural delays, jurisdictional pushback, and informal refusals when lodging complaints without immediate evidentiary backing.
- **Evidentiary Chain-of-Custody Failure:** Digital evidence collected via consumer apps (WhatsApp screenshots, voice notes, casual video captures) is routinely rejected or contested under Section 63 of the BSA due to broken metadata chains, lack of contemporaneous cryptographic hashing, and vulnerability to spoofing allegations.
- **Distress Infrastructure Vulnerability:** Contemporary SOS applications rely strictly on active cellular data coverage and centralized web servers. Device throttling, packet drops in basements/remote transit corridors, or server downtime render traditional emergency signals inoperable.
- **Retaliation & Bystander Paralysis:** Eyewitnesses avoid reporting harassment or domestic violence due to exposure risks, harassment from police summons, and systemic lack of identity-shielded reporting mechanisms.

## Quantitative Baseline (National Crime Records Bureau Context)

- **4,48,211** registered crimes against women annually in India.
- **~1,228** reported incidents per day (one crime registered every ~70 seconds).
- **90.8%** pendency rate of trials for crimes against women in district courts, heavily driven by protracted evidentiary disputes, contested authenticity of mobile recordings, and witness tampering.

# 3. Target User Personas & User Journeys

| Persona Profile                                        | Primary Need State                                                                         | Critical Path Journey                                                                                                                                       | Core Capabilities Exercised                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Persona 1: The Commuter / Lone Traveler**            | Stealth distress triggering, dead-zone connectivity, automated travel check-in.            | Experiences route deviation; triggers 4-tap power SOS; app initiates parallel mesh/SMS/push broadcast; starts safe-journey countdown.                       | Hardware trigger, BLE broadcast, Fallback SMS, SQLite sync queue.                  |
| ---                                                    | ---                                                                                        | ---                                                                                                                                                         | ---                                                                                |
| **Persona 2: Domestic / Institutional Abuse Survivor** | Traceless capture, unforgeable legal documentation, automated police escalation.           | Logs incident via Next.js PWA disguised as utility web app; records audio/photos; triggers automated BNSS §173 e-FIR dossier with 72-hr timer.              | Client-side AES-256-GCM, IPFS pinning, BSA §63 certificate, e-FIR generator.       |
| ---                                                    | ---                                                                                        | ---                                                                                                                                                         | ---                                                                                |
| **Persona 3: The Civic Bystander**                     | Complete anonymity, legal immunity, retaliation prevention.                                | Observes public assault; snaps photo via client-side Circom circuit; generates Groth16 proof of presence without revealing identity; submits to NGO/Police. | SnarkJS, Groth16 zk-SNARKs, Sybil-resistant nullifiers, ZKReportVerifier contract. |
| ---                                                    | ---                                                                                        | ---                                                                                                                                                         | ---                                                                                |
| **Persona 4: Community Guardian**                      | Low-latency local alerts, actionable proximity vector, victim privacy preservation.        | Receives push notification of distress within 800m with approximate obfuscated vector; verifies location; dispatches on-ground presence.                    | Geohash grouping, GuardianRegistry contract, Push/WebSocket relayer.               |
| ---                                                    | ---                                                                                        | ---                                                                                                                                                         | ---                                                                                |
| **Persona 5: Law Enforcement & NGO Caseworker**        | Authenticated chain of custody, statutory timeline compliance, structured evidence review. | Accesses web dashboard; inspects BSA §63 certificate with Polygon block confirmation; reviews unalterable timeline before filing formal charge sheet.       | AccessGrant contract, IPFS content-hash verification, BNSS §173 countdown tracker. |
| ---                                                    | ---                                                                                        | ---                                                                                                                                                         | ---                                                                                |

# 4. Product Goals, Objectives & Success Metrics

## Primary Key Performance Indicators (KPIs)

- **Emergency Signal Dispatch Latency:** <500 milliseconds via WebSocket/Push under active 4G/5G connections.
- **Offline Failover Latency:** Automatic fallback to encrypted binary SMS within <5 seconds upon payload network receipt timeout.
- **Cryptographic Tamper-Proof Security:** 256-bit media digest integrity anchored on-chain with standard 2^128 pre-image security.
- **Zero-Knowledge Mobile Generation Time:** Sub-8 seconds proof generation latency for standard Groth16 circuits executing on mid-tier consumer devices (e.g., Snapdragon 700-series or equivalent).

## Secondary & Scalability Benchmarks

- **Initial Pilot Capture:** Support a 1% addressable adoption volume (~4,482 verifiable incidents annually) across pilot university campuses and transit routes.
- **Transaction Cost Optimization:** Implement Merkle batching on Polygon L2 to reduce on-chain gas expenditure to 1 transaction per 1,000 anchored evidence records.

# 5. Scope & Feature Specifications

## Feature 1: Evidence Vault & Automated e-FIR Pipeline

- **Cryptographic Capture:** On-device capture engine instantly encrypts raw video, audio, image, and EXIF/sensor telemetry using AES-256-GCM. Decryption keys reside exclusively with the user's ephemeral session or authorized legal escrow.
- **Decentralized Pinning:** Media payloads are pinned across IPFS and Filecoin nodes via automated Pinata integration, producing an immutable Content Identifier (CID).
- **On-Chain Notarization:** SHA-256 hashes of the encrypted payload and metadata are anchored into the EvidenceRegistry.sol contract deployed on Polygon L2, establishing immutable proof-of-existence.
- **AI Statutory Mapping:** Client-side local or secure-relayed LLM parses the user's raw voice note or text narrative, auto-extracting incident chronologies and mapping facts to relevant sections of the Bharatiya Nyaya Sanhita (BNS) (e.g., Section 74: Assault on woman with intent to outrage modesty; Section 78: Stalking).
- **BNSS §173 Countdown & Escalation:** Generates a structured e-FIR document. A 72-hour countdown tracker monitors police processing; upon expiration without acknowledgement, the system triggers the Section 173(4) statutory escalation protocol directly to the Superintendent of Police (SP).
- **BSA §63 Digital Certificate:** Automatically compiles system logs, device identifiers, GPS calibration records, hashing timestamps, and blockchain transaction receipts into an automated Section 63 certificate validating device integrity and data immutability.

## Feature 2: Resilient Offline-First Multi-Rail SOS & Guardian Network

- **Stealth Trigger Vectors:**
  - Physical hardware: 4 rapid taps of the hardware power button.
  - Inertial sensor: Accelerometer threshold trigger measuring sustained shake forces >= 2.5g.
  - Edge Audio Trigger: Always-on, quantized, offline-capable TensorFlow Lite model recognizing specific acoustic distress keywords.
- **Parallel Multi-Rail Relay Architecture:**
  - **Rail A (Primary Web Data):** Direct WebSocket connection and Firebase Cloud Messaging / Apple Push Notification Service alert dispatch to backend infrastructure.
  - **Rail B (Cellular SMS Fallback):** Encrypted, base64-encoded SMS packets containing compressed coordinates routed via Twilio SMS relays to trusted emergency contacts and ERSS-112 gateways.
  - **Rail C (Mesh Proximity):** Bluetooth Low Energy (BLE) peripheral advertising packets broadcasting ephemeral distress tokens to nearby running instances within 50–100 meters.
- **Guardian Geofencing:** Dispatches alerts to opt-in community responders located within ~800 meters of the trigger event, applying location obfuscation (truncation to ~100m radius) to preserve caller privacy until confirmation.
- **Safe-Journey Dead-Man Escrow:** Users set transit routes and check-in intervals. If check-ins lapse without PIN/biometric confirmation, the system triggers stage-1 guardian escalation and stage-2 full SOS dispatch.
- **Offline Synchronization Queue:** When disconnected, incident state and sensor logs serialize into an encrypted on-device SQLite database, automatically draining and notarizing to SOSLog.sol once network connectivity recovers.

## Feature 3: Zero-Knowledge (ZK) Anonymous Bystander Reporting

- **Circom Circuit Architecture:** Client-side zk-SNARK circuits compiled via SnarkJS compile proof of valid event reporting without revealing user wallet address, phone number, or raw identity credentials.
- **Identity & Jurisdiction Constraints:** The circuit verifies that the user holds a valid civic credential and was physically present within the target municipal police jurisdiction at the stated timestamp, without exposing their exact coordinate history.
- **Sybil-Resistant Nullifiers:** Computes a unique nullifier hash:  
  \$\$\\text{Nullifier} = \\text{Poseidon}(\\text{IdentitySecret}, \\text{IncidentID})\$\$  
  This prevents malicious users from flooding multiple anonymous claims for the same event while guaranteeing un-linkability across distinct incidents.
- **Verification & Dispatch:** The ZKReportVerifier.sol contract validates the Groth16 proof on-chain, and an off-chain relay pipes the authenticated narrative into NGO casework and legal aid dashboards.

## Feature 4: Keyless Identity & Account Abstraction Layer

- **ERC-4337 Smart Contract Accounts:** Every user operates an abstracted smart contract wallet on Polygon, eliminating seed phrase management.
- **Passkey & Biometric Sign-in:** Onboarding integrated via Web3Auth, enabling users to authenticate and sign transactions using native device biometric keys (Face ID, Fingerprint, WebAuthn).
- **Gasless Execution:** Integrated ERC-4337 Paymasters sponsor on-chain transaction fees, ensuring zero MATIC/ETH token requirements for distress logging, evidence anchoring, or ZK-proof submissions.

# 6. Technical & Architecture Specifications

## Technical Stack

| Architectural Tier      | Selected Technologies                     | Functional Purpose                                                                         |
| ----------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------ |
| **Mobile Client**       | React Native (TypeScript), JSI, SQLite    | Native iOS/Android builds, offline background sensor telemetry, local SQLite queues.       |
| ---                     | ---                                       | ---                                                                                        |
| **Web Client (PWA)**    | Next.js 14, Tailwind CSS, Service Workers | Zero-footprint web interface for discreet incident reporting and caseworker operations.    |
| ---                     | ---                                       | ---                                                                                        |
| **ZK Proving Engine**   | Circom 2.1, SnarkJS, Groth16 Prover       | Browser and mobile-based zero-knowledge proof generation and R1CS constraint compilation.  |
| ---                     | ---                                       | ---                                                                                        |
| **Smart Contracts**     | Solidity 0.8.24, Hardhat, OpenZeppelin    | On-chain registry, ZK proof verification, access delegation, and transaction notarization. |
| ---                     | ---                                       | ---                                                                                        |
| **Execution Layer**     | Polygon PoS (L2)                          | High-throughput, sub-second finality, cost-minimized blockchain anchoring.                 |
| ---                     | ---                                       | ---                                                                                        |
| **Storage & Gateway**   | IPFS, Filecoin, Pinata API                | Distributed, content-addressed storage for encrypted evidentiary archives.                 |
| ---                     | ---                                       | ---                                                                                        |
| **Backend & Ingestion** | Node.js (Fastify), PostgreSQL, PostGIS    | Geospatial query handling, WebSocket connections, emergency gateway relays.                |
| ---                     | ---                                       | ---                                                                                        |
| **External APIs**       | Twilio SMS API, Mock 112 ERSS Relayer     | Redundant telecom dispatch and simulated municipal emergency response system pipelines.    |
| ---                     | ---                                       | ---                                                                                        |

## Core Smart Contract Architecture

 +-------------------------+

```
                                |      User / Device      |
                                +------------+------------+
                                             |
                      +----------------------+----------------------+
                      | (Direct / Account Abstraction ERC-4337)     |
                      v                                             v
        +----------------------------+                +----------------------------+
        |    EvidenceRegistry.sol    |                |   ZKReportVerifier.sol     |
        | - anchorEvidence()         |                | - verifyProof()            |
        | - verifyDigest()           |                | - verifyNullifier()        |
        +--------------+-------------+                +--------------+-------------+
                       |                                             |
                       +----------------------+----------------------+
                                              v
                               +-----------------------------+
                               |     ComplaintEscrow.sol     |
                               | - initEscrow()              |
                               | - trigger72HrEscalation()   |
                               +--------------+--------------+
                                              |
                       +----------------------+----------------------+
                       v                                             v
        +----------------------------+                +----------------------------+
        |        SOSLog.sol          |                |     AccessGrant.sol        |
        | - logDisconnectionQueue()  |                | - grantLawEnforcement()    |
        | - notarizeDistress()       |                | - revokeAccess()           |
        +----------------------------+                +----------------------------+
```



- **EvidenceRegistry.sol**: Maintains mappings of cryptographic hashes, content identifiers (CIDs), device signatures, and Unix timestamps.
- **ZKReportVerifier.sol**: Executes pairing checks to validate Groth16 SNARK proofs and enforces Sybil nullifier non-reentrancy.
- **ComplaintEscrow.sol**: Tracks BNSS statutory deadlines (72 hours), managing access transitions and triggering escalation events.
- **SOSLog.sol**: Records tamper-proof breadcrumbs of emergency incidents, verifying state transitions across offline-queued events.
- **GuardianRegistry.sol**: Manages opt-in guardian geographic hashes, cryptographic public keys, and validation stakes.
- **AccessGrant.sol**: Implements temporal, revocable cryptographic access permissions granting caseworkers and legal teams decrypt rights to specific vault archives.

# 7. Release Roadmap & Milestones

\[Phase 1: Shakti Hackathon MVP\] ----> \[Phase 2: Pilot Deployment\] ----> \[Phase 3: Public Rollout\]

```
* Solidity Contracts (Hardhat)       * Direct ERSS-112 Integration    * Nationwide NGO Network Scaling
* Offline Multi-Rail Engine          * Campus & Transit Pilot Trials  * L2 Rollup State Compression
* Circom ZK Prototype Circuits       * Aadhaar e-Sign API Validation  * Peer-to-Peer BLE Mesh Expansion
```

## Phase 1: MVP & Shakti Hackathon Round 1 (Weeks 1 – 4)

- Implement core smart contracts (EvidenceRegistry, ZKReportVerifier, SOSLog) on Polygon Amoy Testnet.
- Build React Native prototype featuring the 4-tap power trigger and accelerometer threshold listener.
- Establish AES-256-GCM encryption pipeline with automated IPFS Pinata anchoring.
- Construct basic Circom circuits verifying municipal geofence membership and single-nullifier evaluation.

## Phase 2: Pilot Deployment & Integration (Months 2 – 4)

- Pilot rollouts across select university campuses and public transit zones with local student cohorts.
- Connect emergency payloads to simulated Mock 112 ERSS command center protocols.
- Validate integration with India Stack Aadhaar e-Sign infrastructure for legally binding complaint verification.
- Deploy production-grade NGO Caseworker portal with granular cryptographic key delegation.

## Phase 3: Public Rollout & Guardian Network Scaling (Months 5 – 8)

- Launch scaled Guardian Network with localized volunteer incentive layers and verifiable credential attestations.
- Deploy production circuit optimizations reducing mobile zero-knowledge proving overhead to under 4 seconds.
- Upgrade decentralized storage pipelines to autonomous decentralized pinning via Filecoin smart contracts.

# 8. Risks, Privacy & Mitigation Strategies

| Risk / Attack Surface                          | Severity | Technical & Operational Mitigation Strategy                                                                                                                                                                        |
| ---------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Device Offline in Deep Cellular Blind Spot** | Critical | SQLite local queue buffers distress records. Dual-channel failover routes compressed 140-byte binary payload through SMS band and background BLE mesh beacons to nearby reachable devices.                         |
| ---                                            | ---      | ---                                                                                                                                                                                                                |
| **ERC-4337 Paymaster Depletion**               | High     | Multi-funder architecture backed by civil society organizations, CSR grants, and automated smart-contract refilling alerts with secondary fallback to low-cost user gas fee mode.                                  |
| ---                                            | ---      | ---                                                                                                                                                                                                                |
| **Legal Contestability of Digital Evidence**   | High     | System outputs end-to-end Section 63 BSA compliance packs containing device cryptographic receipts, hardware entropy stamps, and immutable polygon transaction inclusion proofs.                                   |
| ---                                            | ---      | ---                                                                                                                                                                                                                |
| **DPDP Act (Data Protection) Compliance**      | Critical | Sovereign cryptographic key erasure: users retain master AES decryption keys. Deleting local and escrow keys renders pinned decentralized ciphertext mathematically irrecoverable, upholding the right to erasure. |
| ---                                            | ---      | ---                                                                                                                                                                                                                |
| **Malicious / False SOS Submissions**          | Medium   | Zero-knowledge Sybil nullifiers block automated multi-reporting. High-frequency physical alerts require continuous sensory thresholding to prevent accidental activation.                                          |
| ---                                            | ---      | ---                                                                                                                                                                                                                |