// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ComplaintEscrow
 * @author She-Raksha Autonomous Engineering Team
 * @notice Statutory escrow tracking the Bharatiya Nagarik Suraksha Sanhita (BNSS) Section 173
 *         e-FIR signing window (72 hours = 259,200 seconds) and automatic BNSS §173(4)
 *         Superintendent of Police (SP) escalation.
 * @dev Guarantees mathematical statutory deadlines without relying on centralized police databases.
 */
contract ComplaintEscrow is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Statutory 72-hour signing deadline constant under BNSS Section 173 (259,200 seconds)
    uint256 public constant STATUTORY_ESCALATION_SECONDS = 259200;

    /// @notice Optional 48-hour NGO early warning threshold (172,800 seconds)
    uint256 public constant NGO_EARLY_WARNING_SECONDS = 172800;

    struct EscrowState {
        uint256 incidentId;
        uint256 signDeadline;
        bool isEscalated;
        bool isSigned;
    }

    struct EscrowMetadata {
        address victim;
        bytes32 efirHash;
        bool isAcknowledged;
        bytes32 officerBadgeHash;
        uint256 signedAt;
        uint256 acknowledgedAt;
        uint256 escalatedAt;
    }

    /// @notice complaintId => EscrowState
    mapping(uint256 => EscrowState) public escrows;

    /// @notice complaintId => EscrowMetadata
    mapping(uint256 => EscrowMetadata) public escrowMetadata;

    /// @notice Authorized police acknowledgement verifiers / stations
    mapping(address => bool) public authorizedPoliceNodes;

    // --- Events ---
    event EscrowInitiated(
        uint256 indexed complaintId,
        uint256 indexed incidentId,
        bytes32 indexed efirHash,
        uint256 signDeadline,
        address victim
    );

    event VictimSignatureRecorded(
        uint256 indexed complaintId,
        uint256 timestamp,
        address signatory
    );

    event PoliceAcknowledged(
        uint256 indexed complaintId,
        bytes32 indexed officerBadgeHash,
        uint256 timestamp
    );

    event EscrowEscalated(
        uint256 indexed complaintId,
        uint256 timestamp
    );

    event PoliceNodeAuthorizationUpdated(
        address indexed policeNode,
        bool isAuthorized
    );

    // --- Custom Errors ---
    error InvalidComplaintId();
    error InvalidIncidentId();
    error InvalidEFIRHash();
    error EscrowAlreadyExists();
    error EscrowNotFound();
    error AlreadySigned();
    error AlreadyAcknowledged();
    error AlreadyEscalated();
    error DeadlineExceeded(uint256 current, uint256 deadline);
    error EscalationWindowNotReached(uint256 current, uint256 deadline);
    error PoliceAlreadyAcknowledged();
    error UnauthorizedSigner();
    error UnauthorizedPoliceNode();
    error InvalidSignature();

    constructor(address initialOwner) Ownable(initialOwner) {
        authorizedPoliceNodes[initialOwner] = true;
    }

    /**
     * @notice Initialize an e-FIR complaint escrow bound to the 72-hour BNSS §173 statutory deadline.
     * @param complaintId Unique identifier for this legal complaint.
     * @param incidentId Associated SOS incident ID.
     * @param efirHash Cryptographic digest of the e-FIR payload (zero cleartext PII).
     */
    function initEscrow(
        uint256 complaintId,
        uint256 incidentId,
        bytes32 efirHash
    ) external whenNotPaused nonReentrant returns (bool) {
        if (complaintId == 0) revert InvalidComplaintId();
        if (incidentId == 0) revert InvalidIncidentId();
        if (efirHash == bytes32(0)) revert InvalidEFIRHash();

        if (escrows[complaintId].signDeadline != 0) {
            revert EscrowAlreadyExists();
        }

        uint256 deadline = block.timestamp + STATUTORY_ESCALATION_SECONDS;

        escrows[complaintId] = EscrowState({
            incidentId: incidentId,
            signDeadline: deadline,
            isEscalated: false,
            isSigned: false
        });

        escrowMetadata[complaintId] = EscrowMetadata({
            victim: msg.sender,
            efirHash: efirHash,
            isAcknowledged: false,
            officerBadgeHash: bytes32(0),
            signedAt: 0,
            acknowledgedAt: 0,
            escalatedAt: 0
        });

        emit EscrowInitiated(complaintId, incidentId, efirHash, deadline, msg.sender);
        return true;
    }

    /**
     * @notice Records the victim's cryptographic signature / Aadhaar e-Sign on the e-FIR.
     * @param complaintId The complaint ID.
     * @param signature Optional ECDSA signature of (complaintId, efirHash). If empty, caller must be victim.
     */
    function recordVictimSignature(
        uint256 complaintId,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (bool) {
        EscrowState storage escrow = escrows[complaintId];
        if (escrow.signDeadline == 0) revert EscrowNotFound();
        if (escrow.isSigned) revert AlreadySigned();
        if (block.timestamp > escrow.signDeadline) {
            revert DeadlineExceeded(block.timestamp, escrow.signDeadline);
        }

        EscrowMetadata storage meta = escrowMetadata[complaintId];
        address signatory = msg.sender;

        if (signature.length > 0) {
            bytes32 messageDigest = keccak256(abi.encodePacked(complaintId, meta.efirHash));
            bytes32 ethSignedDigest = messageDigest.toEthSignedMessageHash();
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, signature);
            if (err != ECDSA.RecoverError.NoError || recovered == address(0)) {
                revert InvalidSignature();
            }
            if (meta.victim != address(0) && recovered != meta.victim && !authorizedPoliceNodes[recovered]) {
                revert UnauthorizedSigner();
            }
            signatory = recovered;
        } else {
            if (meta.victim != address(0) && msg.sender != meta.victim) {
                revert UnauthorizedSigner();
            }
        }

        escrow.isSigned = true;
        meta.signedAt = block.timestamp;

        emit VictimSignatureRecorded(complaintId, block.timestamp, signatory);
        return true;
    }

    /**
     * @notice Records police station acknowledgement/FIR registration.
     * @param complaintId The complaint ID.
     * @param officerBadgeHash Salted hash of Station House Officer (SHO) badge.
     */
    function recordPoliceAcknowledgement(
        uint256 complaintId,
        bytes32 officerBadgeHash
    ) external whenNotPaused nonReentrant returns (bool) {
        EscrowState storage escrow = escrows[complaintId];
        if (escrow.signDeadline == 0) revert EscrowNotFound();

        EscrowMetadata storage meta = escrowMetadata[complaintId];
        if (meta.isAcknowledged) revert AlreadyAcknowledged();

        if (!authorizedPoliceNodes[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedPoliceNode();
        }

        meta.isAcknowledged = true;
        meta.officerBadgeHash = officerBadgeHash;
        meta.acknowledgedAt = block.timestamp;

        emit PoliceAcknowledged(complaintId, officerBadgeHash, block.timestamp);
        return true;
    }

    /**
     * @notice Automatic BNSS Section 173(4) statutory escalation to the District Superintendent of Police (SP).
     * @dev Callable by anyone once 72 hours have elapsed without police registration.
     * @param complaintId The complaint ID.
     */
    function trigger72HrEscalation(
        uint256 complaintId
    ) external whenNotPaused nonReentrant returns (bool) {
        EscrowState storage escrow = escrows[complaintId];
        if (escrow.signDeadline == 0) revert EscrowNotFound();
        if (escrow.isEscalated) revert AlreadyEscalated();

        if (block.timestamp < escrow.signDeadline) {
            revert EscalationWindowNotReached(block.timestamp, escrow.signDeadline);
        }

        EscrowMetadata storage meta = escrowMetadata[complaintId];
        if (meta.isAcknowledged) {
            revert PoliceAlreadyAcknowledged();
        }

        escrow.isEscalated = true;
        meta.escalatedAt = block.timestamp;

        emit EscrowEscalated(complaintId, block.timestamp);
        return true;
    }

    /**
     * @notice Query whether an escrow has crossed the 48-hour NGO early-warning threshold.
     */
    function is48HrEarlyWarningReached(uint256 complaintId) external view returns (bool) {
        EscrowState storage escrow = escrows[complaintId];
        if (escrow.signDeadline == 0 || escrow.isEscalated || escrowMetadata[complaintId].isAcknowledged) {
            return false;
        }

        uint256 threshold = escrow.signDeadline - (STATUTORY_ESCALATION_SECONDS - NGO_EARLY_WARNING_SECONDS);
        return block.timestamp >= threshold;
    }

    /**
     * @notice Grant or revoke authorized police node status.
     */
    function setPoliceNodeAuthorization(address node, bool isAuthorized) external onlyOwner {
        authorizedPoliceNodes[node] = isAuthorized;
        emit PoliceNodeAuthorizationUpdated(node, isAuthorized);
    }

    /**
     * @notice Retrieve full escrow information.
     */
    function getEscrow(uint256 complaintId) external view returns (EscrowState memory, EscrowMetadata memory) {
        if (escrows[complaintId].signDeadline == 0) revert EscrowNotFound();
        return (escrows[complaintId], escrowMetadata[complaintId]);
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
