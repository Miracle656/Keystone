// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BookTestBase} from "./utils/BookTestBase.sol";
import {KeystoneReserve} from "../src/KeystoneReserve.sol";
import {MockOracle} from "../src/MockOracle.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";

contract KeystoneReserveTest is BookTestBase {
    uint256 internal constant PRICE = 1_000_000; // 1.0000
    uint256 internal constant MID_1E18 = 1e18; // oracle mid, 1:1

    MockOracle internal oracle;
    KeystoneReserve internal reserve;
    address internal keeper = makeAddr("keeper");
    address internal depositor = makeAddr("depositor");

    function setUp() public override {
        super.setUp();
        oracle = new MockOracle(admin);
        vm.prank(admin);
        oracle.setMid(address(base_), address(quote), MID_1E18);

        reserve = new KeystoneReserve(
            quote,
            address(base_),
            address(book),
            address(balanceManager),
            address(oracle),
            pairId,
            admin,
            keeper,
            500, // maxSpreadBps: 5%
            3000, // maxInventorySkewBps: block once one side exceeds 80% of NAV (50% + 30%)
            10 * LOT // maxOrderSize
        );
    }

    function _fundDepositor(uint256 amount) internal {
        quote.mint(depositor, amount);
        vm.startPrank(depositor);
        quote.approve(address(reserve), amount);
        reserve.deposit(amount, depositor);
        vm.stopPrank();
    }

    function test_Deposit_MintsSharesAtOneToOne() public {
        _fundDepositor(100 * LOT);
        assertEq(reserve.balanceOf(depositor), 100 * LOT, "first deposit should mint 1:1 shares");
        assertEq(reserve.totalAssets(), 100 * LOT);
    }

    function test_NonKeeper_CannotPlaceQuote() public {
        _fundDepositor(100 * LOT);
        vm.prank(depositor);
        vm.expectRevert();
        reserve.placeQuote(false, PRICE, LOT, 0);
    }

    function test_Keeper_OrderTooLarge_Reverts() public {
        _fundDepositor(100 * LOT);
        vm.prank(keeper);
        vm.expectRevert(KeystoneReserve.OrderTooLarge.selector);
        reserve.placeQuote(false, PRICE, 11 * LOT, 0); // maxOrderSize is 10*LOT
    }

    function test_Keeper_PriceOutOfBounds_Reverts() public {
        _fundDepositor(100 * LOT);
        // mid is 1.0000 (1e18 scaled -> 1_000_000 in book-price scale), maxSpreadBps=500 (5%),
        // so the widest allowed ask is 1.05. Quote far beyond that must revert.
        uint256 tooFar = 1_200_000; // 1.20, 20% away
        vm.prank(keeper);
        vm.expectRevert(KeystoneReserve.PriceOutOfBounds.selector);
        reserve.placeQuote(false, tooFar, LOT, 0);
    }

    function test_Keeper_PlacesQuoteWithinBounds() public {
        _fundDepositor(100 * LOT);
        // A bid (buy base with quote) is what a USDC-only-funded reserve can actually back — it
        // has no idle EURC yet to escrow for an ask. 0.98, within the 5% band below mid.
        vm.prank(keeper);
        uint256 orderId = reserve.placeQuote(true, 980_000, LOT, 0);
        assertEq(book.getOrder(orderId).owner, address(reserve));
        assertEq(reserve.activeOrderIds().length, 1);
    }

    function test_Keeper_CancelQuote_Untracks() public {
        _fundDepositor(100 * LOT);
        vm.prank(keeper);
        uint256 orderId = reserve.placeQuote(true, 980_000, LOT, 0);

        vm.prank(keeper);
        reserve.cancelQuote(orderId);
        assertEq(reserve.activeOrderIds().length, 0);
        assertFalse(book.getOrder(orderId).active);
    }

    /// @notice PRD: "share price must only ever reflect real captured value" — depositing,
    /// quoting, and getting filled (buying base below the oracle's fair mid, the intended spread
    /// capture, plus earning the maker rebate) must never decrease assets-per-share; it should
    /// strictly increase once a real fill lands.
    function test_SharePrice_IncreasesAfterProfitableFill_NeverDecreases() public {
        _fundDepositor(100 * LOT);
        uint256 sharePriceBefore = (reserve.totalAssets() * 1e18) / reserve.totalSupply();

        vm.prank(keeper);
        uint256 orderId = reserve.placeQuote(true, 980_000, LOT, 0); // reserve bids 1 lot at 0.98

        // A taker (seller) crosses and sells into the reserve's resting bid.
        _depositBase(bob, LOT);
        vm.prank(bob);
        book.placeLimit(pairId, false, 980_000, LOT, 0, 0);

        assertFalse(book.getOrder(orderId).active, "reserve's bid should have been fully filled");

        uint256 sharePriceAfter = (reserve.totalAssets() * 1e18) / reserve.totalSupply();
        assertGt(sharePriceAfter, sharePriceBefore, "captured maker proceeds must increase assets-per-share");

        // No shares were minted/burned by the fill itself — totalAssets alone should account for
        // the entire increase (real captured value, not dilution/inflation of the share count).
        assertEq(reserve.totalSupply(), 100 * LOT);
    }

    function test_Withdraw_ReturnsIdleAssets() public {
        _fundDepositor(100 * LOT);
        uint256 balBefore = quote.balanceOf(depositor);

        vm.prank(depositor);
        reserve.withdraw(40 * LOT, depositor, depositor);

        assertEq(quote.balanceOf(depositor), balBefore + 40 * LOT);
        assertEq(reserve.totalAssets(), 60 * LOT);
    }
}
