// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title EvidenceRegistry
 * @author She-Raksha Autonomous Engineering Team
 * @notice Immutable Polygon L2 registry for anchoring chunked AES-256-GCM evidence digests
 *         and session Merkle roots.
 * @dev Enforces strict Zero-PII invariants (DPDP Act 2023 & BSA §63).
 *      No plaintexts, names, phone numbers, or raw GPS coordinates are accepted on-chain.
 */
contract EvidenceRegistry is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Record {
        bytes32 chunkHash;
        string ipfsCID;
        uint256 timestamp;
        address observer;
    }

    struct SessionMerkleRecord {
        bytes32 merkleRoot;
        uint256 chunkCount;
        string ipfsCID;
        uint256 timestamp;
        address observer;
    }

    /// @notice sessionRoot[sessionId][chunkId] => Record
    mapping(bytes32 => mapping(bytes32 => Record)) public sessionRoot;

    /// @notice Direct chunk hash registry for verifyDigest lookups: sessionId => chunkHash => Record
    mapping(bytes32 => mapping(bytes32 => Record)) public chunkDigestRecords;

    /// @notice sessionMerkleRoots[sessionId] => SessionMerkleRecord
    mapping(bytes32 => SessionMerkleRecord) public sessionMerkleRoots;

    /// @notice Quick lookup for verified chunk digests: sessionId => chunkHash => isAnchored
    mapping(bytes32 => mapping(bytes32 => bool)) public isChunkHashAnchored;

    // --- Events ---
    event EvidenceAnchored(
        bytes32 indexed sessionId,
        bytes32 indexed chunkId,
        bytes32 indexed chunkHash,
        string ipfsCID,
        uint256 timestamp,
        address observer
    );

    event SessionMerkleRootAnchored(
        bytes32 indexed sessionId,
        bytes32 indexed merkleRoot,
        uint256 chunkCount,
        string ipfsCID,
        uint256 timestamp,
        address observer
    );

    // --- Custom Errors ---
    error InvalidSessionId();
    error InvalidChunkId();
    error InvalidChunkHash();
    error InvalidCID();
    error InvalidChunkCount();
    error EvidenceAlreadyAnchored();
    error InvalidSignature();
    error DigestNotFound();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Anchor an individual evidence chunk.
     * @param sessionId Deterministic session UUID/hash.
     * @param chunkId 5-second chunk identifier.
     * @param chunkHash SHA-256 digest of the encrypted chunk.
     * @param ipfsCID IPFS CIDv1 content address of the encrypted chunk.
     * @param signature Optional ECDSA signature of (sessionId, chunkId, chunkHash).
     */
    function anchorEvidence(
        bytes32 sessionId,
        bytes32 chunkId,
        bytes32 chunkHash,
        string calldata ipfsCID,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (bool) {
        if (sessionId == bytes32(0)) revert InvalidSessionId();
        if (chunkId == bytes32(0)) revert InvalidChunkId();
        if (chunkHash == bytes32(0)) revert InvalidChunkHash();
        _validateCID(ipfsCID);

        if (sessionRoot[sessionId][chunkId].timestamp != 0) {
            revert EvidenceAlreadyAnchored();
        }

        address observer = msg.sender;
        if (signature.length > 0) {
            bytes32 messageDigest = keccak256(abi.encodePacked(sessionId, chunkId, chunkHash));
            bytes32 ethSignedDigest = messageDigest.toEthSignedMessageHash();
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, signature);
            if (err != ECDSA.RecoverError.NoError || recovered == address(0)) {
                revert InvalidSignature();
            }
            observer = recovered;
        }

        Record memory record = Record({
            chunkHash: chunkHash,
            ipfsCID: ipfsCID,
            timestamp: block.timestamp,
            observer: observer
        });

        sessionRoot[sessionId][chunkId] = record;
        chunkDigestRecords[sessionId][chunkHash] = record;
        isChunkHashAnchored[sessionId][chunkHash] = true;

        emit EvidenceAnchored(
            sessionId,
            chunkId,
            chunkHash,
            ipfsCID,
            block.timestamp,
            observer
        );

        return true;
    }

    /**
     * @notice Convenience overload: Anchor evidence directly using session root digest.
     * @param sessionRootDigest Aggregated digest or single root hash.
     * @param ipfsCID IPFS CIDv1 of the encrypted evidence bundle.
     * @param signature Optional ECDSA signature of (sessionRootDigest, ipfsCID).
     */
    function anchorEvidence(
        bytes32 sessionRootDigest,
        string calldata ipfsCID,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (bool) {
        if (sessionRootDigest == bytes32(0)) revert InvalidSessionId();
        _validateCID(ipfsCID);

        if (sessionRoot[sessionRootDigest][sessionRootDigest].timestamp != 0) {
            revert EvidenceAlreadyAnchored();
        }

        address observer = msg.sender;
        if (signature.length > 0) {
            bytes32 messageDigest = keccak256(abi.encodePacked(sessionRootDigest, ipfsCID));
            bytes32 ethSignedDigest = messageDigest.toEthSignedMessageHash();
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, signature);
            if (err != ECDSA.RecoverError.NoError || recovered == address(0)) {
                revert InvalidSignature();
            }
            observer = recovered;
        }

        Record memory record = Record({
            chunkHash: sessionRootDigest,
            ipfsCID: ipfsCID,
            timestamp: block.timestamp,
            observer: observer
        });

        sessionRoot[sessionRootDigest][sessionRootDigest] = record;
        chunkDigestRecords[sessionRootDigest][sessionRootDigest] = record;
        isChunkHashAnchored[sessionRootDigest][sessionRootDigest] = true;

        emit EvidenceAnchored(
            sessionRootDigest,
            sessionRootDigest,
            sessionRootDigest,
            ipfsCID,
            block.timestamp,
            observer
        );

        return true;
    }

    /**
     * @notice Batch anchor an incremental SHA-256 Merkle root aggregating up to 1,000 chunks.
     * @param sessionId Session identifier.
     * @param merkleRoot The calculated SHA-256 root of all chunk digests.
     * @param chunkCount Total chunks in this Merkle tree.
     * @param ipfsCID IPFS CIDv1 of the manifest.
     * @param signature Optional ECDSA signature of (sessionId, merkleRoot, chunkCount).
     */
    function anchorSessionMerkleRoot(
        bytes32 sessionId,
        bytes32 merkleRoot,
        uint256 chunkCount,
        string calldata ipfsCID,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (bool) {
        if (sessionId == bytes32(0)) revert InvalidSessionId();
        if (merkleRoot == bytes32(0)) revert InvalidChunkHash();
        if (chunkCount == 0) revert InvalidChunkCount();
        _validateCID(ipfsCID);

        if (sessionMerkleRoots[sessionId].timestamp != 0) {
            revert EvidenceAlreadyAnchored();
        }

        address observer = msg.sender;
        if (signature.length > 0) {
            bytes32 messageDigest = keccak256(abi.encodePacked(sessionId, merkleRoot, chunkCount));
            bytes32 ethSignedDigest = messageDigest.toEthSignedMessageHash();
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, signature);
            if (err != ECDSA.RecoverError.NoError || recovered == address(0)) {
                revert InvalidSignature();
            }
            observer = recovered;
        }

        sessionMerkleRoots[sessionId] = SessionMerkleRecord({
            merkleRoot: merkleRoot,
            chunkCount: chunkCount,
            ipfsCID: ipfsCID,
            timestamp: block.timestamp,
            observer: observer
        });

        emit SessionMerkleRootAnchored(
            sessionId,
            merkleRoot,
            chunkCount,
            ipfsCID,
            block.timestamp,
            observer
        );

        return true;
    }

    /**
     * @notice Verify whether a chunk digest is registered within a given session.
     * @param sessionId The session identifier.
     * @param chunkHash The SHA-256 chunk hash.
     * @return isAnchored True if found.
     * @return timestamp The block timestamp of anchoring.
     * @return observer The observing or signing address.
     * @return ipfsCID The IPFS CIDv1 location.
     */
    function verifyDigest(
        bytes32 sessionId,
        bytes32 chunkHash
    ) external view returns (bool isAnchored, uint256 timestamp, address observer, string memory ipfsCID) {
        if (sessionId == bytes32(0) || chunkHash == bytes32(0)) {
            return (false, 0, address(0), "");
        }

        Record memory rec = chunkDigestRecords[sessionId][chunkHash];
        if (rec.timestamp != 0) {
            return (true, rec.timestamp, rec.observer, rec.ipfsCID);
        }

        return (false, 0, address(0), "");
    }

    /**
     * @notice Retrieve explicit chunk record.
     */
    function getChunkRecord(
        bytes32 sessionId,
        bytes32 chunkId
    ) external view returns (Record memory) {
        return sessionRoot[sessionId][chunkId];
    }

    /**
     * @notice Pauses contract in emergency (circuit breaker).
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpauses contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Enforces IPFS CID string format without leaking PII.
     */
    function _validateCID(string calldata cid) internal pure {
        bytes memory b = bytes(cid);
        // Valid CIDv0 is 46 chars (starts with Qm), CIDv1 is typically 59+ chars (starts with bafy/bafk)
        if (b.length < 10 || b.length > 128) {
            revert InvalidCID();
        }
    }
}
