She-Raksha Technical Specification: End-to-End Data Flow Architecture

System Architecture, Cryptographic Pipelines, Multi-Rail Dispatch Protocols, and Statutory Compliance

# 1. Document Overview & DFD Conventions

This document specifies the Data Flow Diagram (DFD) architecture for She-Raksha, a decentralized, legally hardened women's safety and automated incident lifecycle platform. It describes the flow of critical telemetry, multimedia evidence, distress packets, cryptographic proofs, and statutory legal artifacts across all operational tiers.

## 1.1 Scope & Tiers

- **Level 0 (Context Diagram):** High-level view capturing operational boundaries between external human/institutional actors and the She-Raksha Platform Core.
- **Level 1 (Subsystem Deconstruction):** Decomposition into five primary autonomous services, mapping interactions with local buffers, decentralized storage, Layer-2 ledgers, and spatial datastores.
- **Level 2 (Functional Pipelines):** Detailed functional trace of three mission-critical engines:
  - Subsystem 2.0: Evidence Vault & Automated e-FIR Generation Pipeline.
  - Subsystem 3.0: Resilient Multi-Rail Distress Dispatch Engine.
  - Subsystem 4.0: Zero-Knowledge (ZK) Anonymous Bystander Reporting Engine.

## 1.2 DFD Notation Legend (Yourdon & Coad / Gane-Sarson Unified)

- **External Entity (\[Entity Name\]):** Source or sink of boundary signals, located outside core process boundaries (e.g., citizen clients, emergency response services, legal dashboards).
- **Process ((ID Process Name)):** Algorithmic transformation, state verification, or computational pipeline executing on-device or within decentralized/cloud infrastructure.
- **Data Store (|D{n}| Store Name):** Persistence substrate, spanning local SQLite encrypted databases, distributed hash tables (IPFS), decentralized state machines (Polygon L2), or PostGIS engines.  
  |---|cryptographic attestations, or hardware-level interrupts.

# 2. DFD Level 0: Context Diagram

The Level 0 Context Diagram establishes She-Raksha's perimeter. The platform acts as a zero-trust mediator between citizens, emergency infrastructure (ERSS-112), law enforcement hierarchies, accredited legal aid NGOs, and proximal community guardians.

## 2.1 ASCII Context Diagram

 +---------------------------+

```
                           |  Bystander / Reporter     |
                           +---------------------------+
                             |                       ^
      Private Witness Data & |                       | ZK Nullifier Proof
      Off-Chain Geohash      v                       | Receipt (On-Chain)
                           +---------------------------+
                           |                           |
+------------------------> |                           | --------------------------+
|  Citizen / Victim        |                           |  Community Guardians      |
|  * Biometric / PII       |                           |  * BLE Distress Ping      |
|  * Hardware SOS Trigger  |                           |  * Decrypted Geohash      |
|  * Raw Audio/Video Enc.  |                           |  * Resiliency Mesh Ack    |
|                          |    0.0 SHE-RAKSHA         | <-------------------------+
|  <---------------------- |                           |
|  * Ephemeral Account     |    PLATFORM CORE SYSTEM   | --------------------------+
|  * Tamper-Proof Custody  |                           |  Law Enforcement          |
|    Certificate Pack      |                           |  (ERSS-112 / Police / SP) |
+------------------------> |                           |  * Multi-Rail e-FIR       |
                           |                           |  * BSA Sec 63 Hash Audits |
                           |                           |  * BNSS Sec 173 Escalation|
                           +---------------------------+ <-------------------------+
                             |                       ^
        Statutory Non-Action |                       | NGO Intervention Audit &
        Escalation Dossier   v                       | Legal Support Log
                           +---------------------------+
                           |  Accredited Human Rights  |
                           |  & Legal Aid NGOs         |
                           +---------------------------+
```

## 2.2 Boundary Interface Specification

