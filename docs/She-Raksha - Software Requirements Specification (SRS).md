IEEE 830 Software Requirements Specification: She-Raksha

# 1. Introduction

## 1.1 Purpose

This document provides a comprehensive Software Requirements Specification (SRS) for the She-Raksha platform in accordance with the IEEE 830-1998 standard. She-Raksha is a decentralized, offline-first personal safety, distress response, and legal enablement platform engineered to bridge the trust and execution gaps in emergency management and criminal justice reporting.

## 1.2 Document Conventions

- **SRS Identifiers:** Functional requirements are prefixed with FR-, followed by the subsystem indicator (EV for Evidence Vault, SOS for Distress Rails, ZK for Anonymous Reporting, ID for Identity/Wallet) and a sequential sequence index (e.g., FR-EV-001).
- **Requirement Prioritization:** Requirements are categorized using RFC 2119 keywords: **MUST** (Mandatory), **SHOULD** (Recommended), and **MAY** (Optional).
- **Typography:** Code symbols, data schemas, cryptographic primitives, and smart contract handles appear in monospace formatting.

## 1.3 Intended Audience and Reading Suggestions

- **Core Engineering & Cryptography Teams:** Focus on Section 2.4 (Design Constraints), Section 3 (System Features), and Section 5 (Non-Functional Requirements).
- **Legal Counsel & Regulatory Compliance Officers:** Prioritize Section 1.5 (Legal Context & Statutory References) and Section 3.1 (e-FIR Pipeline).
- **System Architects & Infrastructure Operators:** Focus on Section 2.1 (Product Perspective), Section 4 (External Interfaces), and Section 5.3 (Reliability).

## 1.4 Project Scope

She-Raksha coordinates rapid incident response and secure post-incident evidentiary integrity. The platform encompasses:

- **Tamper-Proof Evidence Vault:** Local hardware-accelerated encryption of multimedia distress captures, IPFS pinning, and cryptographic anchoring to public blockchain state.
- **Resilient Multi-Rail Distress Signaling:** Concurrent dispatch via low-latency WebSockets, localized peer broadcasts, and cellular SMS fallbacks for sub-second, network-agnostic alerts.
- **Zero-Knowledge Anonymous Reporting:** Client-side zero-knowledge proofs (zk-SNARKs) allowing bystanders to report crimes without exposing personal identifiable information (PII).
- **Automated Procedural e-FIR Pipeline:** End-to-end statutory alignment with Indian criminal and evidence codes, incorporating legal timeline timers and digital custody certifications.

## 1.5 Legal Context & Statutory References

The system's functional workflows and data retention mechanisms are explicitly modeled on Indian penal and digital privacy frameworks:

| Statute / Section                 | Scope & Statutory Mandate                                                                                                              | Architectural Implementation in She-Raksha                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **BNSS §173 (e-FIR / Zero FIR)**  | Mandates recording of cognizable offenses irrespective of jurisdiction; electronically lodged complaints must be signed within 3 days. | Automated ingestion to jurisdictional dispatch; real-time 72-hour countdown timer tracking digital signatures.                             |
| ---                               | ---                                                                                                                                    | ---                                                                                                                                        |
| **BNSS §173(4) Escalation**       | If an officer in charge refuses to record an e-FIR, the complainant may escalate to the Superintendent of Police (SP).                 | Smart contract and relayer auto-trigger that compiles audit logs and dispatches escalations directly to the District SP upon timer expiry. |
| ---                               | ---                                                                                                                                    | ---                                                                                                                                        |
| **BSA §63 (Electronic Evidence)** | Specifies strict conditions for admissibility of digital records and chain-of-custody certificates.                                    | Automated cryptographic generation of SHA-256 digests, IPFS CIDs, block timestamps, and automated §63 custody certificates.                |
| ---                               | ---                                                                                                                                    | ---                                                                                                                                        |
| **DPDP Act (Data Protection)**    | Strict mandates on data minimization, user consent, secure processing, and the right to erasure.                                       | On-chain zero-PII storage (digests only); user sovereign key lifecycle allowing permanent right-to-erasure via key revocation.             |
| ---                               | ---                                                                                                                                    | ---                                                                                                                                        |

# 2. Overall Description

## 2.1 Product Perspective

She-Raksha operates as a distributed, edge-capable mobile and web safety layer integrated with public safety backends and decentralized networks:

