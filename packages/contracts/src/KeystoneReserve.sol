// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {BalanceManager} from "./BalanceManager.sol";
import {KeystoneBook} from "./KeystoneBook.sol";
import {MockOracle} from "./MockOracle.sol";

/// @title KeystoneReserve
/// @notice ERC-4626 vault, denominated in USDC, that provides passive liquidity to the Keystone
/// Book. Depositors' USDC is held in the vault's own `BalanceManager` account; a `RESERVE_KEEPER`
/// places/cancels resting quotes on the vault's behalf, restricted to on-chain bounds (max spread
/// off a reference mid, max inventory skew, per-order size cap — see `_checkBounds`).
///
/// ## `totalAssets()` — share price must only ever reflect real captured value
///
/// `totalAssets` = idle USDC + idle EURC (SIMULATED-oracle-valued) + resting orders (valued at
/// their own resting price, not mark-to-market). There is no separate "accrued fees" term: every
/// fill's maker proceeds/rebate settle straight into the vault's idle `BalanceManager` balance
/// via `KeystoneBook`'s normal settlement path (`BalanceManager.unlockTo`), so captured
/// fees+spread already show up in `idleQuote` the moment they're earned — real yield, not an
/// off-chain accrual assumption. `MockOracle` is used **only** to value idle EURC for NAV
/// purposes; it never influences matching, which stays purely price-time priority on-chain.
contract KeystoneReserve is ERC4626, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant RESERVE_KEEPER_ROLE = keccak256("RESERVE_KEEPER_ROLE");
    uint256 internal constant BPS_DENOM = 10_000;
    /// @dev Must match KeystoneBook.PRICE_SCALE — `Order.price` is fixed-point scaled by this.
    uint256 internal constant PRICE_SCALE = 1e6;
    /// @dev MockOracle.mid is 1e18-scaled; this converts it down to PRICE_SCALE for comparison
    /// against Book order prices (1e18 / 1e6).
    uint256 internal constant ORACLE_TO_PRICE_SCALE = 1e12;

    BalanceManager public immutable BALANCE_MANAGER;
    KeystoneBook public immutable BOOK;
    MockOracle public immutable ORACLE;
    uint256 public immutable PAIR_ID;
    address public immutable BASE;
    address public immutable QUOTE;

    uint256 public maxSpreadBps;
    uint256 public maxInventorySkewBps;
    uint256 public maxOrderSize;

    uint256[] internal _activeOrderIds;
    mapping(uint256 orderId => uint256 indexPlusOne) internal _activeOrderIndex; // 0 = not tracked

    event QuotePlaced(uint256 indexed orderId, bool isBid, uint256 price, uint256 qty);
    event QuoteCanceled(uint256 indexed orderId);
    event BoundsUpdated(uint256 maxSpreadBps, uint256 maxInventorySkewBps, uint256 maxOrderSize);

    error OrderTooLarge();
    error OracleNotSet();
    error PriceOutOfBounds();
    error InventorySkewExceeded();
    error OrderNotTracked();

    constructor(
        IERC20 quote_,
        address base_,
        address book_,
        address balanceManager_,
        address oracle_,
        uint256 pairId_,
        address admin,
        address keeper,
        uint256 maxSpreadBps_,
        uint256 maxInventorySkewBps_,
        uint256 maxOrderSize_
    ) ERC20("Keystone Reserve", "ksUSDC") ERC4626(quote_) {
        QUOTE = address(quote_);
        BASE = base_;
        BOOK = KeystoneBook(book_);
        BALANCE_MANAGER = BalanceManager(balanceManager_);
        ORACLE = MockOracle(oracle_);
        PAIR_ID = pairId_;
        maxSpreadBps = maxSpreadBps_;
        maxInventorySkewBps = maxInventorySkewBps_;
        maxOrderSize = maxOrderSize_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RESERVE_KEEPER_ROLE, keeper);

        // One-time infinite approval so every deposit doesn't need its own approve call —
        // BalanceManager is immutable and trusted (it's the contract this vault is built around).
        quote_.forceApprove(balanceManager_, type(uint256).max);
    }

    // ── ERC-4626 wiring: route the real asset through BalanceManager ──────────────────────────

    function _transferIn(address from, uint256 assets) internal override {
        IERC20(asset()).safeTransferFrom(from, address(this), assets);
        BALANCE_MANAGER.deposit(QUOTE, assets);
    }

    /// @dev Draws only from idle (non-resting) BalanceManager balance — reverts if too much of
    /// the vault's USDC is currently locked in open quotes. The keeper is expected to size
    /// `maxOrderSize`/inventory bounds so a healthy idle buffer remains; this is a known MVP
    /// limitation, not an auto-cancel-to-cover mechanism.
    function _transferOut(address to, uint256 assets) internal override {
        BALANCE_MANAGER.withdraw(QUOTE, assets);
        IERC20(asset()).safeTransfer(to, assets);
    }

    function totalAssets() public view override returns (uint256) {
        uint256 idleQuote = BALANCE_MANAGER.balanceOf(address(this), QUOTE);
        uint256 idleBase = BALANCE_MANAGER.balanceOf(address(this), BASE);
        uint256 mid = ORACLE.getMid(BASE, QUOTE);
        uint256 idleBaseValue = mid == 0 ? 0 : (idleBase * mid) / 1e18;
        return idleQuote + idleBaseValue + _restingValueInQuote();
    }

    /// @dev Sum of `remaining * price` (quote terms) across the vault's own tracked open orders —
    /// each order's own resting price, never oracle mark-to-market. Deliberately ignores the
    /// small taker-fee escrow buffer on resting bids (see KeystoneBook NatSpec): that buffer is
    /// refunded to idle balance on fill/cancel regardless, so omitting it here only ever makes
    /// totalAssets slightly conservative, never inflated.
    function _restingValueInQuote() internal view returns (uint256 value) {
        uint256 len = _activeOrderIds.length;
        for (uint256 i = 0; i < len; i++) {
            KeystoneBook.Order memory o = BOOK.getOrder(_activeOrderIds[i]);
            if (o.active) value += (o.remaining * o.price) / PRICE_SCALE;
        }
    }

    // ── Keeper quoting, within on-chain bounds ─────────────────────────────────────────────────

    function placeQuote(bool isBid, uint256 price, uint256 qty, uint256 levelHint)
        external
        onlyRole(RESERVE_KEEPER_ROLE)
        returns (uint256 orderId)
    {
        _checkBounds(isBid, price, qty);
        // Reserve quotes are always resting, never taker — POST_ONLY guarantees a compromised or
        // buggy keeper can never cross the book and pay taker fees with depositor funds.
        (orderId,) = BOOK.placeLimit(PAIR_ID, isBid, price, qty, BOOK.FLAG_POST_ONLY(), levelHint);
        _activeOrderIds.push(orderId);
        _activeOrderIndex[orderId] = _activeOrderIds.length;
        emit QuotePlaced(orderId, isBid, price, qty);
    }

    function cancelQuote(uint256 orderId) external onlyRole(RESERVE_KEEPER_ROLE) {
        BOOK.cancel(orderId);
        _untrack(orderId);
        emit QuoteCanceled(orderId);
    }

    function setBounds(uint256 maxSpreadBps_, uint256 maxInventorySkewBps_, uint256 maxOrderSize_)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        maxSpreadBps = maxSpreadBps_;
        maxInventorySkewBps = maxInventorySkewBps_;
        maxOrderSize = maxOrderSize_;
        emit BoundsUpdated(maxSpreadBps_, maxInventorySkewBps_, maxOrderSize_);
    }

    function activeOrderIds() external view returns (uint256[] memory) {
        return _activeOrderIds;
    }

    /// @dev Swap-and-pop removal by tracked index — O(1), keeps `_activeOrderIds` small and
    /// bounded (the keeper only ever holds a handful of resting quotes at once).
    function _untrack(uint256 orderId) internal {
        uint256 idxPlusOne = _activeOrderIndex[orderId];
        if (idxPlusOne == 0) revert OrderNotTracked();
        uint256 idx = idxPlusOne - 1;
        uint256 lastIdx = _activeOrderIds.length - 1;
        if (idx != lastIdx) {
            uint256 lastId = _activeOrderIds[lastIdx];
            _activeOrderIds[idx] = lastId;
            _activeOrderIndex[lastId] = idx + 1;
        }
        _activeOrderIds.pop();
        delete _activeOrderIndex[orderId];
    }

    /// @dev Safety bounds on the keeper's quoting, not policy: a max distance from the reference
    /// mid (protects depositors from a fat-fingered or compromised keeper pricing wildly off
    /// fair value) and a max order size. Inventory-skew direction: a BID buys base (worsens skew
    /// if already base-heavy), an ASK sells base (worsens skew if already quote-heavy) — only the
    /// skew-worsening direction is blocked, the corrective direction is always allowed.
    function _checkBounds(bool isBid, uint256 price, uint256 qty) internal view {
        if (qty > maxOrderSize) revert OrderTooLarge();

        uint256 mid = ORACLE.getMid(BASE, QUOTE);
        if (mid == 0) revert OracleNotSet();
        uint256 midScaled = mid / ORACLE_TO_PRICE_SCALE;
        uint256 maxDelta = (midScaled * maxSpreadBps) / BPS_DENOM;
        if (price > midScaled + maxDelta || price + maxDelta < midScaled) revert PriceOutOfBounds();

        uint256 idleQuote = BALANCE_MANAGER.balanceOf(address(this), QUOTE);
        uint256 idleBase = BALANCE_MANAGER.balanceOf(address(this), BASE);
        uint256 baseValue = (idleBase * mid) / 1e18;
        uint256 total = idleQuote + baseValue;
        if (total == 0) return;

        bool baseHeavy = baseValue * BPS_DENOM > total * (BPS_DENOM / 2 + maxInventorySkewBps);
        bool quoteHeavy = idleQuote * BPS_DENOM > total * (BPS_DENOM / 2 + maxInventorySkewBps);
        if (baseHeavy && isBid) revert InventorySkewExceeded();
        if (quoteHeavy && !isBid) revert InventorySkewExceeded();
    }
}