| External Entity      | Direction | Data Flow Name            | Transport Protocol   | Payload / Cryptographic Content                                               |
| -------------------- | --------- | ------------------------- | -------------------- | ----------------------------------------------------------------------------- |
| Citizen / Victim     | Inflow    | `Trigger_Signal_Raw`      | I2C / Hardware Bus   | Accelerometer vectors, audio decibel thresholds, dual-button sequences.       |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Citizen / Victim     | Inflow    | `Encrypted_Media_Stream`  | TLS 1.3 / Local Pipe | AES-256-GCM chunked media buffers, device telemetry, GPS raw NMEA.            |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Citizen / Victim     | Outflow   | `Custody_Cert_Delivery`   | EBB / WSS Push       | BSA §63 PDF/A compliance pack, Polygon transaction receipts.                  |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Bystander / Reporter | Inflow    | `ZK_Witness_Submission`   | HTTPS / Relayer      | Groth16 zk-SNARK proof, Poseidon nullifier, ephemeral geohash bucket.         |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Bystander / Reporter | Outflow   | `Proof_Verification_Ack`  | JSON-RPC             | On-chain verification tx hash, zero-knowledge leaf inclusion receipt.         |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Community Guardians  | Outflow   | `Mesh_Beacon_Dispatch`    | BLE 5.2 Adv / P2P    | Ephemeral victim public key, geohash-8 coordinate, timestamp signature.       |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Community Guardians  | Inflow    | `Guardian_Mesh_Relay`     | BLE Mesh Flooding    | Forwarded SOS packet headers, relay hop counter, node receipt signatures.     |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Law Enforcement      | Outflow   | `eFIR_Statutory_Dispatch` | HTTPS REST / WSS     | JSON e-FIR compliant with BNSS §173, BSA §63 validation metadata, IPFS CIDs.  |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Law Enforcement      | Inflow    | `Statutory_Status_Update` | HTTPS Webhook        | Investigation log update, IO assignment metadata, FIR acceptance certificate. |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Accredited NGOs      | Outflow   | `Escalation_Notice_Push`  | WSS / Relayer        | 48-hour police non-action alerts, Superintendent escalation briefs.           |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |
| Accredited NGOs      | Inflow    | `Legal_Intervention_Log`  | HTTPS mTLS           | Habeas corpus triggers, verified counselor legal case audit sign-offs.        |
| ---                  | ---       | ---                       | ---                  | ---                                                                           |

# 3. DFD Level 1: System Deconstruction

The She-Raksha core platform is deconstructed into five isolated functional processes that interact with four primary physical and distributed datastores.

## 3.1 Subsystem Process Decomposition

- **Process 1.0 (User Authentication & Keyless Account Management):** Manages identity abstraction via ERC-4337 Smart Contract Accounts (SCAs) leveraging Web3Auth MPC (Multi-Party Computation). Derives non-custodial user keys using threshold signatures across device enclave, social recovery shares, and zero-knowledge identity assertions.
- **Process 2.0 (Evidence Capture, Encryption & Anchoring Pipeline):** Ingests streaming audio, video, and device telemetry. Performs client-side encryption using derived AES-256-GCM session keys, uploads shards to IPFS/Filecoin via Pinata gateways, and anchors cryptographic hashes to the Polygon Layer-2 EvidenceRegistry contract.
- **Process 3.0 (Resilient Multi-Rail Distress Dispatch Engine):** Evaluates connectivity states upon trigger activation. Enforces multi-rail broadcast redundancy across WebSockets (primary), SMS/GSM payloads via Twilio/telecom gateways (secondary fallback), and localized Bluetooth Low Energy (BLE) peripheral mesh flooding (tertiary zero-network fallback).
- **Process 4.0 (Zero-Knowledge Anonymous Reporting Engine):** Ingests raw bystander testimony, verifies spatial-temporal coordinates via Circom circuits, computes Poseidon nullifiers to prevent double-reporting, and produces a Groth16 zero-knowledge proof for on-chain validation via ZKReportVerifier.
- **Process 5.0 (Statutory Legal Lifecycle & Escalation Manager):** Structures evidence packs into standardized e-FIR schemas matching Bharatiya Nagarik Suraksha Sanhita (BNSS) §173 requirements. Computes automated tamper proofs under Bharatiya Sakshya Adhiniyam (BSA) §63. Implements programmatic on-chain timelocks via ComplaintEscrow to escalate inactive FIRs directly to District Superintendents and accredited NGOs after 48 hours.