- **Client Layer:** Cross-platform Mobile Client (React Native) for Android/iOS alongside a Progressive Web App (Next.js 14).
- **Decentralized Infrastructure:** Polygon L2 (for state anchoring and smart wallet accounts) and IPFS/Filecoin (decentralized storage).
- **Bridges & Relayers:** Backend infrastructure bridging decentralized storage and blockchain logs with legacy endpoints, including Police Dispatch (ERSS-112) and accredited NGO casework portals.

+---------------------------------------------------------------+

```
|                      Client Application                       |
|   React Native (Android / iOS)  /  PWA (Next.js 14 App Router)|
+---------------------------------------------------------------+
         | (Encrypted Vault)                 | (Gasless Tx)
         v                                   v
+-----------------------+           +---------------------------+
| IPFS / Filecoin Nodes |           | Polygon L2 Smart Contracts|
|  (Pinata Pinning API) |           | (ERC-4337 / EvidenceVault)|
+-----------------------+           +---------------------------+
         ^                                   ^
         |                    +--------------+
         |                    |
+---------------------------------------------------------------+
|               Backend Relayers & Worker Queues                |
|      (ERSS-112 Bridge, Twilio SMS Fallback, Postgres DB)       |
+---------------------------------------------------------------+
```

## 2.2 User Classes and Characteristics

- **Citizens / Victims:** Primary mobile users requiring minimal UI latency, one-touch distress triggers, localized natural-language e-FIR drafting, and full custody of their data.
- **Bystanders / Anonymous Reporters:** Community participants submitting incident reports while demanding cryptographic guarantees of absolute non-identifiability.
- **Emergency Guardians:** Opt-in trusted contacts or verified proximate guardians receiving geofenced alerts and dynamic tracking tokens.
- **Accredited NGOs:** Verified civil-society organizations monitoring anonymous incident streams within specific administrative sectors.
- **Law Enforcement Personnel:** Station House Officers (SHOs) and District SPs reviewing verified e-FIR dossiers, chain-of-custody certificates, and evidence decrypt keys.
- **System Administrators:** Infrastructure maintainers managing bundlers, relayer balances, and IPFS gateway performance.

## 2.3 Operating Environment

- **Client Hardware (Android):** Tier-1 and budget architectures (e.g., Moto g85, Samsung Galaxy A15, MediaTek Dimensity/Snapdragon series) running Android 10.0+ with hardware cryptography capabilities.
- **Client Hardware (iOS):** Apple devices running iOS 15.0+ leveraging Secure Enclave for biometric authentication.
- **Web Runtime:** Chromium 110+, Safari 16+, Firefox 115+ with WebAssembly (Wasm) support enabled.
- **Distributed Network:** Polygon L2 Mainnet/Amoy testnet; decentralized IPFS gateways.

## 2.4 Design and Implementation Constraints

- **Offline-First Architecture:** Core distress workflows must execute locally without an active Internet connection, queueing payloads and falling back to cellular networks (SMS).
- **Gasless User Experience:** End users must not acquire, hold, or manage POL (Polygon) gas tokens. All blockchain writes must leverage ERC-4337 Account Abstraction paymasters.
- **Absolute Zero-PII on Public Ledgers:** Under no circumstances should plain, pseudonymized, or encrypted identifiable personal data be anchored on-chain. Blockchain state is restricted to keccak256/SHA-256 hashes, nullifiers, and Merkle roots.
- **Compute Bounds:** ZK proof generation must operate within the thermal and memory constraints of mobile processors without terminating background OS processes.

## 2.5 Assumptions and Dependencies

- **Telecommunications:** Access to base station GSM signaling for emergency SMS routing when mobile data (LTE/5G) is unreachable.
- **Smart Contract Availability:** Reliable uptime of Polygon L2 RPC endpoints and continuous paymaster sponsorship liquidity.
- **Decentralized Storage:** Consistent persistence of encrypted blobs via Pinata and Filecoin pinning networks.

# 3. System Features & Functional Requirements

## 3.1 Feature 1: Evidence Vault & Automated e-FIR Pipeline

### Description

Provides local, hardware-accelerated encryption of incident captures, distributed persistence, immutable blockchain registration, natural language charge mapping, and statutory enforcement.

### Functional Requirements

