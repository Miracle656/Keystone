// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BalanceManager} from "./BalanceManager.sol";
import {PairRegistry} from "./PairRegistry.sol";

/// @title KeystoneBook
/// @notice Fully on-chain central limit order book with price-time priority. Storage per
/// pair/side is a sorted linked list of price `Level`s, each holding a FIFO doubly-linked queue
/// of `Order`s. Matching is bounded to `MAX_MATCHES` fills per call so no single transaction can
/// exceed the block gas limit; any unmatched remainder either rests (limit orders) or is refunded
/// (IOC / market orders).
///
/// ## Escrow & fee settlement (read this before touching `_settleFill`)
///
/// Every order locks its full worst-case obligation in `BalanceManager` at placement time — the
/// matching loop itself never calls out to `BalanceManager.deposit`/`withdraw`, only the
/// internal, external-call-free `lock`/`unlockTo`, which is what keeps matching reentrancy-clean
/// and gas-bounded (PRD §Phase 1).
///
/// - A **sell** order locks exactly `qty` of `base` — 1:1, no fee buffer needed, because fees are
///   always denominated and settled in the `quote` asset.
/// - A **buy** order locks `qty * lockPerUnit`, where
///   `lockPerUnit = ceil(price * (10_000 + takerFeeBps) / 10_000)`. The `takerFeeBps` buffer
///   covers the worst case (this order fully crossing the book at its own limit price, paying
///   taker fee); it's sized off `takerFeeBps` specifically because `PairRegistry` enforces
///   `makerFeeBps <= takerFeeBps`, so a buy order that instead rests and is later filled as a
///   *maker* only ever needs a smaller-or-equal amount, never more.
///
/// On each fill of `fillQty` at `fillPrice` (always the **maker's** resting price):
/// - `lockedForQty = fillQty * buyerOrder.lockPerUnit` is the buyer-side slice of escrow being
///   released this fill.
/// - `notional = fillQty * fillPrice`.
/// - Whichever of {buyer, seller} is the *incoming* order this call is the **taker**
///   (`takerFeeBps`, always ≥ 0); the other, resting, order is the **maker** (`makerFeeBps`, can
///   be negative — a rebate funded out of the taker fee).
/// - `sellerReceives = notional - sellerFeeAmt`
/// - `protocolFee = takerFeeAmt + makerFeeAmt`
/// - `buyerRefund = lockedForQty - notional - buyerFeeAmt`
///
/// Because `{buyerFeeAmt, sellerFeeAmt} = {takerFeeAmt, makerFeeAmt}` as a set, these three sums
/// always total exactly `lockedForQty` — the buyer's escrow slice for this fill is fully and
/// exactly accounted for, to the wei, regardless of rounding. Rounding itself is
/// protocol-favoring throughout: amounts *locked* or *charged* round up, amounts *rebated* round
/// down (see `_ceilMulDivBps`/`_floorMulDivBps`).
contract KeystoneBook {
    PairRegistry public immutable PAIR_REGISTRY;
    BalanceManager public immutable BALANCE_MANAGER;
    address public immutable FEE_COLLECTOR;

    /// @dev Fills allowed per placeLimit/placeMarket call. Bounds worst-case gas; PRD §Phase 1
    /// risk table — tune from `forge test --gas-report`, see DECISIONS.md for the measured value.
    uint256 public immutable MAX_MATCHES;
    /// @dev Bounded fallback scan when a caller-supplied `levelHint` doesn't land next to the
    /// true insertion point. Reverts past this rather than walking an unbounded list.
    uint256 public immutable MAX_HINT_SCAN;

    uint256 internal constant BPS_DENOM = 10_000;
    /// @dev Fixed-point scale for `price`: `notional = qty * price / PRICE_SCALE`. Assumes base
    /// and quote share the same decimals (true for both MVP pairs — USDC/EURC and USDC/USDT are
    /// all 6-decimal). A pair with mismatched decimals would need a per-pair scale factor; out of
    /// scope for MVP. At this scale, a "real" price of 1.1512 is represented on-chain as
    /// 1_151_200, and a tick size of 0.0001 is represented as 100.
    uint256 internal constant PRICE_SCALE = 1e6;
    uint32 public constant FLAG_POST_ONLY = 1;
    uint32 public constant FLAG_IOC = 2;

    struct Level {
        uint256 head;
        uint256 tail;
        uint256 totalQty;
        uint256 prev;
        uint256 next;
        bool exists;
    }

    struct Order {
        uint256 id;
        address owner;
        uint256 pairId;
        bool isBid;
        uint256 price;
        uint256 qty;
        uint256 remaining;
        // Buy orders only (0 and unused for sells, which lock 1:1 base with no fee buffer): the
        // quote-wei still escrowed for this order. Released *proportionally to what's currently
        // locked* on each fill (`lockedRemaining * fillQty / remaining`, both read pre-fill) —
        // never recomputed from the order's original qty — so that summed across any number of
        // partial fills, the release is exact with zero dust left stuck in escrow. See
        // `_settleFill`.
        uint256 lockedRemaining;
        uint256 prevInLevel;
        uint256 nextInLevel;
        uint32 flags;
        bool active;
    }

    uint256 public nextOrderId = 1; // 0 is the "null" sentinel throughout
    mapping(uint256 orderId => Order) public orders;

    // _levels[pairId][isBid][price] — isBid=true is the bid side, isBid=false is the ask side.
    mapping(uint256 pairId => mapping(bool isBid => mapping(uint256 price => Level))) internal _levels;
    mapping(uint256 pairId => mapping(bool isBid => uint256)) public best; // 0 = empty side
    mapping(uint256 pairId => mapping(bool isBid => uint256)) public levelCount;

    event OrderPlaced(
        uint256 indexed orderId, address indexed owner, uint256 indexed pairId, bool isBid, uint256 price, uint256 qty, uint32 flags
    );
    event OrderCanceled(uint256 indexed orderId, uint256 refundedQty);
    event OrderFilled(uint256 indexed orderId, address indexed maker, address indexed taker, uint256 price, uint256 qty, uint256 fee);
    event TradeExecuted(uint256 indexed pairId, uint256 price, uint256 qty, bool takerIsBid);
    event LevelChanged(uint256 indexed pairId, bool isBid, uint256 price, uint256 totalQty);

    error PairPaused();
    error InvalidPrice();
    error InvalidQty();
    error InvalidFlags();
    error WouldCross();
    error HintTooFar();
    error TooManyLevels();
    error NotOwner();
    error OrderNotActive();
    error SlippageExceeded();
    error FeeAccountingError();

    constructor(address pairRegistry_, address balanceManager_, address feeCollector_, uint256 maxMatches_, uint256 maxHintScan_) {
        PAIR_REGISTRY = PairRegistry(pairRegistry_);
        BALANCE_MANAGER = BalanceManager(balanceManager_);
        FEE_COLLECTOR = feeCollector_;
        MAX_MATCHES = maxMatches_;
        MAX_HINT_SCAN = maxHintScan_;
    }

    function bestBid(uint256 pairId) external view returns (uint256) {
        return best[pairId][true];
    }

    function bestAsk(uint256 pairId) external view returns (uint256) {
        return best[pairId][false];
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function getLevel(uint256 pairId, bool isBid, uint256 price) external view returns (Level memory) {
        return _levels[pairId][isBid][price];
    }

    /// @notice Place a limit order. Validates tick/lot, escrows the full worst-case obligation,
    /// matches against the opposite side while crossing (up to `MAX_MATCHES` fills), then either
    /// rests the remainder (using `levelHint` for O(1)-ish insertion) or — for IOC orders —
    /// refunds it. `POST_ONLY` reverts instead of ever executing a taker fill.
    function placeLimit(uint256 pairId, bool isBid, uint256 price, uint256 qty, uint32 flags, uint256 levelHint)
        external
        returns (uint256 orderId, uint256 filledQty)
    {
        return _place(msg.sender, pairId, isBid, price, qty, flags, levelHint);
    }

    /// @notice Marketable limit: crosses the book up to `worstPrice` with IOC semantics — any
    /// unfilled remainder is refunded, never rested. `worstPrice` is the caller's slippage bound
    /// (the maximum price for a buy, minimum price for a sell).
    function placeMarket(uint256 pairId, bool isBid, uint256 qty, uint256 worstPrice)
        external
        returns (uint256 orderId, uint256 filledQty)
    {
        return _place(msg.sender, pairId, isBid, worstPrice, qty, FLAG_IOC, 0);
    }

    /// @dev Shared by `placeLimit` and `placeMarket` — takes `trader` explicitly rather than
    /// reading `msg.sender` internally, since `placeMarket` calls this directly (not via an
    /// external self-call, which would have reattributed ownership to the contract itself).
    function _place(address trader, uint256 pairId, bool isBid, uint256 price, uint256 qty, uint32 flags, uint256 levelHint)
        internal
        returns (uint256 orderId, uint256 filledQty)
    {
        PairRegistry.Pair memory pair = PAIR_REGISTRY.getPair(pairId);
        if (!pair.active) revert PairPaused();
        if (price == 0 || price % pair.tickSize != 0) revert InvalidPrice();
        if (qty == 0 || qty % pair.lotSize != 0) revert InvalidQty();

        bool postOnly = flags & FLAG_POST_ONLY != 0;
        bool ioc = flags & FLAG_IOC != 0;
        if (postOnly && ioc) revert InvalidFlags();

        if (postOnly) {
            uint256 oppBest = best[pairId][!isBid];
            if (oppBest != 0 && _crosses(isBid, price, oppBest)) revert WouldCross();
        }

        uint256 lockedRemaining;
        if (isBid) {
            // Per-unit lock at the same PRICE_SCALE as `price` (ceil: protocol-favoring, an
            // upper bound over the smaller-or-equal maker fee this order could instead earn if
            // it rests and fills as a maker later — see PairRegistry's makerFeeBps<=takerFeeBps
            // invariant). Descaled by PRICE_SCALE once here, for the total; not stored per-unit.
            uint256 lockPerUnit = _ceilDiv(price * (BPS_DENOM + pair.takerFeeBps), BPS_DENOM);
            lockedRemaining = _ceilDiv(lockPerUnit * qty, PRICE_SCALE);
            BALANCE_MANAGER.lock(trader, pair.quote, lockedRemaining);
        } else {
            BALANCE_MANAGER.lock(trader, pair.base, qty);
        }

        orderId = nextOrderId++;
        orders[orderId] = Order({
            id: orderId,
            owner: trader,
            pairId: pairId,
            isBid: isBid,
            price: price,
            qty: qty,
            remaining: qty,
            lockedRemaining: lockedRemaining,
            prevInLevel: 0,
            nextInLevel: 0,
            flags: flags,
            active: true
        });
        emit OrderPlaced(orderId, trader, pairId, isBid, price, qty, flags);

        Order storage incoming = orders[orderId];
        _match(pair, pairId, incoming);

        filledQty = qty - incoming.remaining;

        if (incoming.remaining > 0) {
            if (ioc) {
                _refundRemaining(pair, incoming);
                incoming.active = false;
                emit OrderCanceled(orderId, incoming.remaining);
            } else {
                _insertOrder(pair, pairId, isBid, price, orderId, levelHint);
            }
        } else {
            incoming.active = false;
        }
    }

    /// @notice Cancel a resting order: O(1) unlink from its price level, exact refund of the
    /// unfilled escrow to the wei. Always available, independent of the pair's pause state.
    function cancel(uint256 orderId) external {
        Order storage o = orders[orderId];
        if (o.owner != msg.sender) revert NotOwner();
        if (!o.active) revert OrderNotActive();

        PairRegistry.Pair memory pair = PAIR_REGISTRY.getPair(o.pairId);
        uint256 refunded = o.remaining;
        _refundRemaining(pair, o);
        _unlinkOrder(o.pairId, o.isBid, o.price, orderId);
        o.active = false;
        o.remaining = 0;
        emit OrderCanceled(orderId, refunded);
    }

    // ── Matching ────────────────────────────────────────────────────────────────────────────

    function _match(PairRegistry.Pair memory pair, uint256 pairId, Order storage incoming) internal {
        uint256 matches;
        bool isBid = incoming.isBid;
        while (incoming.remaining > 0 && matches < MAX_MATCHES) {
            uint256 oppBest = best[pairId][!isBid];
            if (oppBest == 0 || !_crosses(isBid, incoming.price, oppBest)) break;

            Level storage level = _levels[pairId][!isBid][oppBest];
            uint256 makerId = level.head;
            Order storage maker = orders[makerId];

            uint256 fillQty = incoming.remaining < maker.remaining ? incoming.remaining : maker.remaining;
            uint256 fee = _settleFill(pair, incoming, maker, oppBest, fillQty, isBid);

            incoming.remaining -= fillQty;
            maker.remaining -= fillQty;
            level.totalQty -= fillQty;
            matches++;

            emit OrderFilled(makerId, maker.owner, incoming.owner, oppBest, fillQty, fee);
            emit TradeExecuted(pairId, oppBest, fillQty, isBid);

            if (maker.remaining == 0) {
                maker.active = false;
                _unlinkOrder(pairId, !isBid, oppBest, makerId);
            } else {
                emit LevelChanged(pairId, !isBid, oppBest, level.totalQty);
            }
        }
    }

    /// @dev Settles the fee/escrow accounting for one fill and returns the net protocol fee.
    /// Does NOT touch `remaining`/`totalQty`/linked-list state — the caller (`_match`) owns that.
    function _settleFill(
        PairRegistry.Pair memory pair,
        Order storage takerOrder,
        Order storage makerOrder,
        uint256 fillPrice,
        uint256 fillQty,
        bool takerIsBid
    ) internal returns (uint256 protocolFee) {
        (address buyer, address seller, uint256 lockedForQty) = _prepareFill(takerOrder, makerOrder, fillQty, takerIsBid);

        BALANCE_MANAGER.unlockTo(buyer, pair.base, fillQty);

        uint256 sellerReceives;
        uint256 buyerRefund;
        (sellerReceives, protocolFee, buyerRefund) = _computeSettlement(
            (fillPrice * fillQty) / PRICE_SCALE, lockedForQty, pair.takerFeeBps, pair.makerFeeBps, takerIsBid
        );

        BALANCE_MANAGER.unlockTo(seller, pair.quote, sellerReceives);
        BALANCE_MANAGER.unlockTo(FEE_COLLECTOR, pair.quote, protocolFee);
        BALANCE_MANAGER.unlockTo(buyer, pair.quote, buyerRefund);
    }

    /// @dev Resolves buyer/seller for this fill and releases a slice of the buyer order's escrow
    /// *proportional to what's currently locked* (`lockedRemaining * fillQty / remaining`, both
    /// read pre-fill — the caller decrements `remaining` after `_settleFill` returns). Summed
    /// across any number of partial fills this always nets to exactly `lockedRemaining` with zero
    /// dust, unlike recomputing a share of the order's original qty each time (which can
    /// under-release cumulatively under repeated floor rounding and leave unrefundable dust stuck
    /// in escrow forever). Isolated from `_settleFill` to keep stack depth down.
    function _prepareFill(Order storage takerOrder, Order storage makerOrder, uint256 fillQty, bool takerIsBid)
        internal
        returns (address buyer, address seller, uint256 lockedForQty)
    {
        buyer = takerIsBid ? takerOrder.owner : makerOrder.owner;
        seller = takerIsBid ? makerOrder.owner : takerOrder.owner;
        Order storage buyerOrder = takerIsBid ? takerOrder : makerOrder;
        lockedForQty = (buyerOrder.lockedRemaining * fillQty) / buyerOrder.remaining;
        buyerOrder.lockedRemaining -= lockedForQty;
    }

    /// @dev Pure fee/refund arithmetic, isolated from `_settleFill` purely to keep that
    /// function's local-variable count under the EVM's stack-depth limit.
    function _computeSettlement(uint256 notional, uint256 lockedForQty, uint16 takerFeeBps, int16 makerFeeBps, bool takerIsBid)
        internal
        pure
        returns (uint256 sellerReceives, uint256 protocolFee, uint256 buyerRefund)
    {
        int256 takerFeeAmt = int256(_ceilMulDivBps(notional, takerFeeBps));
        int256 makerFeeAmt = _makerFeeAmt(notional, makerFeeBps);

        int256 buyerFeeAmt = takerIsBid ? takerFeeAmt : makerFeeAmt;
        int256 sellerFeeAmt = takerIsBid ? makerFeeAmt : takerFeeAmt;

        int256 sellerReceivesI = int256(notional) - sellerFeeAmt;
        int256 protocolFeeI = takerFeeAmt + makerFeeAmt;
        int256 buyerRefundI = int256(lockedForQty) - int256(notional) - buyerFeeAmt;
        if (sellerReceivesI < 0 || protocolFeeI < 0 || buyerRefundI < 0) revert FeeAccountingError();

        sellerReceives = uint256(sellerReceivesI);
        protocolFee = uint256(protocolFeeI);
        buyerRefund = uint256(buyerRefundI);
    }

    function _refundRemaining(PairRegistry.Pair memory pair, Order storage o) internal {
        if (o.remaining == 0) return;
        if (o.isBid) {
            BALANCE_MANAGER.unlockTo(o.owner, pair.quote, o.lockedRemaining);
            o.lockedRemaining = 0;
        } else {
            BALANCE_MANAGER.unlockTo(o.owner, pair.base, o.remaining);
        }
    }

    function _crosses(bool isBid, uint256 price, uint256 oppPrice) internal pure returns (bool) {
        return isBid ? price >= oppPrice : price <= oppPrice;
    }

    // ── Book structure (levels + FIFO queues) ──────────────────────────────────────────────────

    function _insertOrder(PairRegistry.Pair memory pair, uint256 pairId, bool isBid, uint256 price, uint256 orderId, uint256 hint)
        internal
    {
        Level storage level = _levels[pairId][isBid][price];
        if (!level.exists) {
            _insertLevel(pair, pairId, isBid, price, hint);
        }
        Order storage o = orders[orderId];
        o.prevInLevel = level.tail;
        o.nextInLevel = 0;
        if (level.tail != 0) {
            orders[level.tail].nextInLevel = orderId;
        } else {
            level.head = orderId;
        }
        level.tail = orderId;
        level.totalQty += o.remaining;
        emit LevelChanged(pairId, isBid, price, level.totalQty);
    }

    function _insertLevel(PairRegistry.Pair memory pair, uint256 pairId, bool isBid, uint256 price, uint256 hint) internal {
        if (levelCount[pairId][isBid] >= pair.maxLevelsPerSide) revert TooManyLevels();
        (uint256 left, uint256 right) = _locate(pairId, isBid, price, hint);

        Level storage level = _levels[pairId][isBid][price];
        level.exists = true;
        level.prev = left;
        level.next = right;

        if (left != 0) {
            _levels[pairId][isBid][left].next = price;
        } else {
            best[pairId][isBid] = price;
        }
        if (right != 0) {
            _levels[pairId][isBid][right].prev = price;
        }
        levelCount[pairId][isBid]++;
    }

    /// @dev Finds the two levels `price` should sit between, starting from `hint` (or the best
    /// price if the hint doesn't reference a live level) and walking at most `MAX_HINT_SCAN`
    /// steps in the correct direction. Reverts with `HintTooFar` past that bound — the caller is
    /// expected to supply a hint from the indexer, which always tracks live levels.
    function _locate(uint256 pairId, bool isBid, uint256 price, uint256 hint) internal view returns (uint256 left, uint256 right) {
        uint256 cur = hint;
        if (cur == 0 || !_levels[pairId][isBid][cur].exists) {
            cur = best[pairId][isBid];
        }
        if (cur == 0) {
            return (0, 0);
        }

        uint256 steps;
        if (_better(isBid, price, cur)) {
            uint256 p = cur;
            while (true) {
                uint256 prevP = _levels[pairId][isBid][p].prev;
                if (prevP == 0) return (0, p);
                if (_better(isBid, price, prevP)) {
                    p = prevP;
                    if (++steps > MAX_HINT_SCAN) revert HintTooFar();
                    continue;
                }
                return (prevP, p);
            }
        } else {
            uint256 p = cur;
            while (true) {
                uint256 nextP = _levels[pairId][isBid][p].next;
                if (nextP == 0) return (p, 0);
                if (_better(isBid, nextP, price)) {
                    p = nextP;
                    if (++steps > MAX_HINT_SCAN) revert HintTooFar();
                    continue;
                }
                return (p, nextP);
            }
        }
    }

    function _unlinkOrder(uint256 pairId, bool isBid, uint256 price, uint256 orderId) internal {
        Level storage level = _levels[pairId][isBid][price];
        Order storage o = orders[orderId];

        if (o.prevInLevel != 0) {
            orders[o.prevInLevel].nextInLevel = o.nextInLevel;
        } else {
            level.head = o.nextInLevel;
        }
        if (o.nextInLevel != 0) {
            orders[o.nextInLevel].prevInLevel = o.prevInLevel;
        } else {
            level.tail = o.prevInLevel;
        }
        level.totalQty -= o.remaining;

        if (level.head == 0) {
            _unlinkLevel(pairId, isBid, price);
        } else {
            emit LevelChanged(pairId, isBid, price, level.totalQty);
        }
    }

    function _unlinkLevel(uint256 pairId, bool isBid, uint256 price) internal {
        Level storage level = _levels[pairId][isBid][price];
        uint256 prevPrice = level.prev;
        uint256 nextPrice = level.next;

        if (prevPrice != 0) {
            _levels[pairId][isBid][prevPrice].next = nextPrice;
        } else {
            best[pairId][isBid] = nextPrice;
        }
        if (nextPrice != 0) {
            _levels[pairId][isBid][nextPrice].prev = prevPrice;
        }

        delete _levels[pairId][isBid][price];
        levelCount[pairId][isBid]--;
        emit LevelChanged(pairId, isBid, price, 0);
    }

    function _better(bool isBid, uint256 a, uint256 b) internal pure returns (bool) {
        return isBid ? a > b : a < b;
    }

    // ── Fixed-point bps helpers — protocol-favoring rounding throughout ────────────────────────

    function _ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return (a + b - 1) / b;
    }

    function _ceilMulDivBps(uint256 amount, uint256 bps) internal pure returns (uint256) {
        return (amount * bps + BPS_DENOM - 1) / BPS_DENOM;
    }

    function _floorMulDivBps(uint256 amount, uint256 bps) internal pure returns (uint256) {
        return (amount * bps) / BPS_DENOM;
    }

    /// @dev Maker fee can be a rebate (negative bps). A charge rounds up (protocol collects
    /// slightly more); a rebate rounds down (protocol pays out slightly less).
    function _makerFeeAmt(uint256 notional, int16 makerFeeBps) internal pure returns (int256) {
        if (makerFeeBps >= 0) {
            return int256(_ceilMulDivBps(notional, uint256(uint16(makerFeeBps))));
        }
        uint256 rebateBps = uint256(uint16(-makerFeeBps));
        return -int256(_floorMulDivBps(notional, rebateBps));
    }
}