## 3.2 Data Store Mapping

- **|D1| Local Encrypted SQLite Buffer (SQLCipher):** Client-side zero-trust encrypted cache. Holds offline queue packets, local salt matrices, uncommitted AES chunks, and ephemeral transit state.
- **|D2| Decentralized File Store (IPFS / Filecoin Nodes):** Persistent content-addressed immutable storage holding raw ciphertext blocks, encrypted audio/video payloads, and BSA §63 digital certificate attachments.
- **|D3| Polygon L2 Smart Contracts (EVM):** Trust anchor containing EvidenceRegistry.sol, SOSLog.sol, ZKReportVerifier.sol, and ComplaintEscrow.sol.
- **|D4| PostgreSQL / PostGIS Spatial Database:** High-throughput relational spatial engine handling geospatial clustering, guardian proximity indexing (H3 grid rings), and operational dashboards.

## 3.3 Level 1 Architecture Diagram

 \[ Citizen Enclave \] \[ Bystander Device \]

```
                |                                   |
    Biometrics  | User Auth             Witness     | Raw Geometry
    MPC Shares  v Parameters            Attestation v Coordinates
+-------------------------------+   +-------------------------------+
| 1.0 Account Abstraction &     |   | 4.0 Zero-Knowledge Anonymous  |
| Keyless Identity Manager      |   | Reporting Engine              |
+-------------------------------+   +-------------------------------+
    |                       |           |                       |
    | Derived Key           | Account   | Groth16 Proof         | ZK Nullifier
    v Material              v Config    v Poseidon Hash         v Payload
+-------------------------------+   +-------------------------------+
| 2.0 Evidence Capture,         |   | |D3| Polygon L2 Contracts:    |
| Encryption & Anchoring Pipe   |   | * EvidenceRegistry.sol        |
+-------------------------------+   | * ZKReportVerifier.sol        |
    |                   ^           | * ComplaintEscrow.sol         |
    | Ciphertext        | Ingest    +-------------------------------+
    v Blocks            | Buffer        ^                       ^
+-------------------+   |               | On-Chain Anchor       | Timelock Escrow
| |D2| IPFS /       |   |               | Verification Data     | State Logic
| Pinata Network    |   |           +-------------------------------+
+-------------------+   |           | 5.0 Statutory Legal Lifecycle |
    | Content Hash      |           | & Escalation Manager          |
    v (CIDv1)           |           +-------------------------------+
+-------------------------------+       |                       |
| 3.0 Resilient Multi-Rail      | <-----+ Synced FIR            v BSA Sec 63
| Distress Dispatch Engine      |         Metadata     +---------------------+
+-------------------------------+                      | Law Enforcement     |
    |       |               |                          | (ERSS-112 / Police) |
    | RailA | RailB         | RailC                    +---------------------+
    | WSS   | Twilio SMS    | BLE Mesh                          ^
    v       v               v                                   |
+-------------------------------+                               | Escalation Alert
| |D4| PostGIS Spatial Database | ------------------------------+ (48-Hr Trigger)
| (Geofence & Dispatched State) |
+-------------------------------+
```

# 4. DFD Level 2: Detailed Subsystem Pipelines

## 4.1 Subsystem 2.0: Evidence Vault & Automated e-FIR Pipeline

