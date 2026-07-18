// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {BookTestBase} from "../utils/BookTestBase.sol";
import {KeystoneBookHandler} from "./KeystoneBookHandler.sol";

/// @notice Core safety properties that must hold after *any* sequence of deposits, withdrawals,
/// places, and cancels — not just the handful of scenarios in KeystoneBook.t.sol.
contract KeystoneBookInvariantTest is StdInvariant, BookTestBase {
    KeystoneBookHandler internal handler;

    function setUp() public override {
        super.setUp();
        handler = new KeystoneBookHandler(balanceManager, book, base_, quote, pairId, TICK, LOT);
        targetContract(address(handler));
    }

    /// @notice BalanceManager's real ERC-20 balance must always equal exactly net deposits — the
    /// only two functions that touch the real token are `deposit`/`withdraw`; every other
    /// internal `lock`/`unlockTo` transfer nets to zero. If this ever drifts, some fill/refund
    /// path is manufacturing or destroying value instead of just moving it.
    function invariant_FundConservation_Quote() public view {
        assertEq(
            quote.balanceOf(address(balanceManager)),
            handler.totalDeposited(address(quote)) - handler.totalWithdrawn(address(quote)),
            "quote: BalanceManager's real balance must equal net deposits"
        );
    }

    function invariant_FundConservation_Base() public view {
        assertEq(
            base_.balanceOf(address(balanceManager)),
            handler.totalDeposited(address(base_)) - handler.totalWithdrawn(address(base_)),
            "base: BalanceManager's real balance must equal net deposits"
        );
    }

    /// @notice The escrow pool can never exceed what's actually held — a direct sanity check
    /// that's implied by fund conservation but cheap to assert independently.
    function invariant_EscrowNeverExceedsRealBalance() public view {
        assertLe(balanceManager.totalEscrowed(address(quote)), quote.balanceOf(address(balanceManager)));
        assertLe(balanceManager.totalEscrowed(address(base_)), base_.balanceOf(address(balanceManager)));
    }

    /// @notice The book must never rest a crossed bid/ask pair — if both sides are non-empty,
    /// the best bid must be strictly below the best ask (equal prices should always have
    /// matched immediately, never both rested).
    function invariant_BookNeverCrossed() public view {
        uint256 bid = book.bestBid(pairId);
        uint256 ask = book.bestAsk(pairId);
        if (bid != 0 && ask != 0) {
            assertLt(bid, ask, "book must never rest crossed: best bid must be strictly below best ask");
        }
    }

    /// @notice Visible only in -vvv output: confirms the fuzzer is actually exercising
    /// place/cancel, not just deposits (a silent 0-success run would make every other invariant
    /// here vacuously true and worthless).
    function invariant_CallSummary() public {
        emit log_named_uint("place attempts", handler.ghost_placeAttempts());
        emit log_named_uint("place successes", handler.ghost_placeSuccesses());
        emit log_named_uint("cancel successes", handler.ghost_cancelSuccesses());
        emit log_named_uint("open orders", handler.openOrderCount());
    }
}
