// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {BalanceManager} from "../../src/BalanceManager.sol";
import {KeystoneBook} from "../../src/KeystoneBook.sol";
import {TestERC20} from "../utils/TestERC20.sol";

/// @notice Bounded-actor fuzz handler for KeystoneBook invariants. Ghost-tracks net
/// deposits/withdrawals per token so the invariant test can assert BalanceManager's real ERC-20
/// balance always equals exactly net-deposited, independent of whatever internal
/// escrow/fee/refund bookkeeping happened in between. Failed attempts (insufficient balance, a
/// hint that's landed too far from the true insertion point now that many levels exist,
/// POST_ONLY crossing, etc.) are expected under random fuzzing and are caught rather than
/// treated as a broken run — the invariants only need to hold over whatever sequence of calls
/// actually succeeded.
contract KeystoneBookHandler is Test {
    BalanceManager public immutable BALANCE_MANAGER;
    KeystoneBook public immutable BOOK;
    TestERC20 public immutable BASE;
    TestERC20 public immutable QUOTE;
    uint256 public immutable PAIR_ID;
    uint256 public immutable TICK;
    uint256 public immutable LOT;

    address[4] public actors;
    uint256[] public openOrderIds;

    mapping(address token => uint256) public totalDeposited;
    mapping(address token => uint256) public totalWithdrawn;

    uint256 public ghost_placeAttempts;
    uint256 public ghost_placeSuccesses;
    uint256 public ghost_cancelSuccesses;

    constructor(BalanceManager bm, KeystoneBook bk, TestERC20 base_, TestERC20 quote_, uint256 pairId_, uint256 tick_, uint256 lot_) {
        BALANCE_MANAGER = bm;
        BOOK = bk;
        BASE = base_;
        QUOTE = quote_;
        PAIR_ID = pairId_;
        TICK = tick_;
        LOT = lot_;
        actors[0] = address(0x1001);
        actors[1] = address(0x1002);
        actors[2] = address(0x1003);
        actors[3] = address(0x1004);
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function depositQuote(uint256 actorSeed, uint256 amountSeed) external {
        address actor = _actor(actorSeed);
        uint256 amount = bound(amountSeed, 1, 1_000_000) * 1e6;
        QUOTE.mint(actor, amount);
        vm.startPrank(actor);
        QUOTE.approve(address(BALANCE_MANAGER), amount);
        BALANCE_MANAGER.deposit(address(QUOTE), amount);
        vm.stopPrank();
        totalDeposited[address(QUOTE)] += amount;
    }

    function depositBase(uint256 actorSeed, uint256 amountSeed) external {
        address actor = _actor(actorSeed);
        uint256 amount = bound(amountSeed, 1, 1_000_000) * 1e6;
        BASE.mint(actor, amount);
        vm.startPrank(actor);
        BASE.approve(address(BALANCE_MANAGER), amount);
        BALANCE_MANAGER.deposit(address(BASE), amount);
        vm.stopPrank();
        totalDeposited[address(BASE)] += amount;
    }

    function placeBid(uint256 actorSeed, uint256 priceSeed, uint256 qtySeed) external {
        _place(actorSeed, priceSeed, qtySeed, true);
    }

    function placeAsk(uint256 actorSeed, uint256 priceSeed, uint256 qtySeed) external {
        _place(actorSeed, priceSeed, qtySeed, false);
    }

    function _place(uint256 actorSeed, uint256 priceSeed, uint256 qtySeed, bool isBid) internal {
        address actor = _actor(actorSeed);
        // Tick-aligned prices in a band around the 1.0 "mid" (990_000..1_010_000), narrow enough
        // that most crosses/fills actually happen rather than just piling up unmatched levels.
        uint256 price = TICK * bound(priceSeed, 990_000 / TICK, 1_010_000 / TICK);
        uint256 qty = LOT * bound(qtySeed, 1, 5);

        ghost_placeAttempts++;
        vm.prank(actor);
        try BOOK.placeLimit(PAIR_ID, isBid, price, qty, 0, 0) returns (uint256 orderId, uint256) {
            ghost_placeSuccesses++;
            openOrderIds.push(orderId);
        } catch {}
    }

    function cancel(uint256 idxSeed) external {
        if (openOrderIds.length == 0) return;
        uint256 idx = idxSeed % openOrderIds.length;
        uint256 orderId = openOrderIds[idx];
        KeystoneBook.Order memory o = BOOK.getOrder(orderId);
        if (!o.active) {
            _swapPopOrder(idx);
            return;
        }
        vm.prank(o.owner);
        try BOOK.cancel(orderId) {
            ghost_cancelSuccesses++;
            _swapPopOrder(idx);
        } catch {}
    }

    function withdrawQuote(uint256 actorSeed, uint256 amountSeed) external {
        address actor = _actor(actorSeed);
        uint256 bal = BALANCE_MANAGER.balanceOf(actor, address(QUOTE));
        if (bal == 0) return;
        uint256 amount = bound(amountSeed, 1, bal);
        vm.prank(actor);
        BALANCE_MANAGER.withdraw(address(QUOTE), amount);
        totalWithdrawn[address(QUOTE)] += amount;
    }

    function withdrawBase(uint256 actorSeed, uint256 amountSeed) external {
        address actor = _actor(actorSeed);
        uint256 bal = BALANCE_MANAGER.balanceOf(actor, address(BASE));
        if (bal == 0) return;
        uint256 amount = bound(amountSeed, 1, bal);
        vm.prank(actor);
        BALANCE_MANAGER.withdraw(address(BASE), amount);
        totalWithdrawn[address(BASE)] += amount;
    }

    function _swapPopOrder(uint256 idx) internal {
        uint256 last = openOrderIds.length - 1;
        if (idx != last) openOrderIds[idx] = openOrderIds[last];
        openOrderIds.pop();
    }

    function openOrderCount() external view returns (uint256) {
        return openOrderIds.length;
    }
}