This pipeline details data ingestion from raw hardware feeds to certified digital evidence admitted under BSA §63.t  
\[ Sensor / Mic / Camera \]  
|  
| Raw uncompressed buffers  
v  
+-------------------------------------------------------------+  
| 2.1 Media & Telemetry Acquisition |  
| - 5-sec chunk split |  
| - GPS, NMEA sentences, cell tower identifiers appended |  
+-------------------------------------------------------------+  
|  
| Raw chunks + Telemetry frame  
v  
+-------------------------------------------------------------+  
| 2.2 AES-256-GCM Envelope Encryption |  
| - Generates CSPRNG IV/Nonce (96-bit) |  
| - Encrypts media chunk using hardware enclave key |  
| - Produces 128-bit authentication tag |  
+-------------------------------------------------------------+  
|  
| Ciphertext payload + Auth Tag + IV  
v  
+-------------------------------------------------------------+  
| 2.3 Distributed Pinning Ingestion |  
| - Computes UnixFS-v2 multi-hash |  
| - Transmits via Pinata API to IPFS cluster nodes |  
| - Receives immutable CIDv1 |  
+-------------------------------------------------------------+  
|  
| IPFS CIDv1 + SHA-256 Digest  
v  
+-------------------------------------------------------------+  
| 2.4 Blockchain Anchor Construction |  
| - Assembles EvidenceRegistry payload |  
| - Bundles block timestamp, device public key, CID hash |  
| - Transacts on Polygon PoS via Account Abstraction paymaster|  
+-------------------------------------------------------------+  
|  
| Polygon Transaction Hash & Block Height  
v  
+-------------------------------------------------------------+  
| 2.5 Statutory Legal Narrative Synthesis |  
| - Parses telemetry, transcription vectors, spatial bounds |  
| - Matches structured parameters to BNS penal codes |  
| - Formulates e-FIR manifest under BNSS Sec 173 |  
+-------------------------------------------------------------+  
|  
| e-FIR Draft Object + Ledger Receipts  
v  
+-------------------------------------------------------------+  
| 2.6 BSA Section 63 Certificate Compilation |  
| - Resolves hash chain integrity proof |  
| - Attests system process parameters and device trust score |  
| - Generates cryptographically signed PDF/A-3 compliant pack |  
+-------------------------------------------------------------+  
|  
v  
\[ Evidence Vault: e-FIR Output Store \]



