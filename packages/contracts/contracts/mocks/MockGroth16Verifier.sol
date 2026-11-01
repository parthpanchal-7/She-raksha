// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "../interfaces/IGroth16Verifier.sol";

/**
 * @title MockGroth16Verifier
 * @notice Mock verifier for testing ZKReportVerifier under success and failure modes.
 */
contract MockGroth16Verifier is IGroth16Verifier {
    bool public shouldPass = true;

    function setShouldPass(bool _shouldPass) external {
        shouldPass = _shouldPass;
    }

    function verifyProof(
        uint[2] calldata,
        uint[2][2] calldata,
        uint[2] calldata,
        uint[4] calldata
    ) external view override returns (bool) {
        return shouldPass;
    }
}
