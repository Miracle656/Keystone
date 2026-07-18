// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title PairRegistry
/// @notice Admin-listed trading pairs for the Keystone Book. Each pair fixes its tick size (the
/// minimum price increment — every order price must be an exact multiple), lot size (the minimum
/// quantity increment), a depth cap per side, and maker/taker fees in bps, all denominated in the
/// quote asset (PRD §Phase 1: "all fee math in the quote asset").
contract PairRegistry is AccessControl {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");

    /// @dev Fee bounds are sanity caps, not policy: 500 bps (5%) taker ceiling is far above any
    /// real stablecoin-pair fee and just guards against a fat-fingered `setPair` call.
    uint16 public constant MAX_TAKER_FEE_BPS = 500;

    struct Pair {
        address base;
        address quote;
        uint256 tickSize;
        uint256 lotSize;
        uint16 maxLevelsPerSide;
        uint16 takerFeeBps;
        int16 makerFeeBps; // negative = maker rebate, funded out of taker fee (see KeystoneBook)
        bool active;
    }

    uint256 public pairCount;
    mapping(uint256 pairId => Pair) public pairs;

    event PairListed(
        uint256 indexed pairId, address base, address quote, uint256 tickSize, uint256 lotSize
    );
    event PairUpdated(uint256 indexed pairId, uint16 takerFeeBps, int16 makerFeeBps, uint16 maxLevelsPerSide);
    event PairActiveSet(uint256 indexed pairId, bool active);

    error InvalidPair();
    error InvalidFees();
    error PairNotFound();

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GUARDIAN_ROLE, admin);
    }

    modifier validPairId(uint256 pairId) {
        if (pairId >= pairCount) revert PairNotFound();
        _;
    }

    /// @notice List a new pair. Only DEFAULT_ADMIN_ROLE — listing decisions (which assets, what
    /// tick/lot granularity) are a protocol-level decision, distinct from GUARDIAN's narrower
    /// pause power.
    function listPair(
        address base,
        address quote,
        uint256 tickSize,
        uint256 lotSize,
        uint16 maxLevelsPerSide,
        uint16 takerFeeBps,
        int16 makerFeeBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256 pairId) {
        if (base == quote || base == address(0) || quote == address(0)) revert InvalidPair();
        if (tickSize == 0 || lotSize == 0 || maxLevelsPerSide == 0) revert InvalidPair();
        _validateFees(takerFeeBps, makerFeeBps);

        pairId = pairCount++;
        pairs[pairId] = Pair({
            base: base,
            quote: quote,
            tickSize: tickSize,
            lotSize: lotSize,
            maxLevelsPerSide: maxLevelsPerSide,
            takerFeeBps: takerFeeBps,
            makerFeeBps: makerFeeBps,
            active: true
        });
        emit PairListed(pairId, base, quote, tickSize, lotSize);
    }

    /// @notice Update a listed pair's fees/depth cap. Tick/lot/asset addresses are immutable once
    /// listed — resting orders and every downstream price/qty computation assume they never
    /// change under a live book.
    function updatePair(uint256 pairId, uint16 takerFeeBps, int16 makerFeeBps, uint16 maxLevelsPerSide)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        validPairId(pairId)
    {
        if (maxLevelsPerSide == 0) revert InvalidPair();
        _validateFees(takerFeeBps, makerFeeBps);
        Pair storage p = pairs[pairId];
        p.takerFeeBps = takerFeeBps;
        p.makerFeeBps = makerFeeBps;
        p.maxLevelsPerSide = maxLevelsPerSide;
        emit PairUpdated(pairId, takerFeeBps, makerFeeBps, maxLevelsPerSide);
    }

    /// @notice GUARDIAN can pause/unpause a pair. Per PRD, a paused pair blocks new
    /// `placeLimit`/`placeMarket` calls in KeystoneBook; cancels and BalanceManager
    /// withdrawals are never blocked by this flag.
    function setActive(uint256 pairId, bool active) external onlyRole(GUARDIAN_ROLE) validPairId(pairId) {
        pairs[pairId].active = active;
        emit PairActiveSet(pairId, active);
    }

    function getPair(uint256 pairId) external view validPairId(pairId) returns (Pair memory) {
        return pairs[pairId];
    }

    /// @dev Net protocol fee per fill must never be negative (maker rebate can never exceed
    /// taker fee), and maker fee must never exceed taker fee — both keep the buyer-side escrow
    /// buffer in KeystoneBook (sized off `takerFeeBps`) always sufficient. See KeystoneBook's
    /// fee/escrow NatSpec for the full settlement derivation.
    function _validateFees(uint16 takerFeeBps, int16 makerFeeBps) internal pure {
        if (takerFeeBps > MAX_TAKER_FEE_BPS) revert InvalidFees();
        // forge-lint: disable-next-line(unsafe-typecast)
        // safe: takerFeeBps <= MAX_TAKER_FEE_BPS (500) here, far inside int16's range.
        if (makerFeeBps > int16(takerFeeBps)) revert InvalidFees();
        if (int256(uint256(takerFeeBps)) + int256(makerFeeBps) < 0) revert InvalidFees();
    }
}
