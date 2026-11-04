// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.24;

import "../interfaces/IEntryPoint.sol";

/**
 * @title MockEntryPoint
 * @notice Mock ERC-4337 EntryPoint for testing Paymaster deposit accounting.
 */
contract MockEntryPoint is IEntryPoint {
    mapping(address => uint256) public balances;

    function depositTo(address account) external payable override {
        balances[account] += msg.value;
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external override {
        require(balances[msg.sender] >= withdrawAmount, "Insufficient balance");
        balances[msg.sender] -= withdrawAmount;
        (bool success, ) = withdrawAddress.call{value: withdrawAmount}("");
        require(success, "Withdraw failed");
    }

    function balanceOf(address account) external view override returns (uint256) {
        return balances[account];
    }

    function getBalanceOf(address account) external view returns (uint256) {
        return balances[account];
    }

    receive() external payable {}
}
