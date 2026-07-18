// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title BalanceManager
/// @notice Escrowed internal balances for the Keystone Book.
///
/// Accounting model: every account has a `balanceOf[account][token]` (spendable) balance and
/// every token has a single `totalEscrowed[token]` pool (funds locked inside open orders, not
/// attributable to any one account while locked). `deposit`/`withdraw` are the only functions
/// that touch the real ERC-20 balance, so for every token the invariant
///
///     IERC20(token).balanceOf(address(this)) == sum(balanceOf[*][token]) + totalEscrowed[token]
///
/// holds after every call, by construction: `deposit`/`withdraw` change the real balance and a
/// spendable balance by the same amount; `lock`/`unlockTo` move value between spendable and the
/// escrow pool without touching the real balance. Only the Book may call `lock`/`unlockTo` — the
/// matching loop itself never makes an external token call, which is what keeps it
/// reentrancy-clean and gas-sane (PRD §Phase 1).
contract BalanceManager is Ownable {
    using SafeERC20 for IERC20;

    address public book;
    bool private _bookSet;

    mapping(address account => mapping(address token => uint256)) public balanceOf;
    mapping(address token => uint256) public totalEscrowed;

    event Deposited(address indexed account, address indexed token, uint256 amount);
    event Withdrawn(address indexed account, address indexed token, uint256 amount);
    event Locked(address indexed account, address indexed token, uint256 amount);
    event Unlocked(address indexed to, address indexed token, uint256 amount);
    event BookSet(address indexed book);

    error BookAlreadySet();
    error NotBook();
    error InsufficientBalance();

    constructor(address initialOwner) Ownable(initialOwner) {}

    modifier onlyBook() {
        if (msg.sender != book) revert NotBook();
        _;
    }

    /// @notice One-time wiring of the Book address. Deploy order is BalanceManager -> Book ->
    /// setBook(book). Irreversible, so "only the Book may adjust balances" holds for the life of
    /// the deployment — there is no admin backdoor to move user funds after this is called.
    function setBook(address book_) external onlyOwner {
        if (_bookSet) revert BookAlreadySet();
        book = book_;
        _bookSet = true;
        emit BookSet(book_);
    }

    /// @notice Deposit `amount` of `token` into the caller's spendable balance. Always available,
    /// even if every pair using `token` is paused.
    function deposit(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        balanceOf[msg.sender][token] += amount;
        emit Deposited(msg.sender, token, amount);
    }

    /// @notice Withdraw `amount` of `token` from the caller's spendable balance. Always
    /// available — withdrawals are never blocked by a pair pause (PRD §Phase 1 KeystoneBook
    /// Admin: "cancels/withdrawals always allowed").
    function withdraw(address token, uint256 amount) external {
        uint256 bal = balanceOf[msg.sender][token];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[msg.sender][token] = bal - amount;
        }
        IERC20(token).safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, token, amount);
    }

    /// @notice Move `amount` of `token` from `account`'s spendable balance into the escrow pool.
    /// Called by the Book when an order is placed, to reserve exactly what that order could ever
    /// need to pay out.
    function lock(address account, address token, uint256 amount) external onlyBook {
        uint256 bal = balanceOf[account][token];
        if (bal < amount) revert InsufficientBalance();
        unchecked {
            balanceOf[account][token] = bal - amount;
        }
        totalEscrowed[token] += amount;
        emit Locked(account, token, amount);
    }

    /// @notice Release `amount` of `token` out of the escrow pool into `to`'s spendable balance.
    /// Called by the Book on fills (paying a maker/taker/FeeCollector out of the counterparty's
    /// lock) and on cancels (refunding the owner's own remaining lock).
    function unlockTo(address to, address token, uint256 amount) external onlyBook {
        totalEscrowed[token] -= amount; // reverts on underflow if the Book ever over-releases
        balanceOf[to][token] += amount;
        emit Unlocked(to, token, amount);
    }
}