````
#### Detailed Process Descriptions: Subsystem 2.0
* **2.1 Media & Telemetry Acquisition:** Splits on-device camera frames and microphone audio streams into rolling 5-second deterministic chunks while reading sensor telemetry (lat, long, altitude, horizontal dilution of precision, cell tower global identity).
* **2.2 AES-256-GCM Envelope Encryption:** Executes in-memory symmetric encryption of each chunk. Generates an independent 96-bit initialization vector (IV) per chunk. Secures the data stream so zero plaintext data is stored on secondary flash memory before encryption.
* **2.3 Distributed Pinning Ingestion:** Pipes encrypted chunks directly to IPFS multi-provider nodes via mTLS using the Pinata IPFS Gateway, resolving each chunk to a unique base32 Content Identifier (CIDv1).
* **2.4 Blockchain Anchor Construction:** Aggregates chunk CIDs, calculates an incremental Merkle tree root hash of the session, and triggers an on-chain state update calling `anchorEvidence(bytes32 sessionRoot, string memory ipfsCID, bytes memory signature)` on `EvidenceRegistry.sol`.
* **2.5 Statutory Legal Narrative Synthesis:** Maps event attributes (timestamp, geofence, decibel spikes, duration) into automated structured incident categories according to the Bharatiya Nyaya Sanhita (BNS) (e.g., stalker identification, physical assault parameters).
* **2.6 BSA Section 63 Certificate Compilation:** Builds the legal document bundle certifying digital evidence integrity as mandated by Section 63 of the Bharatiya Sakshya Adhiniyam, 2023. Generates the hardware-hashed provenance trail and embeds SHA-256 hash chains verifying digital chain-of-custody.
### 4.2 Subsystem 3.0: Resilient Multi-Rail Distress Dispatch Engine
This pipeline guarantees emergency packet delivery even in zero-reception or cellular degradation scenarios.
```text
+--------------------------------------------------------------------------+
| 3.1 Edge Hardware Trigger Layer                                          |
| - Rapid 4x Power Key Press Interrupt                                     |
| - On-Device TFLite Continuous Audio Classifier ("Help" / Distress Screams)|
| - Accelerometer Jerk-Vector Anomaly Detector (>3.8G Impact)              |
+--------------------------------------------------------------------------+
                                     |
                                     | Hardware interrupt trigger event
                                     v
+--------------------------------------------------------------------------+
| 3.2 Dynamic Network Evaluator & Emergency Packet Serializer              |
| - Tests RTT on Active Network Interfaces (IPv4/IPv6, Cellular, Wi-Fi)    |
| - Serializes core distress payload: Session UUID, Lat/Long, Timestamp    |
| - Signs payload with user Smart Account Ed25519 signing key              |
+--------------------------------------------------------------------------+
                                     |
      +------------------------------+------------------------------+
      | (If Tier 1: Low Latency /    | (If Tier 2: Low Throughput / | (If Tier 3: Nil Coverage /
      |  4G/5G Active)               |  2G/EDGE Active)             |  Airplane/Jamming)
      v                              v                              v
+------------------------+  +------------------------+  +------------------------+
| 3.3.A Rail-A Dispatch  |  | 3.3.B Rail-B Dispatch  |  | 3.3.C Rail-C Dispatch  |
| - High-throughput WSS  |  | - Encoded Base91 GSM-7 |  | - BLE 5.2 Extended Adv|
| - Live location stream |  | - Twilio Gateway / SMPP|  | - Mesh Flooding Frame  |
| - Ingest to Central    |  | - SMS direct to ERSS-  |  | - Local guardian relay |
|   Dispatch Hub         |  |   112 Shortcode (112)  |  |   node transmission    |
+------------------------+  +------------------------+  +------------------------+
      |                              |                              |
      +------------------------------+------------------------------+
                                     |
                                     | Normalizes inbound alert packets
                                     v
+--------------------------------------------------------------------------+
| 3.4 Geofence Spatial Resolution & Guardian Target Matcher                |
| - Computes victim H3 Hexagonal Cell Index (Resolution 9: ~100m)          |
| - Intersects spatial PostGIS layers for nearest Police CRV units         |
| - Emits targeted push alerts to verified Community Guardians             |
+--------------------------------------------------------------------------+
                                     |
                                     | Connection drops / pending ACKs
                                     v
+--------------------------------------------------------------------------+
| 3.5 Reconnect Queue Synchronization Engine                               |
| - Persists non-acknowledged state vectors into local SQLCipher |D1|       |
| - Backoff polling algorithm for network link restoration                 |
| - Replays pending telemetry anchors to Polygon L2 on reconnect           |
+--------------------------------------------------------------------------+
````

### Detailed Process Descriptions: Subsystem 3.0

- **3.1 Edge Hardware Trigger Layer:** Low-power background daemons monitor continuous inputs from hardware peripherals: GPIO interrupts capturing mechanical clicks, TFLite lightweight voice classification models running locally on DSP/NPU cores, and abrupt accelerometer variances indicating physical distress.
- **3.2 Dynamic Network Evaluator & Emergency Packet Serializer:** Evaluates interface quality flags (Wi-Fi, LTE, 3G, GSM, zero-link) within 150 milliseconds. Formats the canonical SOS data buffer containing compressed coordinates, accuracy radii, velocity, device power state, and the cryptographic sender signature.
- **3.3.A Rail-A Dispatch (WebSockets / Push Engine):** Primary route. Maintains long-lived bi-directional encrypted WebSockets directly to the She-Raksha central dispatch microservices, transmitting sub-second real-time streaming updates.
- **3.3.B Rail-B Dispatch (Cellular Signaling / SMS PDU):** Secondary fallback. Compresses telemetry vectors into a dense Base91 string fit for single-segment GSM-7 SMS structures (160 characters), transmitted through SMS gateways directly targeting ERSS-112 ingestion endpoints.
- **3.3.C Rail-C Dispatch (BLE Mesh Zero-Bearer Engine):** Tertiary fallback. Broadcasts dynamic non-connectable BLE advertising frames (Bluetooth Core Spec 5.2). Nearby consumer devices acting as She-Raksha mesh relays pick up and forward these frames across hop-limited peer vectors until reaching an internet-connected node.
- **3.4 Geofence Spatial Resolution & Guardian Target Matcher:** Computes H3 spatial indexing to identify operational responder clusters. Queries PostGIS ST_DWithin functions to route distress packets to patrol units and vetted citizen guardians within immediate proximity rings.
- **3.5 Reconnect Queue Synchronization Engine:** Manages a deterministic on-device append-only persistence queue using SQLCipher. If network delivery fails across all transport rails, packets remain pinned in the buffer, continuously cycling through an exponential-backoff retrial process until cryptographic server acknowledgments are received.

## 4.3 Subsystem 4.0: Zero-Knowledge (ZK) Anonymous Bystander Reporting Engine

This subsystem facilitates verified, anonymous reporting without exposing the bystander's identity, IP address, or precise real-time location.

\[ Bystander Native Client \]

```
         |
         | Raw incident witness parameters & anonymous identity inputs
         v
