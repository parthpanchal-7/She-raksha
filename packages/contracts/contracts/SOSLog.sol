// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title SOSLog
 * @author She-Raksha Autonomous Engineering Team
 * @notice Immutable Polygon L2 ledger for SOS distress notarization and SQLCipher offline queue replay.
 * @dev Preserves cryptographic audit trail under BSA §63 while enforcing strict DPDP Zero-PII rules.
 */
contract SOSLog is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct BlockAnchor {
        bytes32 rootMerkleTree;
        uint256 anchorTimestamp;
        address signatory;
    }

    struct OfflineQueueItem {
        bytes32 incidentHash;
        bytes32 rootMerkleTree;
        uint256 deviceTimestamp;
        bytes signature;
    }

    /// @notice Maximum offline items allowable in a single batch replay
    uint256 public constant MAX_BATCH_SIZE = 100;

    /// @notice incidentHash => BlockAnchor
    mapping(bytes32 => BlockAnchor) public incidentAnchors;

    /// @notice Records offline device timestamps when replayed: incidentHash => deviceTimestamp
    mapping(bytes32 => uint256) public deviceTimestamps;

    // --- Events ---
    event DistressNotarized(
        bytes32 indexed incidentHash,
        bytes32 indexed rootMerkleTree,
        uint256 anchorTimestamp,
        address indexed signatory
    );

    event OfflinePacketReplayed(
        bytes32 indexed incidentHash,
        bytes32 indexed rootMerkleTree,
        uint256 deviceTimestamp,
        uint256 replayedTimestamp,
        address indexed signatory
    );

    // --- Custom Errors ---
    error InvalidIncidentHash();
    error InvalidMerkleRoot();
    error IncidentAlreadyAnchored();
    error InvalidDeviceTimestamp(uint256 deviceTimestamp, uint256 blockTimestamp);
    error EmptyQueue();
    error BatchSizeExceeded();
    error InvalidSignature();
    error IncidentNotFound();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Notarize an immediate online distress incident.
     * @param incidentHash Unique deterministic incident digest.
     * @param rootMerkleTree The Merkle root of the incident's evidence and telemetry packets.
     * @param signature Optional ECDSA signature of (incidentHash, rootMerkleTree).
     */
    function notarizeDistress(
        bytes32 incidentHash,
        bytes32 rootMerkleTree,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (bool) {
        if (incidentHash == bytes32(0)) revert InvalidIncidentHash();
        if (rootMerkleTree == bytes32(0)) revert InvalidMerkleRoot();

        if (incidentAnchors[incidentHash].anchorTimestamp != 0) {
            revert IncidentAlreadyAnchored();
        }

        address signatory = msg.sender;
        if (signature.length > 0) {
            bytes32 messageDigest = keccak256(abi.encodePacked(incidentHash, rootMerkleTree));
            bytes32 ethSignedDigest = messageDigest.toEthSignedMessageHash();
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, signature);
            if (err != ECDSA.RecoverError.NoError || recovered == address(0)) {
                revert InvalidSignature();
            }
            signatory = recovered;
        }

        incidentAnchors[incidentHash] = BlockAnchor({
            rootMerkleTree: rootMerkleTree,
            anchorTimestamp: block.timestamp,
            signatory: signatory
        });

        emit DistressNotarized(
            incidentHash,
            rootMerkleTree,
            block.timestamp,
            signatory
        );

        return true;
    }

    /**
     * @notice Replays offline SQLCipher queues with original signed device timestamps.
     * @param items Array of queued offline items collected when offline.
     * @return processedCount Number of items successfully logged and notarized.
     */
    function logDisconnectionQueue(
        OfflineQueueItem[] calldata items
    ) external whenNotPaused nonReentrant returns (uint256 processedCount) {
        uint256 len = items.length;
        if (len == 0) revert EmptyQueue();
        if (len > MAX_BATCH_SIZE) revert BatchSizeExceeded();

        for (uint256 i = 0; i < len; ) {
            OfflineQueueItem calldata item = items[i];

            if (item.incidentHash == bytes32(0)) revert InvalidIncidentHash();
            if (item.rootMerkleTree == bytes32(0)) revert InvalidMerkleRoot();
            if (item.deviceTimestamp > block.timestamp) {
                revert InvalidDeviceTimestamp(item.deviceTimestamp, block.timestamp);
            }

            address signatory = msg.sender;
            if (item.signature.length > 0) {
                bytes32 messageDigest = keccak256(
                    abi.encodePacked(item.incidentHash, item.rootMerkleTree, item.deviceTimestamp)
                );
                bytes32 ethSignedDigest = messageDigest.toEthSignedMessageHash();
                (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, item.signature);
                if (err != ECDSA.RecoverError.NoError || recovered == address(0)) {
                    revert InvalidSignature();
                }
                signatory = recovered;
            }

            // If not yet anchored, establish the anchor
            if (incidentAnchors[item.incidentHash].anchorTimestamp == 0) {
                incidentAnchors[item.incidentHash] = BlockAnchor({
                    rootMerkleTree: item.rootMerkleTree,
                    anchorTimestamp: block.timestamp,
                    signatory: signatory
                });
            }

            deviceTimestamps[item.incidentHash] = item.deviceTimestamp;

            emit OfflinePacketReplayed(
                item.incidentHash,
                item.rootMerkleTree,
                item.deviceTimestamp,
                block.timestamp,
                signatory
            );

            unchecked {
                ++processedCount;
                ++i;
            }
        }

        return processedCount;
    }

    /**
     * @notice Fetch anchor record for an incident.
     */
    function getIncidentAnchor(bytes32 incidentHash) external view returns (BlockAnchor memory) {
        BlockAnchor memory anchor = incidentAnchors[incidentHash];
        if (anchor.anchorTimestamp == 0) revert IncidentNotFound();
        return anchor;
    }

    /**
     * @notice Check whether an incident has already been anchored.
     */
    function isIncidentAnchored(bytes32 incidentHash) external view returns (bool) {
        return incidentAnchors[incidentHash].anchorTimestamp != 0;
    }

    /**
     * @notice Pauses contract in emergency.
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
}
