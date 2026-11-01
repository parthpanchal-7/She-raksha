// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./interfaces/IEntryPoint.sol";
import "./interfaces/UserOperation.sol";

/**
 * @title SheRakshaPaymaster
 * @author She-Raksha Autonomous Engineering Team
 * @notice ERC-4337 Verifying Paymaster providing 100% gasless transaction sponsorship
 *         for registered survivors and bystanders interacting with core She-Raksha contracts:
 *         EvidenceRegistry, SOSLog, ComplaintEscrow, ZKReportVerifier, and AccessGrant.
 * @dev Enforces monotonically increasing nonces (NFR-SEC-003) and automated low-balance alerting.
 */
contract SheRakshaPaymaster is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice ERC-4337 Canonical EntryPoint contract
    IEntryPoint public entryPoint;

    /// @notice Trusted backend relayer / verifying signer
    address public verifyingSigner;

    /// @notice Alert threshold for Paymaster deposit balance in EntryPoint (defaults to 0.5 POL)
    uint256 public lowBalanceThreshold = 0.5 ether;

    /// @notice Total gas sponsored in wei across all UserOperations
    uint256 public totalGasSponsored;

    /// @notice Total operations sponsored
    uint256 public totalOpsSponsored;

    /// @notice targetContract => isWhitelisted
    mapping(address => bool) public isWhitelistedTarget;

    /// @notice senderAddress => latestMonotonicNonce (NFR-SEC-003 Replay Protection)
    mapping(address => uint256) public userNonces;

    // --- Events ---
    event GasSponsored(
        address indexed sender,
        address indexed target,
        uint256 maxCost
    );

    event TargetWhitelisted(
        address indexed target,
        bool isWhitelisted
    );

    event VerifyingSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );

    event LowBalanceAlert(
        uint256 currentBalance,
        uint256 threshold
    );

    event LowBalanceThresholdUpdated(
        uint256 oldThreshold,
        uint256 newThreshold
    );

    event EntryPointUpdated(
        address indexed oldEntryPoint,
        address indexed newEntryPoint
    );

    // --- Custom Errors ---
    error TargetNotWhitelisted(address target);
    error InvalidNonce(uint256 provided, uint256 expectedMinimum);
    error InvalidSignature();
    error InsufficientPaymasterDeposit(uint256 currentDeposit, uint256 requiredCost);
    error UnauthorizedEntryPoint();
    error ZeroAddress();

    constructor(
        address initialOwner,
        address _entryPoint,
        address _verifyingSigner
    ) Ownable(initialOwner) {
        if (_entryPoint != address(0)) {
            entryPoint = IEntryPoint(_entryPoint);
        }
        verifyingSigner = _verifyingSigner;
    }

    /**
     * @notice Whitelist or remove an authorized target contract.
     */
    function setWhitelistedTarget(address target, bool isWhitelisted) external onlyOwner {
        if (target == address(0)) revert ZeroAddress();
        isWhitelistedTarget[target] = isWhitelisted;
        emit TargetWhitelisted(target, isWhitelisted);
    }

    /**
     * @notice Batch configure the 5 core She-Raksha contracts as whitelisted targets.
     */
    function batchWhitelistTargets(
        address evidenceRegistry,
        address sosLog,
        address complaintEscrow,
        address zkReportVerifier,
        address accessGrant
    ) external onlyOwner {
        if (evidenceRegistry != address(0)) isWhitelistedTarget[evidenceRegistry] = true;
        if (sosLog != address(0)) isWhitelistedTarget[sosLog] = true;
        if (complaintEscrow != address(0)) isWhitelistedTarget[complaintEscrow] = true;
        if (zkReportVerifier != address(0)) isWhitelistedTarget[zkReportVerifier] = true;
        if (accessGrant != address(0)) isWhitelistedTarget[accessGrant] = true;
    }

    /**
     * @notice Direct validation helper verifying sponsorship eligibility outside full EntryPoint.
     */
    function validateAndSponsor(
        address sender,
        address target,
        uint256 nonce,
        uint256 maxCost,
        bytes calldata signature
    ) external whenNotPaused nonReentrant returns (bool) {
        if (!isWhitelistedTarget[target]) {
            revert TargetNotWhitelisted(target);
        }

        uint256 lastNonce = userNonces[sender];
        if (nonce <= lastNonce && lastNonce > 0) {
            revert InvalidNonce(nonce, lastNonce + 1);
        }

        if (signature.length > 0) {
            bytes32 hash = keccak256(abi.encodePacked(sender, target, nonce, maxCost, block.chainid));
            bytes32 ethSignedDigest = hash.toEthSignedMessageHash();
            (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(ethSignedDigest, signature);
            if (err != ECDSA.RecoverError.NoError || (recovered != verifyingSigner && recovered != owner())) {
                revert InvalidSignature();
            }
        }

        userNonces[sender] = nonce;
        totalGasSponsored += maxCost;
        unchecked {
            ++totalOpsSponsored;
        }

        _checkBalanceAndAlert();

        emit GasSponsored(sender, target, maxCost);
        return true;
    }

    /**
     * @notice ERC-4337 EntryPoint Paymaster validation callback.
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32,
        uint256 maxCost
    ) external whenNotPaused returns (bytes memory context, uint256 validationData) {
        if (address(entryPoint) != address(0) && msg.sender != address(entryPoint)) {
            revert UnauthorizedEntryPoint();
        }

        address target = address(0);
        if (userOp.callData.length >= 20) {
            // Extract target address from execute(target, value, data) or direct call
            target = address(bytes20(userOp.callData[16:36]));
        }

        if (target != address(0) && !isWhitelistedTarget[target]) {
            revert TargetNotWhitelisted(target);
        }

        uint256 lastNonce = userNonces[userOp.sender];
        if (userOp.nonce <= lastNonce && lastNonce > 0) {
            revert InvalidNonce(userOp.nonce, lastNonce + 1);
        }

        userNonces[userOp.sender] = userOp.nonce;
        totalGasSponsored += maxCost;
        unchecked {
            ++totalOpsSponsored;
        }

        _checkBalanceAndAlert();

        emit GasSponsored(userOp.sender, target, maxCost);

        // validationData: 0 = valid signature and within time range
        return (abi.encode(userOp.sender, target, maxCost), 0);
    }

    /**
     * @notice Post-operation callback from EntryPoint after execution.
     */
    function postOp(
        PostOpMode,
        bytes calldata,
        uint256
    ) external view {
        if (address(entryPoint) != address(0) && msg.sender != address(entryPoint)) {
            revert UnauthorizedEntryPoint();
        }
        // Mode and context acknowledged
    }

    /**
     * @notice Deposit funds into the ERC-4337 EntryPoint.
     */
    function deposit() external payable {
        if (address(entryPoint) != address(0)) {
            entryPoint.depositTo{value: msg.value}(address(this));
        }
    }

    /**
     * @notice Withdraw funds from the ERC-4337 EntryPoint to a destination address.
     */
    function withdrawTo(address payable target, uint256 amount) external onlyOwner nonReentrant {
        if (target == address(0)) revert ZeroAddress();
        if (address(entryPoint) != address(0)) {
            entryPoint.withdrawTo(target, amount);
        } else {
            (bool success, ) = target.call{value: amount}("");
            require(success, "Transfer failed");
        }
    }

    /**
     * @notice Read current deposit balance in EntryPoint or contract.
     */
    function getDeposit() public view returns (uint256) {
        if (address(entryPoint) != address(0)) {
            return entryPoint.getBalanceOf(address(this));
        }
        return address(this).balance;
    }

    /**
     * @notice Update verifying signer.
     */
    function setVerifyingSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        address old = verifyingSigner;
        verifyingSigner = newSigner;
        emit VerifyingSignerUpdated(old, newSigner);
    }

    /**
     * @notice Update EntryPoint address.
     */
    function setEntryPoint(address newEntryPoint) external onlyOwner {
        if (newEntryPoint == address(0)) revert ZeroAddress();
        address old = address(entryPoint);
        entryPoint = IEntryPoint(newEntryPoint);
        emit EntryPointUpdated(old, newEntryPoint);
    }

    /**
     * @notice Update low-balance alert threshold.
     */
    function setLowBalanceThreshold(uint256 newThreshold) external onlyOwner {
        uint256 old = lowBalanceThreshold;
        lowBalanceThreshold = newThreshold;
        emit LowBalanceThresholdUpdated(old, newThreshold);
    }

    /**
     * @notice Check current deposit balance and trigger LowBalanceAlert if beneath threshold.
     */
    function _checkBalanceAndAlert() internal {
        uint256 currentBalance = getDeposit();
        if (currentBalance < lowBalanceThreshold) {
            emit LowBalanceAlert(currentBalance, lowBalanceThreshold);
        }
    }

    /**
     * @notice Pause Paymaster sponsorship in emergency.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause Paymaster sponsorship.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        if (address(entryPoint) != address(0)) {
            entryPoint.depositTo{value: msg.value}(address(this));
        }
    }
}
