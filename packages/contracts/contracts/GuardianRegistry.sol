// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GuardianRegistry
 * @author She-Raksha Autonomous Engineering Team
 * @notice Polygon L2 registry managing opt-in community guardians, ephemeral geohash commitments,
 *         public key exchange for encrypted dispatch, and staking/slashing guarantees.
 * @dev Preserves guardian anonymity through ephemeral Poseidon/Keccak geohash commitments.
 *      Enforces DPDP zero-PII requirements (no cleartext names, mobile numbers, or exact coordinates).
 */
contract GuardianRegistry is Ownable, ReentrancyGuard, Pausable {
    enum GuardianStatus {
        UNREGISTERED,
        ACTIVE,
        SUSPENDED,
        SLASHED,
        DEREGISTERED
    }

    struct Guardian {
        bytes32 geohashCommitment; // Ephemeral salted geohash commitment
        bytes publicKey;          // Guardian's ECDH/secp256k1 public key for encrypted dispatch
        uint256 stakeAmount;      // Active staked amount in wei / POL
        uint256 registeredAt;     // Timestamp of initial registration
        uint256 lastHeartbeat;    // Timestamp of latest geohash commitment renewal
        GuardianStatus status;
    }

    /// @notice Minimum stake required to register as an active guardian
    uint256 public minStake;

    /// @notice Total active guardians currently on standby
    uint256 public activeGuardianCount;

    /// @notice Accumulated slashed stake pool
    uint256 public slashedPool;

    /// @notice guardianAddress => Guardian
    mapping(address => Guardian) public guardians;

    // --- Events ---
    event GuardianRegistered(
        address indexed guardian,
        bytes32 indexed geohashCommitment,
        uint256 stakeAmount,
        bytes publicKey
    );

    event GuardianCommitmentUpdated(
        address indexed guardian,
        bytes32 indexed newGeohashCommitment,
        uint256 timestamp
    );

    event GuardianSlashed(
        address indexed guardian,
        uint256 slashedAmount,
        string reasonCode
    );

    event GuardianSuspended(address indexed guardian);

    event GuardianReactivated(address indexed guardian);

    event GuardianDeregistered(
        address indexed guardian,
        uint256 refundedStake
    );

    event MinStakeUpdated(
        uint256 oldStake,
        uint256 newStake
    );

    event SlashedPoolWithdrawn(
        address indexed recipient,
        uint256 amount
    );

    // --- Custom Errors ---
    error InsufficientStake(uint256 provided, uint256 required);
    error InvalidGeohashCommitment();
    error InvalidPublicKey();
    error AlreadyRegistered();
    error GuardianIsSlashed();
    error OnlyActiveGuardian();
    error GuardianNotSlashable();
    error ZeroRecipientAddress();
    error NoFundsInPool();
    error TransferFailed();

    constructor(address initialOwner, uint256 initialMinStake) Ownable(initialOwner) {
        minStake = initialMinStake;
    }

    /**
     * @notice Register as an active community guardian by staking POL and committing an ephemeral geohash.
     * @param geohashCommitment Salted hash of current geohash cell.
     * @param publicKey Public key used for receiving end-to-end encrypted dispatch vectors.
     */
    function registerGuardian(
        bytes32 geohashCommitment,
        bytes calldata publicKey
    ) external payable whenNotPaused nonReentrant {
        if (msg.value < minStake) {
            revert InsufficientStake(msg.value, minStake);
        }
        if (geohashCommitment == bytes32(0)) revert InvalidGeohashCommitment();
        if (publicKey.length < 32 || publicKey.length > 128) revert InvalidPublicKey();

        Guardian storage g = guardians[msg.sender];
        if (g.status == GuardianStatus.ACTIVE) revert AlreadyRegistered();
        if (g.status == GuardianStatus.SLASHED) revert GuardianIsSlashed();

        g.geohashCommitment = geohashCommitment;
        g.publicKey = publicKey;
        g.stakeAmount = msg.value;
        g.registeredAt = block.timestamp;
        g.lastHeartbeat = block.timestamp;
        g.status = GuardianStatus.ACTIVE;

        unchecked {
            ++activeGuardianCount;
        }

        emit GuardianRegistered(
            msg.sender,
            geohashCommitment,
            msg.value,
            publicKey
        );
    }

    /**
     * @notice Periodic heartbeat to update ephemeral geohash commitment without re-staking.
     * @param newGeohashCommitment Refreshed ephemeral salted geohash.
     */
    function updateGeohashCommitment(
        bytes32 newGeohashCommitment
    ) external whenNotPaused {
        Guardian storage g = guardians[msg.sender];
        if (g.status != GuardianStatus.ACTIVE) revert OnlyActiveGuardian();
        if (newGeohashCommitment == bytes32(0)) revert InvalidGeohashCommitment();

        g.geohashCommitment = newGeohashCommitment;
        g.lastHeartbeat = block.timestamp;

        emit GuardianCommitmentUpdated(
            msg.sender,
            newGeohashCommitment,
            block.timestamp
        );
    }

    /**
     * @notice Slashes a malicious or delinquent guardian, confiscating stake to the slashed pool.
     * @param guardian Address of the offending guardian.
     * @param slashAmount Amount of stake to slash (up to full stake).
     * @param reasonCode Reason code for auditability (e.g., "FALSE_WITNESS_INTERCEPT").
     */
    function slashGuardian(
        address guardian,
        uint256 slashAmount,
        string calldata reasonCode
    ) external onlyOwner {
        Guardian storage g = guardians[guardian];
        if (g.status != GuardianStatus.ACTIVE && g.status != GuardianStatus.SUSPENDED) {
            revert GuardianNotSlashable();
        }

        uint256 penalty = slashAmount > g.stakeAmount ? g.stakeAmount : slashAmount;
        g.stakeAmount -= penalty;
        slashedPool += penalty;
        g.status = GuardianStatus.SLASHED;

        if (activeGuardianCount > 0) {
            unchecked {
                --activeGuardianCount;
            }
        }

        emit GuardianSlashed(guardian, penalty, reasonCode);
    }

    /**
     * @notice Suspend a guardian pending investigation.
     */
    function suspendGuardian(address guardian) external onlyOwner {
        Guardian storage g = guardians[guardian];
        if (g.status != GuardianStatus.ACTIVE) revert OnlyActiveGuardian();
        g.status = GuardianStatus.SUSPENDED;
        if (activeGuardianCount > 0) {
            unchecked {
                --activeGuardianCount;
            }
        }
        emit GuardianSuspended(guardian);
    }

    /**
     * @notice Reactivate a suspended guardian.
     */
    function reactivateGuardian(address guardian) external onlyOwner {
        Guardian storage g = guardians[guardian];
        if (g.status != GuardianStatus.SUSPENDED) revert GuardianNotSlashable();
        g.status = GuardianStatus.ACTIVE;
        unchecked {
            ++activeGuardianCount;
        }
        emit GuardianReactivated(guardian);
    }

    /**
     * @notice Voluntarily deregister and withdraw remaining active stake.
     */
    function withdrawStakeAndDeregister() external nonReentrant {
        Guardian storage g = guardians[msg.sender];
        if (g.status != GuardianStatus.ACTIVE) revert OnlyActiveGuardian();

        uint256 refund = g.stakeAmount;
        g.stakeAmount = 0;
        g.status = GuardianStatus.DEREGISTERED;

        if (activeGuardianCount > 0) {
            unchecked {
                --activeGuardianCount;
            }
        }

        (bool success, ) = payable(msg.sender).call{value: refund}("");
        if (!success) revert TransferFailed();

        emit GuardianDeregistered(msg.sender, refund);
    }

    /**
     * @notice Set minimum stake requirement for incoming guardians.
     */
    function setMinStake(uint256 newMinStake) external onlyOwner {
        uint256 old = minStake;
        minStake = newMinStake;
        emit MinStakeUpdated(old, newMinStake);
    }

    /**
     * @notice Withdraw accumulated slashed funds to DAO / treasury.
     */
    function withdrawSlashedPool(address payable recipient) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert ZeroRecipientAddress();
        uint256 pool = slashedPool;
        if (pool == 0) revert NoFundsInPool();

        slashedPool = 0;
        (bool success, ) = recipient.call{value: pool}("");
        if (!success) revert TransferFailed();

        emit SlashedPoolWithdrawn(recipient, pool);
    }

    /**
     * @notice Check whether a guardian is active.
     */
    function isGuardianActive(address guardian) external view returns (bool) {
        return guardians[guardian].status == GuardianStatus.ACTIVE;
    }

    /**
     * @notice Retrieve full guardian state.
     */
    function getGuardian(address guardian) external view returns (Guardian memory) {
        return guardians[guardian];
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
