// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BalanceManager} from "../src/BalanceManager.sol";
import {PairRegistry} from "../src/PairRegistry.sol";
import {FeeCollector} from "../src/FeeCollector.sol";
import {KeystoneBook} from "../src/KeystoneBook.sol";
import {KeystoneReserve} from "../src/KeystoneReserve.sol";
import {MockOracle} from "../src/MockOracle.sol";
import {MockUSDT} from "../src/MockUSDT.sol";

/// @notice Deploys the full Keystone stack to Arc Testnet and lists the two MVP pairs. Run with:
///
///   forge script script/Deploy.s.sol --rpc-url arc_testnet --broadcast -vvvv
///
/// Requires DEPLOYER_PRIVATE_KEY (and optionally RESERVE_KEEPER_ADDRESS) in the environment.
/// Prints every deployed address; hand those to packages/shared/addresses.json.
///
/// Deployed contracts are held in storage rather than as `run()` locals — purely to stay under
/// the EVM's stack-depth limit across this many sequential deployments (the same class of
/// stack-too-deep the matching engine itself hit; storage vars don't count against it).
contract Deploy is Script {
    // Source: docs.arc.io/arc/references/contract-addresses (verified Phase 0, see DECISIONS.md)
    address internal constant USDC = 0x3600000000000000000000000000000000000000;
    address internal constant EURC = 0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a;

    uint256 internal constant TICK = 100; // 0.0001, at PRICE_SCALE=1e6
    uint256 internal constant LOT = 1_000_000; // 1.0
    uint16 internal constant MAX_LEVELS = 50;
    uint16 internal constant TAKER_FEE_BPS = 10; // 0.10%
    int16 internal constant MAKER_FEE_BPS = -2; // -0.02% rebate
    uint256 internal constant MAX_MATCHES = 20; // see DECISIONS.md gas report — comfortable at ~3% of Arc's 30M gas/block
    uint256 internal constant MAX_HINT_SCAN = 10;

    address internal deployer;
    address internal keeper;

    BalanceManager internal balanceManager;
    PairRegistry internal pairRegistry;
    FeeCollector internal feeCollector;
    MockOracle internal oracle;
    MockUSDT internal mockUsdt;
    KeystoneBook internal book;
    KeystoneReserve internal reserve;
    uint256 internal usdcEurcPairId;
    uint256 internal usdcUsdtPairId;

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        deployer = vm.addr(deployerKey);
        keeper = vm.envOr("RESERVE_KEEPER_ADDRESS", deployer);

        vm.startBroadcast(deployerKey);
        _deployCore();
        _listPairs();
        _deployBook();
        _deployReserve();
        vm.stopBroadcast();

        _logAddresses();
    }

    function _deployCore() internal {
        balanceManager = new BalanceManager(deployer);
        pairRegistry = new PairRegistry(deployer);
        feeCollector = new FeeCollector(deployer, address(balanceManager));
        oracle = new MockOracle(deployer);
        // No canonical testnet USDT on Arc (verified Phase 0) — deploy a labeled mock for the
        // USDC/USDT pair only. USDC/EURC uses Arc's real, faucet-native tokens throughout.
        mockUsdt = new MockUSDT(deployer);
    }

    function _listPairs() internal {
        usdcEurcPairId = pairRegistry.listPair(EURC, USDC, TICK, LOT, MAX_LEVELS, TAKER_FEE_BPS, MAKER_FEE_BPS);
        usdcUsdtPairId =
            pairRegistry.listPair(address(mockUsdt), USDC, TICK, LOT, MAX_LEVELS, TAKER_FEE_BPS, MAKER_FEE_BPS);
    }

    function _deployBook() internal {
        book = new KeystoneBook(
            address(pairRegistry), address(balanceManager), address(feeCollector), MAX_MATCHES, MAX_HINT_SCAN
        );
        balanceManager.setBook(address(book));

        // SIMULATED reference mid for bots/UI/Reserve NAV only — the Book never reads this.
        // ~1.08 EUR/USD, a realistic rate, per PRD §4.1 M5.
        oracle.setMid(EURC, USDC, 1.08e18);
    }

    function _deployReserve() internal {
        reserve = new KeystoneReserve(
            IERC20(USDC),
            EURC,
            address(book),
            address(balanceManager),
            address(oracle),
            usdcEurcPairId,
            deployer,
            keeper,
            200, // maxSpreadBps: 2%
            3000, // maxInventorySkewBps: block once one side exceeds 80% of NAV
            50 * LOT // maxOrderSize
        );
    }

    function _logAddresses() internal view {
        console.log("BalanceManager:", address(balanceManager));
        console.log("PairRegistry:", address(pairRegistry));
        console.log("FeeCollector:", address(feeCollector));
        console.log("MockOracle:", address(oracle));
        console.log("MockUSDT:", address(mockUsdt));
        console.log("KeystoneBook:", address(book));
        console.log("KeystoneReserve:", address(reserve));
        console.log("USDC/EURC pairId:", usdcEurcPairId);
        console.log("USDC/USDT pairId:", usdcUsdtPairId);
    }
}
