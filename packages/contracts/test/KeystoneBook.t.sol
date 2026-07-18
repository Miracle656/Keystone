// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BookTestBase} from "./utils/BookTestBase.sol";
import {KeystoneBook} from "../src/KeystoneBook.sol";
import {PairRegistry} from "../src/PairRegistry.sol";

contract KeystoneBookTest is BookTestBase {
    uint256 internal constant PRICE = 1_000_000; // 1.0000

    function test_TickValidation_Reverts() public {
        _depositBase(alice, 10 * LOT);
        vm.prank(alice);
        vm.expectRevert(KeystoneBook.InvalidPrice.selector);
        book.placeLimit(pairId, false, PRICE + 1, LOT, 0, 0); // not a multiple of TICK
    }

    function test_LotValidation_Reverts() public {
        _depositBase(alice, 10 * LOT);
        vm.prank(alice);
        vm.expectRevert(KeystoneBook.InvalidQty.selector);
        book.placeLimit(pairId, false, PRICE, LOT + 1, 0, 0); // not a multiple of LOT
    }

    function test_PostOnly_RevertsIfWouldCross() public {
        _depositBase(alice, LOT);
        _placeAsk(alice, PRICE, LOT, 0, 0);

        _depositQuote(bob, _buyLock(PRICE, LOT));
        vm.prank(bob);
        vm.expectRevert(KeystoneBook.WouldCross.selector);
        book.placeLimit(pairId, true, PRICE, LOT, flagPostOnly, 0);
    }

    function test_IOC_PartialFill_RefundsRemainder() public {
        _depositBase(alice, LOT); // only 1 lot resting
        _placeAsk(alice, PRICE, LOT, 0, 0);

        uint256 qty = 2 * LOT; // wants 2, only 1 available
        uint256 lockNeeded = _buyLock(PRICE, qty);
        _depositQuote(bob, lockNeeded);

        vm.prank(bob);
        (uint256 orderId, uint256 filled) = book.placeLimit(pairId, true, PRICE, qty, flagIoc, 0);

        assertEq(filled, LOT, "should fill exactly the resting 1 lot");
        assertFalse(book.getOrder(orderId).active, "IOC remainder must not rest");
        assertEq(book.bestBid(pairId), 0, "nothing should rest on the bid side");

        // Bob should have been refunded the escrow for the unfilled lot, keeping only what the
        // filled lot actually cost (notional + taker fee, no maker-fee involvement here since
        // Bob is the sole taker against Alice's resting ask).
        uint256 expectedCost = _buyLock(PRICE, LOT); // cost of exactly the filled portion
        assertEq(balanceManager.balanceOf(bob, address(quote)), lockNeeded - expectedCost, "unfilled escrow must be refunded exactly");
    }

    function test_MaxMatches_BoundsFillsPerCall() public {
        // MAX_MATCHES asks at MAX_MATCHES distinct price levels, plus one more beyond the bound.
        // Each new price is the worst (highest) ask so far, so the prior iteration's price is
        // always the correct adjacent hint — a 0-step insertion regardless of how many levels
        // pile up (unlike hint=0, which would keep walking from the unchanged best price and
        // incidentally hit MAX_HINT_SCAN long before this test reaches what it's meant to check).
        uint256 n = MAX_MATCHES + 1;
        uint256 hint = 0;
        for (uint256 i = 0; i < n; i++) {
            _depositBase(alice, LOT);
            _placeAsk(alice, PRICE + i * TICK, LOT, 0, hint);
            hint = PRICE + i * TICK;
        }

        uint256 qty = n * LOT;
        _depositQuote(bob, _buyLock(PRICE + n * TICK, qty)); // fund generously above worst price
        vm.prank(bob);
        (, uint256 filled) = book.placeLimit(pairId, true, PRICE + n * TICK, qty, 0, 0);

        assertEq(filled, MAX_MATCHES * LOT, "must stop at exactly MAX_MATCHES fills");
        assertEq(book.bestAsk(pairId), PRICE + (n - 1) * TICK, "the last (unreached) ask level must remain fully resting");
        assertTrue(book.bestBid(pairId) != 0, "bob's unfilled remainder must rest, not vanish");
    }

    function test_HintTooFar_Reverts() public {
        // Build up `levels` ask price levels, each time hinting at the immediately preceding
        // (adjacent) price so setup itself never scans more than one step.
        uint256 levels = MAX_HINT_SCAN + 5;
        uint256 hint = 0;
        for (uint256 i = 1; i <= levels; i++) {
            _depositBase(alice, LOT);
            _placeAsk(alice, PRICE + i * TICK, LOT, 0, hint);
            hint = PRICE + i * TICK;
        }
        // Now insert a brand-new lowest level, but deliberately hint at the far (highest) end —
        // walking from there to the front requires far more than MAX_HINT_SCAN steps.
        _depositBase(alice, LOT);
        vm.prank(alice);
        vm.expectRevert(KeystoneBook.HintTooFar.selector);
        book.placeLimit(pairId, false, PRICE, LOT, 0, PRICE + levels * TICK);
    }

    function test_Cancel_RefundsExactly() public {
        uint256 lockNeeded = _buyLock(PRICE, LOT);
        _depositQuote(bob, lockNeeded);
        uint256 orderId = _placeBid(bob, PRICE, LOT, 0, 0);

        assertEq(balanceManager.balanceOf(bob, address(quote)), 0, "full amount should be escrowed");

        vm.prank(bob);
        book.cancel(orderId);

        assertEq(balanceManager.balanceOf(bob, address(quote)), lockNeeded, "cancel must refund to the exact wei");
        assertEq(book.bestBid(pairId), 0);
        assertFalse(book.getOrder(orderId).active);
    }

    function test_Pause_BlocksNewOrders_ButNotCancel() public {
        uint256 lockNeeded = _buyLock(PRICE, LOT);
        _depositQuote(bob, lockNeeded);
        uint256 orderId = _placeBid(bob, PRICE, LOT, 0, 0);

        vm.prank(admin);
        pairRegistry.setActive(pairId, false);

        _depositQuote(carol, lockNeeded);
        vm.prank(carol);
        vm.expectRevert(KeystoneBook.PairPaused.selector);
        book.placeLimit(pairId, true, PRICE, LOT, 0, 0);

        // cancel must still work while paused
        vm.prank(bob);
        book.cancel(orderId);
        assertEq(balanceManager.balanceOf(bob, address(quote)), lockNeeded);
    }

    function test_FIFO_PriceTimePriority() public {
        _depositBase(alice, LOT);
        uint256 aliceOrder = _placeAsk(alice, PRICE, LOT, 0, 0); // placed first

        _depositBase(carol, LOT);
        uint256 carolOrder = _placeAsk(carol, PRICE, LOT, 0, 0); // placed second, same price level

        _depositQuote(bob, _buyLock(PRICE, LOT));
        vm.prank(bob);
        book.placeLimit(pairId, true, PRICE, LOT, 0, 0);

        assertEq(book.getOrder(aliceOrder).remaining, 0, "earlier order at the same price must fill first");
        assertEq(book.getOrder(carolOrder).remaining, LOT, "later order must be untouched");
    }

    /// @notice Deterministic fee/escrow settlement, computed by hand in DECISIONS.md /
    /// KeystoneBook's NatSpec derivation — every amount here is exact, not approximate.
    function test_FeeRounding_ExactSettlement() public {
        _depositBase(alice, 2 * LOT);
        uint256 aliceOrder = _placeAsk(alice, PRICE, 2 * LOT, 0, 0);

        uint256 lockNeeded = _buyLock(PRICE, LOT); // = 1_001_000 (1.0 notional + 0.10% taker fee)
        assertEq(lockNeeded, 1_001_000, "sanity-check the hand-derived lock amount");
        _depositQuote(bob, lockNeeded);

        vm.prank(bob);
        book.placeLimit(pairId, true, PRICE, LOT, 0, 0);

        assertEq(balanceManager.balanceOf(alice, address(base_)), 0, "alice's base was fully escrowed at placement");
        assertEq(balanceManager.balanceOf(alice, address(quote)), 1_000_200, "seller receives notional + maker rebate");
        assertEq(feeCollector.accrued(address(quote)), 800, "net protocol fee: 1000 taker - 200 maker rebate");
        assertEq(balanceManager.balanceOf(bob, address(quote)), 0, "buyer's lock exactly covered notional + taker fee, no refund");
        assertEq(balanceManager.balanceOf(bob, address(base_)), LOT, "buyer receives the full filled base qty");
        assertEq(book.getOrder(aliceOrder).remaining, LOT, "half of alice's ask remains resting");
    }
}
