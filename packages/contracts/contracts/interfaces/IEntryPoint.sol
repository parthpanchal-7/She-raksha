// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "./UserOperation.sol";

/**
 * @title IEntryPoint
 * @notice Minimal ERC-4337 EntryPoint interface for Paymaster deposit and gas accounting.
 */
interface IEntryPoint {
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
    function balanceOf(address account) external view returns (uint256);
}