+-------------------------------------------------------------+
| 4.1 Private Witness Frame Assembly                          |
| - Private Inputs: Secret Bystander Identity Nullifier (sk)  |
| - Spatial Quantization: Lat/Long truncated to Geohash-6     |
| - Public Inputs: Incident Category, Canonical Timestamp     |
+-------------------------------------------------------------+
         |
         | Structured witness inputs (private + public)
         v
+-------------------------------------------------------------+
| 4.2 Circom Arithmetization & SnarkJS Groth16 Prover        |
| - Evaluates R1CS arithmetic constraint system               |
| - Proves possession of valid registered Identity Secret     |
| - Enforces timestamp variance checks without showing exact  |
| - Generates zero-knowledge proof components (pi_a, pi_b, c) |
+-------------------------------------------------------------+
         |
         | Proof artifacts & commitments
         v
+-------------------------------------------------------------+
| 4.3 Poseidon Cryptographic Nullifier Derivation             |
| - Computes NullifierHash = Poseidon(sk, Geohash6, Salt)     |
| - Ensures unforgeable one-report-per-event property         |
| - Protects bystander pseudonymity (irreversible nullifier)  |
+-------------------------------------------------------------+
         |
         | Formatted ZK proof payload + Nullifier hash
         v
+-------------------------------------------------------------+
| 4.4 Polygon On-Chain Verification Pipeline                  |
| - Interacts with ZKReportVerifier.sol contract              |
| - Validates Groth16 pairing points inside pairing precompile|
| - Rejects if NullifierHash has been used                    |
| - Emits AnonymousReportVerified event                       |
+-------------------------------------------------------------+
         |
         | Verified transaction hash + State log index
         v
+-------------------------------------------------------------+
| 4.5 Encrypted Relayer Dispatch & Institutional Ingest       |
| - Routes anonymized structured report to NGO Dashboards     |
| - Transmits cryptographic report to Police desk via HTTPS   |
| - Commits metadata record to spatial PostGIS store |D4|     |
+-------------------------------------------------------------+
         |
         v
