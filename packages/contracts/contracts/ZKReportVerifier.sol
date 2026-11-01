// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IGroth16Verifier.sol";

/**
 * @title ZKReportVerifier
 * @author She-Raksha Autonomous Engineering Team
 * @notice Zero-Knowledge verification gateway for anonymous bystander incident reporting.
 * @dev Enforces Groth16 zk-SNARK verification and Poseidon nullifier tracking to eliminate Sybil
 *      reports while mathematically shielding witness identity and exact GPS coordinates.
 */
contract ZKReportVerifier is Ownable, Pausable {
    /// @notice SnarkJS Groth16 pairing verifier contract address
    IGroth16Verifier public groth16Verifier;

    /// @notice Tracks spent Poseidon nullifiers: Poseidon(IdentitySecret, IncidentID) => isSpent
    mapping(bytes32 => bool) public nullifierHashes;

    /// @notice Total count of verified anonymous bystander reports
    uint256 public totalReportsLogged;

    // --- Events ---
    event AnonymousReportLogged(
        bytes32 indexed nullifier,
        bytes32 indexed geohashBucket,
        uint256 timestampBucket
    );

    event Groth16VerifierUpdated(
        address indexed oldVerifier,
        address indexed newVerifier
    );

    // --- Custom Errors ---
    error DuplicateNullifier(bytes32 nullifier);
    error InvalidProof();
    error VerifierNotConfigured();
    error ZeroVerifierAddress();

    constructor(address initialOwner, address _groth16Verifier) Ownable(initialOwner) {
        if (_groth16Verifier != address(0)) {
            groth16Verifier = IGroth16Verifier(_groth16Verifier);
        }
    }

    /**
     * @notice Verify and record an anonymous bystander report using Groth16 zk-SNARK (4-input compatibility).
     * @param a Groth16 proof parameter pi_a
     * @param b Groth16 proof parameter pi_b
     * @param c Groth16 proof parameter pi_c
     * @param input Public inputs: [poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour]
     */
    function submitAnonymousReport(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[4] calldata input
    ) external whenNotPaused returns (bool) {
        return _processReport4(a, b, c, input);
    }

    /**
     * @notice Verify and record an anonymous bystander report using AnonymousBystanderReportVerifier_v2 zk-SNARK (6 public inputs).
     * @param a Groth16 proof parameter pi_a
     * @param b Groth16 proof parameter pi_b
     * @param c Groth16 proof parameter pi_c
     * @param input Public inputs: [poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour, identityMerkleRoot, incidentId]
     */
    function submitAnonymousReport(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[6] calldata input
    ) external whenNotPaused returns (bool) {
        return _processReport6(a, b, c, input);
    }

    /**
     * @notice Dedicated v2 endpoint for 6-input anonymous reports (avoids ABI client overloading ambiguity).
     * @param a Groth16 proof parameter pi_a
     * @param b Groth16 proof parameter pi_b
     * @param c Groth16 proof parameter pi_c
     * @param input Public inputs: [poseidonNullifierHash, geohashBucket, incidentCategoryCode, timestampBucketEpochHour, identityMerkleRoot, incidentId]
     */
    function submitAnonymousReportV2(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[6] calldata input
    ) external whenNotPaused returns (bool) {
        return _processReport6(a, b, c, input);
    }

    function _processReport4(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[4] calldata input
    ) internal returns (bool) {
        bytes32 nullifier = bytes32(input[0]);

        if (nullifierHashes[nullifier]) {
            revert DuplicateNullifier(nullifier);
        }

        if (address(groth16Verifier) == address(0)) {
            revert VerifierNotConfigured();
        }

        bool isValid = groth16Verifier.verifyProof(a, b, c, input);
        if (!isValid) {
            revert InvalidProof();
        }

        nullifierHashes[nullifier] = true;
        unchecked {
            ++totalReportsLogged;
        }

        emit AnonymousReportLogged(
            nullifier,
            bytes32(input[1]),
            input[3]
        );

        return true;
    }

    function _processReport6(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[6] calldata input
    ) internal returns (bool) {
        bytes32 nullifier = bytes32(input[0]);

        if (nullifierHashes[nullifier]) {
            revert DuplicateNullifier(nullifier);
        }

        if (address(groth16Verifier) == address(0)) {
            revert VerifierNotConfigured();
        }

        bool isValid = groth16Verifier.verifyProof(a, b, c, input);
        if (!isValid) {
            revert InvalidProof();
        }

        nullifierHashes[nullifier] = true;
        unchecked {
            ++totalReportsLogged;
        }

        emit AnonymousReportLogged(
            nullifier,
            bytes32(input[1]),
            input[3]
        );

        return true;
    }

    /**
     * @notice Check whether a Poseidon nullifier has already been spent.
     */
    function isNullifierSpent(bytes32 nullifier) external view returns (bool) {
        return nullifierHashes[nullifier];
    }

    /**
     * @notice Update the underlying Groth16 pairing verifier.
     */
    function setGroth16Verifier(address newVerifier) external onlyOwner {
        if (newVerifier == address(0)) revert ZeroVerifierAddress();
        address old = address(groth16Verifier);
        groth16Verifier = IGroth16Verifier(newVerifier);
        emit Groth16VerifierUpdated(old, newVerifier);
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
