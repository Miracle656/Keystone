/**
 * Sourced chain configuration for Keystone.
 *
 * Every value below was verified against official Arc / Circle docs on 2026-07-16
 * (Phase 0 of the build). Do not hand-edit addresses from memory — re-verify against
 * source URLs in comments if anything here is ever suspected stale.
 */
// Source: https://docs.arc.io/arc/references/connect-to-arc.md
export const ARC_TESTNET = {
    id: 5042002,
    name: "Arc Testnet",
    nativeCurrency: {
        // SIMULATED-adjacent gotcha (not simulated, just unusual): Arc's native gas
        // token IS USDC, but the native currency uses 18 decimals while the ERC-20
        // interface for the same asset (see USDC address below) uses 6 decimals.
        // balanceOf() == 0 on the ERC-20 view does NOT imply native balance == 0.
        // Source: https://docs.arc.io/arc/references/evm-differences.md
        name: "USDC",
        symbol: "USDC",
        decimals: 18,
    },
    rpcUrls: {
        default: {
            http: ["https://rpc.testnet.arc.network"],
            webSocket: ["wss://rpc.testnet.arc.network"],
        },
        blockdaemon: {
            http: ["https://rpc.blockdaemon.testnet.arc.network"],
            webSocket: ["wss://rpc.blockdaemon.testnet.arc.network:443/websocket"],
        },
        drpc: {
            http: ["https://rpc.drpc.testnet.arc.network"],
            webSocket: ["wss://rpc.drpc.testnet.arc.network"],
        },
        quicknode: {
            http: ["https://rpc.quicknode.testnet.arc.network"],
            webSocket: ["wss://rpc.quicknode.testnet.arc.network"],
        },
    },
    blockExplorers: {
        default: {
            name: "Arcscan",
            url: "https://testnet.arcscan.app",
        },
    },
    faucet: "https://faucet.circle.com",
    // Arc is a built-in viem chain: `import { arcTestnet } from "viem/chains"`.
    // We define our own copy here (rather than importing viem's) so the source URL
    // and verification date travel with the values.
};
// Source: https://docs.arc.io/arc/references/contract-addresses.md (verified 2026-07-16)
export const ARC_TESTNET_CONTRACTS = {
    // --- Stablecoins ---
    USDC: {
        address: "0x3600000000000000000000000000000000000000",
        decimals: 6, // ERC-20 view; native balance uses 18 decimals, see ARC_TESTNET.nativeCurrency
    },
    EURC: {
        address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
        decimals: 6,
    },
    USYC: {
        // Yield-bearing money-market-fund-share token. Not used in MVP scope but
        // recorded since it's a first-class Arc asset and a candidate future pair.
        address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C",
        decimals: 6,
    },
    USYC_ENTITLEMENTS: "0xcc205224862c7641930c87679e98999d23c26113",
    USYC_TELLER: "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A",
    // --- No canonical testnet USDT on Arc ---
    // PRD open question #1 (§14.1) resolved: contract-addresses.md lists no USDT.
    // We deploy MockUSDT, loudly labeled // SIMULATED, per PRD §4.1 M2 fallback.
    USDT: null,
    // --- CCTP v2 (Domain 26) ---
    CCTP: {
        domain: 26,
        tokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
        messageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
        tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192",
        messageV2: "0xbaC0179bB358A8936169a63408C8481D582390C4",
    },
    // --- Circle Gateway (Domain 26) ---
    GATEWAY: {
        domain: 26,
        gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9",
        gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B",
    },
    // --- Payments / FX ---
    FX_ESCROW_STABLEFX: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8",
    // --- Extensions & common infra ---
    MEMO: "0x5294E9927c3306DcBaDb03fe70b92e01cCede505",
    MULTICALL3_FROM: "0x522fAf9A91c41c443c66765030741e4AaCe147D0",
    CREATE2_FACTORY: "0x4e59b44847b379578588920cA78FbF26c0B4956C",
    MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11",
    PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    // --- Name resolution (S2, PRD §4.2 / open question #5) ---
    // Community project, not an official Circle/Arc contract — verify independently
    // before relying on it. Source: https://infinityname.com/documentation
    INFINITY_NAME: "0x76a816EFa69e3183972ff7a231F5C8d7b065d9De",
    // Fallback candidate per PRD open question #5 (15-min spike, pick one):
    // ANS — ARC Name Service — https://arcnames.xyz/ (address not yet verified)
};
// Source: https://docs.arc.io/app-kit/references/supported-blockchains.md
// (re-verified 2026-07-17 via direct docs filesystem read, correcting a Phase 0
// WebFetch summarization error — see DECISIONS.md Phase 2 section). All three
// testnets support both Bridge and Unified Balance.
export const APP_KIT_NETWORK_SUPPORT = {
    arcTestnet: { bridge: true, unifiedBalance: true, swap: true },
    baseSepolia: { bridge: true, unifiedBalance: true, swap: false },
    arbitrumSepolia: { bridge: true, unifiedBalance: true, swap: false },
};
// Public RPCs for the Router's two other legs (Phase 2). Arc's is sourced/verified
// above; these are well-known public testnet endpoints, not independently
// verified against an Arc/Circle doc the way Arc's own RPC was.
export const BASE_SEPOLIA = {
    id: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
};
export const ARBITRUM_SEPOLIA = {
    id: 421614,
    name: "Arbitrum Sepolia",
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    blockExplorer: "https://sepolia.arbiscan.io",
};
export const CHAINS = {
    arcTestnet: ARC_TESTNET,
    baseSepolia: BASE_SEPOLIA,
    arbitrumSepolia: ARBITRUM_SEPOLIA,
};