[ Institutional Ingestion & Legal Review Hub ]
```

### Detailed Process Descriptions: Subsystem 4.0

- **4.1 Private Witness Frame Assembly:** Takes the bystander's identity salt, secret key, device location, and timestamp, and prepares the computation vector. Ingests precise GPS coordinates and converts them into an area geohash-6 (~1.2km resolution), stripping exact location data before generating the proof.
- **4.2 Circom Arithmetization & SnarkJS Groth16 Prover:** Compiles an R1CS constraint matrix using a zero-knowledge circuit. Validates that the bystander is a unique verified entity and that the report falls within a legitimate time window, outputting elliptic curve points A, B, and C without disclosing private inputs.
- **4.3 Poseidon Cryptographic Nullifier Derivation:** Computes a collision-resistant Poseidon hash using the user's secret key, the event category, and the regional geohash bucket. Prevents spam or duplicate filings while preserving the reporter's anonymity.
- **4.4 Polygon On-Chain Verification Pipeline:** Passes the Groth16 proof points into the ZKReportVerifier.sol smart contract on Polygon L2. The EVM precompile executes an elliptic curve pairing check, asserts nullifier freshness, and commits the anonymous report directly to the ledger.
- **4.5 Encrypted Relayer Dispatch & Institutional Ingest:** A decentralized gasless relayer system accepts the verified event payload and distributes it across secure endpoints: the NGO verification desk, spatial mapping databases, and the Police administrative interface.

# 5. Data Dictionary

## 5.1 IncidentCapturePayload

Origin: Client Enclave Capture Daemon (Subsystem 2.1)  
Destination: Client-Side Envelope Encryption Service (Subsystem 2.2)n  
{  
"\$schema": "<https://json-schema.she-raksha.org/v1/IncidentCapturePayload.json>",  
"sessionId": "a8f9c4d2-7e1b-4d6a-9f2e-3b5c7a1d9e2f",  
"deviceTelemetry": {  
"deviceHardwareId": "SHA256:7b5e4f...31a",  
"timestampEpochMs": 1718025430125,  
"batteryLevelPercent": 84,  
"location": {  
"latitude": 28.613939,  
"longitude": 77.209021,  
"altitudeMeters": 216.4,  
"horizontalDilution": 0.82,  
"headingDegrees": 142.5,  
"speedMps": 1.2  
},  
"telephony": {  
"carrier": "Airtel",  
"mcc": 404,  
"mnc": 10,  
"cellId": 4820192,  
"signalStrengthDbm": -78  
}  
},  
"mediaMetadata": {  
"chunkSequenceIndex": 12,  
"codec": "AUDIO_AAC_128K_VIDEO_H265_1080P",  
"durationMs": 5000,  
"rawByteLength": 10485760  
}  
}



````
### 5.2 EncryptedEvidenceRecord
Origin: AES-256-GCM Encryption Service (Subsystem 2.2)
Destination: Pinata IPFS Ingestion Gateway & Polygon L2 `EvidenceRegistry` (Subsystems 2.3 & 2.4)
```json
{
  "$schema": "https://json-schema.she-raksha.org/v1/EncryptedEvidenceRecord.json",
  "recordId": "rec_01HZ89XKV4QMP5N67WTR1V8K2G",
  "sessionId": "a8f9c4d2-7e1b-4d6a-9f2e-3b5c7a1d9e2f",
  "encryptionManifest": {
    "cipherAlgorithm": "AES-256-GCM",
    "initializationVectorHex": "9f1c7d8a4b2e6f0a1c3e5a7b",
    "authTagHex": "e3b0c44298fc1c149afbf4c8996fb924",
    "keyDerivation": {
      "function": "HKDF-SHA256",
      "saltHex": "0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d",
      "info": "she-raksha-evidence-vault-ephemeral"
    }
  },
  "ipfsContentId": "bafybeicv5...73g2yq",
  "sha256DigestHex": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
  "onChainAnchor": {
    "networkChainId": 137,
    "contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "transactionHash": "0x89d2c...10f2",
    "blockNumber": 58201948
  }
}
````

## 5.3 SOSAlertPacket

Origin: Dynamic Network Evaluator (Subsystem 3.2)  
Destination: Multi-Rail Transport Layer (Subsystems 3.3.A, 3.3.B, 3.3.C)

