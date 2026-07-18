// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockOracle
/// @notice SIMULATED — admin-settable reference mid prices (e.g. EUR/USD) for market-maker bots
/// and the UI to quote around. `KeystoneBook`'s matching logic never reads this contract: every
/// fill is decided purely by resting orders and price-time priority. This is a display/bot-signal
/// input only, and is labeled as such everywhere it's surfaced in the UI.
contract MockOracle is Ownable {
    /// @dev 1e18-scaled: units of `quote` per 1 unit of `base`.
    mapping(address base => mapping(address quote => uint256)) public mid;

    event MidSet(address indexed base, address indexed quote, uint256 mid);

    constructor(address owner_) Ownable(owner_) {}

    function setMid(address base, address quote, uint256 mid_) external onlyOwner {
        mid[base][quote] = mid_;
        emit MidSet(base, quote, mid_);
    }

    function getMid(address base, address quote) external view returns (uint256) {
        return mid[base][quote];
    }
}
