// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AccessGrant
 * @author She-Raksha Autonomous Engineering Team
 * @notice Time-bound, revocable cryptographic delegation registry governing decryption access
 *         to client-side AES-256-GCM evidence vaults pinned to IPFS/Filecoin.
 * @dev Enforces survivor sovereignty and DPDP Act 2023 consent withdrawal.
 */
contract AccessGrant is Ownable, ReentrancyGuard, Pausable {
    enum GranteeRole {
        LAW_ENFORCEMENT,
        NGO_CASEWORKER,
        JUDICIAL_OFFICER,
        LEGAL_REPRESENTATIVE
    }

    struct Grant {
        bytes32 vaultCIDHash;
        address grantor;
        address grantee;
        bytes encryptedKeyEnvelope;
        uint256 validUntil;
        GranteeRole role;
        bool isRevoked;
        uint256 grantedAt;
    }

    /// @notice Maximum allowed delegation window (e.g., 90 days = 7,776,000 seconds)
    uint256 public constant MAX_GRANT_DURATION_SECONDS = 7776000;

    /// @notice grantId => Grant
    mapping(bytes32 => Grant) public grants;

    /// @notice Total active or recorded grants
    uint256 public totalGrantsCount;

    // --- Events ---
    event AccessGranted(
        bytes32 indexed grantId,
        bytes32 indexed vaultCIDHash,
        address indexed grantor,
        address grantee,
        GranteeRole role,
        uint256 validUntil
    );

    event AccessRevoked(
        bytes32 indexed grantId,
        address indexed revoker,
        uint256 timestamp
    );

    // --- Custom Errors ---
    error InvalidVaultHash();
    error InvalidGrantee();
    error InvalidEnvelope();
    error InvalidDuration();
    error GrantNotFound();
    error AlreadyRevoked();
    error UnauthorizedRevoker();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Delegates time-bound decryption access to a Station House Officer (SHO) or Law Enforcement.
     */
    function grantLawEnforcement(
        bytes32 vaultCIDHash,
        address officer,
        bytes calldata encryptedKeyEnvelope,
        uint256 durationSeconds
    ) external returns (bytes32) {
        return _createGrant(vaultCIDHash, officer, GranteeRole.LAW_ENFORCEMENT, encryptedKeyEnvelope, durationSeconds);
    }

    /**
     * @notice Delegates time-bound decryption access to an accredited legal aid NGO caseworker.
     */
    function grantNGOCaseworker(
        bytes32 vaultCIDHash,
        address caseworker,
        bytes calldata encryptedKeyEnvelope,
        uint256 durationSeconds
    ) external returns (bytes32) {
        return _createGrant(vaultCIDHash, caseworker, GranteeRole.NGO_CASEWORKER, encryptedKeyEnvelope, durationSeconds);
    }

    /**
     * @notice General access grant method.
     */
    function grantAccess(
        bytes32 vaultCIDHash,
        address grantee,
        GranteeRole role,
        bytes calldata encryptedKeyEnvelope,
        uint256 durationSeconds
    ) external returns (bytes32) {
        return _createGrant(vaultCIDHash, grantee, role, encryptedKeyEnvelope, durationSeconds);
    }

    /**
     * @notice Revoke a cryptographic access grant instantly (DPDP Act right to erasure/withdrawal).
     * @param grantId The grant ID to revoke.
     */
    function revokeAccess(bytes32 grantId) external whenNotPaused returns (bool) {
        Grant storage g = grants[grantId];
        if (g.grantedAt == 0) revert GrantNotFound();
        if (g.isRevoked) revert AlreadyRevoked();

        if (msg.sender != g.grantor && msg.sender != owner()) {
            revert UnauthorizedRevoker();
        }

        g.isRevoked = true;
        emit AccessRevoked(grantId, msg.sender, block.timestamp);
        return true;
    }

    /**
     * @notice Verifies whether a claimant has active, non-expired, and non-revoked decryption authority.
     */
    function hasValidAccess(bytes32 grantId, address claimant) external view returns (bool) {
        Grant memory g = grants[grantId];
        if (g.grantedAt == 0) return false;
        if (g.isRevoked) return false;
        if (g.grantee != claimant) return false;
        if (block.timestamp > g.validUntil) return false;
        return true;
    }

    /**
     * @notice Retrieve full grant details.
     */
    function getGrant(bytes32 grantId) external view returns (Grant memory) {
        if (grants[grantId].grantedAt == 0) revert GrantNotFound();
        return grants[grantId];
    }

    /**
     * @dev Internal grant constructor.
     */
    function _createGrant(
        bytes32 vaultCIDHash,
        address grantee,
        GranteeRole role,
        bytes calldata encryptedKeyEnvelope,
        uint256 durationSeconds
    ) internal whenNotPaused nonReentrant returns (bytes32) {
        if (vaultCIDHash == bytes32(0)) revert InvalidVaultHash();
        if (grantee == address(0)) revert InvalidGrantee();
        if (encryptedKeyEnvelope.length == 0 || encryptedKeyEnvelope.length > 1024) revert InvalidEnvelope();
        if (durationSeconds == 0 || durationSeconds > MAX_GRANT_DURATION_SECONDS) revert InvalidDuration();

        uint256 validUntil = block.timestamp + durationSeconds;
        bytes32 grantId = keccak256(
            abi.encodePacked(vaultCIDHash, msg.sender, grantee, block.timestamp, totalGrantsCount)
        );

        grants[grantId] = Grant({
            vaultCIDHash: vaultCIDHash,
            grantor: msg.sender,
            grantee: grantee,
            encryptedKeyEnvelope: encryptedKeyEnvelope,
            validUntil: validUntil,
            role: role,
            isRevoked: false,
            grantedAt: block.timestamp
        });

        unchecked {
            ++totalGrantsCount;
        }

        emit AccessGranted(grantId, vaultCIDHash, msg.sender, grantee, role, validUntil);
        return grantId;
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