- **FR-EV-001 (On-Device Symmetric Encryption):** The mobile client MUST capture ambient audio, camera video, still photographs, and high-precision GPS logs into local cache, immediately encrypting them using AES-256-GCM. The initialization vector (IV) and authentication tag MUST be generated uniquely per file.
- **FR-EV-002 (Decentralized Pinning):** Upon network availability, the encrypted ciphertext MUST be streamed to decentralized storage via IPFS/Filecoin nodes, generating an immutable Content Identifier (CID).
- **FR-EV-003 (State Anchoring):** The client MUST compute the SHA-256 digest of the encrypted payload and commit the digest, IPFS CID, and UTC block timestamp to the EvidenceRegistry.sol smart contract on Polygon L2.
- **FR-EV-004 (BNS Statutory Mapping Engine):** The system MUST ingest natural language statements in any of the 22 Eighth Schedule Indian languages, transcribe locally using on-device models, and classify the allegations against the Bharatiya Nyaya Sanhita (BNS) (e.g., mapping stalking to BNS §78, sexual harassment to BNS §75).
- **FR-EV-005 (BNSS §173 e-Sign Countdown):** Once an e-FIR is generated, the backend MUST initialize a synchronous 72-hour (3-day) countdown timer. The interface MUST expose an e-signing mechanism complying with Indian Information Technology Act standards.
- **FR-EV-006 (Automated §173(4) SP Escalation):** If the e-FIR remains unsigned or unacknowledged by the jurisdictional police authority upon the expiration of the 72-hour timer, the relayer MUST package the anchored evidence digest and forward an escalation petition to the District Superintendent of Police under BNSS §173(4).
- **FR-EV-007 (BSA §63 Certificate Generation):** The system MUST automatically compile a machine-verifiable digital certificate under Section 63 of the Bharatiya Sakshya Adhiniyam, specifying hardware device signatures, cryptographically logged hash chains, time synchronization anchors, and custody validation logs.

## 3.2 Feature 2: Resilient Offline-First Multi-Rail SOS & Guardian Network

### Description

Guarantees uninterrupted distress signaling across disparate physical and network conditions via parallel dispatch rails and edge activation.

### Functional Requirements

- **FR-SOS-001 (Stealth Hardware Triggers):** The application MUST register background event listeners for:
  - A continuous 4-tap sequence of the hardware Power Button within 2.5 seconds.
  - Accelerometer shake patterns exceeding a dynamic threshold of \$2.5g\$.
  - Local edge acoustic classification via a quantized TensorFlow Lite (TFLite) model detecting emergency vocal triggers (e.g., custom wake-words or screaming) without streaming raw audio off-device.
- **FR-SOS-002 (Parallel Dispatch Rails):** Upon trigger actuation, the dispatch engine MUST initiate three parallel dispatch pathways:
  - **Rail A (Primary WebSockets):** Low-latency encrypted WebSocket broadcast to active dispatch servers.
  - **Rail B (Cellular SMS Fallback):** Encrypted SMS packets sent via Twilio APIs or device native telecommunication stacks to emergency endpoints containing compressed GPS coordinates.
  - **Rail C (Mesh/Peer Notification):** Bluetooth Low Energy (BLE) peripheral advertisement alerting proximate She-Raksha client devices within a 100m direct range.
- **FR-SOS-003 (Guardian Geofencing):** The dispatch relayer MUST compute spatial bounding boxes to alert opt-in, verified community guardians within an approximate 800-meter radius. Guardian displays MUST obscure exact victim home addresses, displaying dynamically refreshed coarse vectors to protect privacy.
- **FR-SOS-004 (Safe-Journey Dead-Man Check-In):** The user MAY configure a Safe-Journey session with an estimated arrival duration. If the user fails to acknowledge a check-in prompt within 120 seconds of deadline arrival, the platform MUST automatically trigger high-priority SOS escalation to guardians.
- **FR-SOS-005 (Offline Queue Anchoring):** In total connectivity failure, all distress triggers MUST be committed to an encrypted SQLite database on the client. Upon reconnect, cached actions MUST synchronize with the SOSLog.sol smart contract on Polygon L2.

## 3.3 Feature 3: Zero-Knowledge (ZK) Anonymous Bystander Reporting

### Description

Enables bystanders to submit verified evidence of incidents without revealing their identity, biometric data, or precise personal locations.

