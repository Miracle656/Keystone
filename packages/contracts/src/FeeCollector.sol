// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BalanceManager} from "./BalanceManager.sol";

/// @title FeeCollector
/// @notice Sink for protocol fees. KeystoneBook routes the net fee on every fill straight into
/// this contract's BalanceManager account (see BalanceManager.unlockTo); this contract just adds
/// an owner-gated path to pull that internal balance out into a real ERC-20 balance and sweep it
/// to a treasury.
contract FeeCollector is Ownable {
    using SafeERC20 for IERC20;

    BalanceManager public immutable BALANCE_MANAGER;

    constructor(address owner_, address balanceManager_) Ownable(owner_) {
        BALANCE_MANAGER = BalanceManager(balanceManager_);
    }

    /// @notice Pull `amount` of `token` out of this contract's BalanceManager ledger balance into
    /// this contract's real ERC-20 balance.
    function collect(address token, uint256 amount) external onlyOwner {
        BALANCE_MANAGER.withdraw(token, amount);
    }

    /// @notice Sweep this contract's real ERC-20 balance to `to` (a treasury address).
    function sweep(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(to, amount);
    }

    /// @notice Accrued-but-not-yet-collected protocol fee for `token`.
    function accrued(address token) external view returns (uint256) {
        return BALANCE_MANAGER.balanceOf(address(this), token);
    }
}
