// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BalanceManager} from "../../src/BalanceManager.sol";
import {PairRegistry} from "../../src/PairRegistry.sol";
import {KeystoneBook} from "../../src/KeystoneBook.sol";
import {FeeCollector} from "../../src/FeeCollector.sol";
import {TestERC20} from "./TestERC20.sol";

/// @notice Shared deployment + helpers for KeystoneBook tests. Tick/lot/fee constants mirror the
/// PRD's USDC/EURC example (tick 0.0001, lot 1) at KeystoneBook.PRICE_SCALE (1e6): a "real" price
/// of 1.1512 is `1_151_200`, tick 0.0001 is `100`, lot 1.0 is `1_000_000`.
abstract contract BookTestBase is Test {
    BalanceManager internal balanceManager;
    PairRegistry internal pairRegistry;
    FeeCollector internal feeCollector;
    KeystoneBook internal book;
    TestERC20 internal base_;
    TestERC20 internal quote;
    uint256 internal pairId;

    address internal admin = makeAddr("admin");
    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal carol = makeAddr("carol");

    uint256 internal constant TICK = 100; // 0.0001
    uint256 internal constant LOT = 1_000_000; // 1.0
    uint16 internal constant MAX_LEVELS = 50;
    uint16 internal constant TAKER_FEE_BPS = 10; // 0.10%
    int16 internal constant MAKER_FEE_BPS = -2; // -0.02% rebate, funded from taker fee
    uint256 internal constant MAX_MATCHES = 20;
    uint256 internal constant MAX_HINT_SCAN = 10;
    uint256 internal constant PRICE_SCALE = 1e6;

    // Fetched once in setUp(), not called inline inside a placeLimit(...) argument list — an
    // inline `book.FLAG_IOC()` executes as its own external call before the outer call, which
    // silently consumes a one-shot vm.prank/vm.expectRevert meant for the outer placeLimit call.
    uint32 internal flagPostOnly;
    uint32 internal flagIoc;

    function setUp() public virtual {
        base_ = new TestERC20("Test EURC", "tEURC", 6);
        quote = new TestERC20("Test USDC", "tUSDC", 6);

        balanceManager = new BalanceManager(admin);
        pairRegistry = new PairRegistry(admin);

        vm.prank(admin);
        pairId = pairRegistry.listPair(address(base_), address(quote), TICK, LOT, MAX_LEVELS, TAKER_FEE_BPS, MAKER_FEE_BPS);

        feeCollector = new FeeCollector(admin, address(balanceManager));
        book = new KeystoneBook(address(pairRegistry), address(balanceManager), address(feeCollector), MAX_MATCHES, MAX_HINT_SCAN);

        vm.prank(admin);
        balanceManager.setBook(address(book));

        flagPostOnly = book.FLAG_POST_ONLY();
        flagIoc = book.FLAG_IOC();
    }

    function _depositQuote(address user, uint256 amount) internal {
        quote.mint(user, amount);
        vm.startPrank(user);
        quote.approve(address(balanceManager), amount);
        balanceManager.deposit(address(quote), amount);
        vm.stopPrank();
    }

    function _depositBase(address user, uint256 amount) internal {
        base_.mint(user, amount);
        vm.startPrank(user);
        base_.approve(address(balanceManager), amount);
        balanceManager.deposit(address(base_), amount);
        vm.stopPrank();
    }

    /// @dev Escrow needed for a buy order of `qty` at `price`, including the taker-fee buffer —
    /// mirrors KeystoneBook's own lock formula exactly (two-step ceilDiv) so tests can fund
    /// exactly enough.
    function _buyLock(uint256 price, uint256 qty) internal pure returns (uint256) {
        uint256 lockPerUnit = _ceilDiv(price * (10_000 + TAKER_FEE_BPS), 10_000);
        return _ceilDiv(lockPerUnit * qty, PRICE_SCALE);
    }

    function _ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a + b - 1) / b;
    }

    function _placeBid(address user, uint256 price, uint256 qty, uint32 flags, uint256 hint) internal returns (uint256 orderId) {
        vm.prank(user);
        (orderId,) = book.placeLimit(pairId, true, price, qty, flags, hint);
    }

    function _placeAsk(address user, uint256 price, uint256 qty, uint32 flags, uint256 hint) internal returns (uint256 orderId) {
        vm.prank(user);
        (orderId,) = book.placeLimit(pairId, false, price, qty, flags, hint);
    }
}
