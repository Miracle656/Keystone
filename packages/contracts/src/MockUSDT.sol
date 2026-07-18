// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDT
/// @notice SIMULATED — no canonical testnet USDT exists on Arc (verified against
/// docs.arc.io/arc/references/contract-addresses in Phase 0; see DECISIONS.md). This stands in
/// for the USDC/USDT pair only; it is an ordinary 6-decimal ERC-20 with no special treatment
/// anywhere in the matching/escrow/fee logic — that logic is asset-agnostic by design.
contract MockUSDT is ERC20, Ownable {
    constructor(address owner_) ERC20("Mock Tether USD (Keystone testnet)", "USDT") Ownable(owner_) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /// @notice Admin faucet — mints test-only USDT to `to`. Owner-gated since Circle's own
    /// faucet doesn't cover this mock asset.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