### Functional Requirements

- **FR-ZK-001 (Client-Side SNARK Generation):** The client MUST generate zero-knowledge proofs using the Groth16 proving system compiled via Circom and executed on-device using SnarkJS.
- **FR-ZK-002 (Proof of Personhood and Jurisdiction):** The ZK circuit MUST evaluate private witness inputs (e.g., cryptographic identity commitments and device location) and generate public outputs asserting:
  - The reporter is a valid, unique entity within the identity registry.
  - The reporter was physically present within the target administrative police jurisdiction boundary at the specified timestamp.
  - No public outputs reveal the reporter's public key, phone number, name, or precise coordinates.
- **FR-ZK-003 (Sybil Nullifiers):** The circuit MUST derive a deterministic cryptographic nullifier:  
  \$\$\\text{Nullifier} = \\text{Poseidon}(\\text{Identity Secret}, \\text{Incident Identifier})\$\$  
  The verification contract MUST track and reject submitted nullifiers to prevent duplicate submissions or denial-of-service spam.
- **FR-ZK-004 (On-Chain Verification & NGO Routing):** The ZKReportVerifier.sol contract on Polygon L2 MUST verify proof validity on-chain. Validated reports MUST be routed to encrypted message queues accessible only by verified, accredited NGO incident dashboards.

## 3.4 Feature 4: Identity & Account Abstraction Layer

### Description

Abstracts Web3 complexities, providing keyless cryptographic identity management and enterprise-sponsored network interactions.

### Functional Requirements

- **FR-ID-001 (ERC-4337 Smart Wallets):** The client MUST deploy or associate an ERC-4337-compliant contract account for each registered user, governed by validation logic supporting multi-ECDSA, passkeys, and biometric signers.
- **FR-ID-002 (Web3Auth Onboarding):** The system MUST onboard users using Web3Auth MPC (Multi-Party Computation) architecture, allowing wallet restoration via device biometrics, WebAuthn/Passkeys, or OAuth tokens without exposing or requiring mnemonic seed phrases.
- **FR-ID-003 (Paymaster Sponsorship):** All contract calls generated by the client MUST be wrapped into UserOperation structs and routed to a dedicated ERC-4337 Paymaster, which sponsors 100% of the L2 gas fees.
- **FR-ID-004 (Privacy-Preserving e-Sign Redaction):** Where formal e-Sign identification is required under statutory process, the client MUST permit zero-knowledge attribute disclosure, redacting unnecessary personal metadata while verifying valid legal execution.

# 4. External Interface Requirements

## 4.1 User Interfaces

The user experience across React Native and Next.js 14 MUST strictly adhere to the She-Raksha Brand Design Tokens:

+-------------------------------------------------------------+

```
| Token Name         | Hex Value | Semantic Usage             |
|--------------------|-----------|----------------------------|
| Dark Slate         | #121824   | App Background & Cards     |
| Midnight Obsidian  | #0A0D12   | Deep Base / Modals         |
| Crimson Coral      | #FF3B5C   | SOS Trigger / Urgent CTA   |
| Emerald Shield     | #00D084   | Safe State / Chain Valid   |
+-------------------------------------------------------------+
```



- **Accessibility:** Minimum touch-target sizing of \$48\\times48\\text{ pt}\$ for all emergency triggers; WCAG 2.1 AA compliant contrast ratios across all screen modes.
- **Feedback:** Haptic feedback confirmation (distinct vibrational cadence) upon SOS dispatch or secure vaulting confirmation.

## 4.2 Hardware Interfaces

- **Camera:** Native interface access for raw video capture (1080p at \$30\\text{ fps}\$) and low-light burst photography.
- **Microphone:** Pulse-Code Modulation (PCM) audio input stream for classification and recording.
- **GPS Receiver:** High-accuracy location updates, querying GPS, GLONASS, and NavIC constellations.
- **Inertial Measurement Unit (IMU):** Accelerometer and gyroscope data streams sampled at \$\\ge 50\\text{ Hz}\$ for fall and shake detection.
- **Physical Power Button:** Hardware interrupt hooks for rapid-press event interception.

## 4.3 Software Interfaces