{

```
  "$schema": "https://json-schema.she-raksha.org/v1/SOSAlertPacket.json",
  "packetId": "sos_7a9c...3f12",
  "userSmartAccount": "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  "alertLevel": "CRITICAL_THREAT",
  "triggerMode": "HARDWARE_TAP_FOUR_PRESS",
  "timestamp": "2025-05-18T14:37:10.125Z",
  "spatialCoordinates": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "h3IndexResolution9": "893c52e1e0bffff",
    "accuracyRadiusMeters": 4.5
  },
  "transportOptimization": {
    "dispatchedRails": ["WSS_PRIMARY", "TWILIO_SMS_SECONDARY"],
    "base91CompressedPayload": "x%T>pA_z!J7@...sQ8"
  },
  "ecdsaSignature": {
    "r": "0x789...abc",
    "s": "0x456...def",
    "v": 27
  }
}
```

## 5.4 ZKProofSubmission

Origin: Bystander SnarkJS Groth16 Prover (Subsystem 4.2)  
Destination: ZKReportVerifier.sol Smart Contract (Subsystem 4.4)

{

```
  "$schema": "https://json-schema.she-raksha.org/v1/ZKProofSubmission.json",
  "circuitType": "AnonymousBystanderReportVerifier_v2",
  "proof": {
    "pi_a": [
      "0x12a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3",
      "0x23b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4"
    ],
    "pi_b": [
      [
        "0x34c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
        "0x45d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
      ],
      [
        "0x56e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
        "0x67f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8"
      ]
    ],
    "pi_c": [
      "0x78a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9",
      "0x89b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0"
    ]
  },
  "publicInputs": {
    "poseidonNullifierHash": "0x0f1e2d3c4b5a69788796a5b4c3d2e1f00f1e2d3c4b5a69788796a5b4c3d2e1f0",
    "geohashBucket": "ttnf7z",
    "incidentCategoryCode": 104,
    "timestampBucketEpochHour": 476839
  }
}
```

## 5.5 eFIRRecord & EscalationNotice

Origin: Statutory Legal Narrative Synthesizer (Subsystem 2.5)  
Destination: ERSS-112 Ingest, District SP, Legal Aid NGOs (Subsystems 5.0, 3.4)

{

```
  "$schema": "https://json-schema.she-raksha.org/v1/eFIRRecord.json",
  "firReference": "eFIR-2025-BNSS173-DEL-08491",
  "statutoryFramework": {
    "proceduralLaw": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)",
    "proceduralSection": "Section 173(1) - Information in cognizable cases",
    "substantiveLaw": "Bharatiya Nyaya Sanhita, 2023 (BNS)",
    "substantiveSectionsApplied": ["BNS Sec 78 (Stalking)", "BNS Sec 351(2) (Criminal Intimidation)"]
  },
  "jurisdiction": {
    "state": "NCT of Delhi",
    "district": "New Delhi District",
    "policeStationCode": "PS-ND-002",
    "stationName": "Parliament Street Police Station"
  },
  "evidenceChainManifest": {
    "rootMerkleHash": "0xd4e5f6...3b2a",
    "evidenceLedgerContract": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "mediaRecordCount": 18,
    "ipfsCIDs": ["bafybeicv5...73g2yq", "bafybeib2x...89z1qa"]
  },
  "escalationCondition": {
    "createdAt": "2025-05-18T14:37:10Z",
    "actionDeadline": "2025-05-20T14:37:10Z",
    "escalationTimerHours": 48,
    "superintendentNotificationScheduled": true,
    "assignedIO": null,
    "status": "STATUTORY_PENDING_ACTION"
  }
}
```

## 5.6 BSA63CertificatePack

Origin: Legal Evidence Compiler (Subsystem 2.6)  
Destination: Judicial Evidentiary Repository, Law Enforcement

{

```
  "$schema": "https://json-schema.she-raksha.org/v1/BSA63CertificatePack.json",
  "certificateId": "BSA63-CERT-20250518-8491",
  "governingStatute": "Section 63, Bharatiya Sakshya Adhiniyam, 2023 (BSA)",
  "certifierDetails": {
    "signatoryType": "AUTOMATED_TRUSTED_EXECUTION_ENVIRONMENT",
    "teeProvider": "AWS Nitro Enclaves / Android Hardware StrongBox",
    "deviceAttestationPubkey": "0x04bf3...990d",
    "complianceEngine": "She-Raksha Legal Cryptographic Core v3.1"
  },
  "sourceDeviceSpecifications": {
    "oem": "Google",
    "model": "Pixel 8 Pro",
    "osBuildNumber": "AP2A.240505.004",
    "enclaveTrustAttestationPass": true
  },
  "chainOfCustody": [
    {
      "sequence": 1,
      "event": "INGESTION_AND_LOCAL_HASHING",
      "timestampEpochMs": 1718025430125,
      "computedSha256": "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    },
    {
      "sequence": 2,
      "event": "POLYGON_L2_MERKLE_ANCHORING",
      "transactionHash": "0x89d2c...10f2",
      "blockNumber": 58201948
    },
    {
      "sequence": 3,
      "event": "IPFS_PERSISTENCE_ATTESTATION",
      "rootCID": "bafybeicv5...73g2yq",
      "pinVerificationStatus": "PINNED_CONSENSUS_AFFIRMED"
    }
  ],
  "admissibilityDeclaration": "Certified that the digital device producing this electronic record operated under normal parameters without computational corruption. Hash validation confirms cryptographic immutability from edge collection through persistent storage, fulfilling Section 63 of the Bharatiya Sakshya Adhiniyam, 2023."
}
```

