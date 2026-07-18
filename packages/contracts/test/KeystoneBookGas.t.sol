// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BookTestBase} from "./utils/BookTestBase.sol";

/// @notice Isolated gas measurements for the PRD's required scenarios (place/cancel/match at
/// 1/5/20 fills), using `snapshotGasLastCall` — called *after* the call being measured, since it
/// reports the most recently completed call frame — so each number reflects only that one call.
/// Numbers are recorded in DECISIONS.md; MAX_MATCHES is tuned from these.
contract KeystoneBookGasTest is BookTestBase {
    uint256 internal constant PRICE = 1_000_000;

    function test_Gas_PlaceLimit_NoMatch() public {
        _depositBase(alice, LOT);
        vm.prank(alice);
        book.placeLimit(pairId, false, PRICE, LOT, 0, 0);
        vm.snapshotGasLastCall("place_no_match");
    }

    function test_Gas_Cancel() public {
        _depositBase(alice, LOT);
        uint256 orderId = _placeAsk(alice, PRICE, LOT, 0, 0);
        vm.prank(alice);
        book.cancel(orderId);
        vm.snapshotGasLastCall("cancel");
    }

    function test_Gas_Match_1Fill() public {
        _measureMatch(1);
    }

    function test_Gas_Match_5Fills() public {
        _measureMatch(5);
    }

    function test_Gas_Match_20Fills() public {
        _measureMatch(20);
    }

    /// @dev Rests `n` asks at `n` distinct price levels (each hinted at the immediately
    /// preceding price, so setup itself never scans), then measures a single incoming bid sized
    /// to cross exactly `n` of them.
    function _measureMatch(uint256 n) internal {
        uint256 hint = 0;
        for (uint256 i = 0; i < n; i++) {
            _depositBase(alice, LOT);
            _placeAsk(alice, PRICE + i * TICK, LOT, 0, hint);
            hint = PRICE + i * TICK;
        }

        uint256 qty = n * LOT;
        uint256 worst = PRICE + n * TICK;
        _depositQuote(bob, _buyLock(worst, qty));

        vm.prank(bob);
        book.placeLimit(pairId, true, worst, qty, 0, 0);
        vm.snapshotGasLastCall(string.concat("match_", vm.toString(n), "_fills"));
    }
}