- **Polygon L2 RPC:** JSON-RPC communication via Infura/Alchemy over HTTPS and WSS endpoints for transaction broadcasting.
- **Decentralized Storage APIs:** Pinata REST API for pinning encrypted IPFS payloads and retrieval via verified gateways.
- **Twilio Programmable SMS API:** REST integration for programmatic SMS dispatch during fallback modes.
- **ERSS-112 Relayer:** Secure mutual TLS (mTLS) REST API interface conforming to national emergency response data exchange formats.
- **Database Infrastructure:** PostgreSQL instance with PostGIS extensions for spatial query processing and operational data caching.

## 4.4 Communication Interfaces

- **HTTPS:** Strict TLS 1.3 encryption for all standard client-server REST communication.
- **WSS (WebSockets):** Duplex real-time connections using secure sockets for streaming telemetry during active SOS events.
- **WebRTC:** Peer-to-peer data channels for localized peer distress broadcasts.
- **SMS Protocol:** Standard SMPP/GSM signaling formats for unformatted cellular fallbacks.

# 5. Non-Functional Requirements

## 5.1 Performance Requirements

- **NFR-PERF-001 (Local Encryption Latency):** Symmetrical AES-256-GCM encryption of media payloads up to 50MB MUST complete within \$\\le 2.0\\text{ seconds}\$ on standard test hardware (e.g., Moto g85 / Samsung Galaxy A15).
- **NFR-PERF-002 (SOS Trigger-to-Relay Dispatch):** The end-to-end latency from hardware trigger actuation to network socket dispatch packet transmission MUST NOT exceed \$500\\text{ ms}\$.
- **NFR-PERF-003 (Client-Side ZK Proof Generation):** Generation of the Groth16 SNARK proof for anonymous reporting on mobile client runtimes MUST complete within \$\\le 8.0\\text{ seconds}\$.
- **NFR-PERF-004 (L2 State Finality Anchoring):** Evidence hashes submitted to the ERC-4337 bundler MUST be mined into a Polygon L2 block within an average target window of \$\\le 5.0\\text{ seconds}\$ under standard network conditions.

## 5.2 Security Requirements

- **NFR-SEC-001 (Cryptographic Primitives):** Encryption MUST use standard AES-256-GCM with secure random 96-bit nonces. Asymmetric operations MUST utilize secp256k1 (or BabyJubjub for ZK-circuits).
- **NFR-SEC-002 (Storage Sanitization):** No plain evidence files, raw location trails, or personally identifiable victim information shall be written to unencrypted persistent device storage. All temporary buffers MUST be cryptographically overwritten post-encryption.
- **NFR-SEC-003 (Replay Protection):** All ERC-4337 UserOperation submissions MUST embed monotonically increasing nonces to preclude replay attacks across chains or sessions.
- **NFR-SEC-004 (Smart Contract Audits):** All deployed on-chain smart contracts (EvidenceRegistry.sol, ZKReportVerifier.sol, and Custom Paymasters) MUST possess formal verification test suites with 100% line and branch coverage.

## 5.3 Reliability and Availability

- **NFR-REL-001 (Core Dispatch Availability):** The SOS intake backend and associated relayer pipelines MUST maintain 99.9% uptime annualized.
- **NFR-REL-002 (Network Failover Automation):** If a WebSocket dispatch pipeline encounters an unacknowledged transmission timeout exceeding \$5.0\\text{ seconds}\$, the mobile client MUST autonomously drop to Rail B (SMS fallback) without user interaction.
- **NFR-REL-003 (Data Durability):** Anchored evidence pinned via IPFS/Filecoin MUST maintain a minimum replication factor across at least 3 geographically distinct storage nodes.

## 5.4 Regulatory, Compliance & Privacy

- **NFR-REG-001 (DPDP Act Compliance):** The platform MUST uphold the principle of storage limitation and data minimization under the Digital Personal Data Protection Act. If a user triggers account deletion, local symmetric keys MUST be securely erased, rendering stored IPFS ciphertexts irrecoverable.
- **NFR-REG-002 (BSA §63 Admissibility):** The integrity of electronic records MUST be verifiable mathematically by comparing on-chain Polygon block timestamps and digests against the retrieved IPFS content, validating statutory chain of custody.
- **NFR-REG-003 (BNSS §173 Process Adherence):** The system MUST automatically preserve verifiable evidence trails for e-FIRs, maintaining deterministic status checks across the initial 72-hour signing window through SP escalation.