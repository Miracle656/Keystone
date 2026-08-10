/**
 * Sourced chain configuration for Keystone.
 *
 * Every value below was verified against official Arc / Circle docs on 2026-07-16
 * (Phase 0 of the build). Do not hand-edit addresses from memory — re-verify against
 * source URLs in comments if anything here is ever suspected stale.
 */
export declare const ARC_TESTNET: {
    readonly id: 5042002;
    readonly name: "Arc Testnet";
    readonly nativeCurrency: {
        readonly name: "USDC";
        readonly symbol: "USDC";
        readonly decimals: 18;
    };
    readonly rpcUrls: {
        readonly default: {
            readonly http: readonly ["https://rpc.testnet.arc.network"];
            readonly webSocket: readonly ["wss://rpc.testnet.arc.network"];
        };
        readonly blockdaemon: {
            readonly http: readonly ["https://rpc.blockdaemon.testnet.arc.network"];
            readonly webSocket: readonly ["wss://rpc.blockdaemon.testnet.arc.network:443/websocket"];
        };
        readonly drpc: {
            readonly http: readonly ["https://rpc.drpc.testnet.arc.network"];
            readonly webSocket: readonly ["wss://rpc.drpc.testnet.arc.network"];
        };
        readonly quicknode: {
            readonly http: readonly ["https://rpc.quicknode.testnet.arc.network"];
            readonly webSocket: readonly ["wss://rpc.quicknode.testnet.arc.network"];
        };
    };
    readonly blockExplorers: {
        readonly default: {
            readonly name: "Arcscan";
            readonly url: "https://testnet.arcscan.app";
        };
    };
    readonly faucet: "https://faucet.circle.com";
};
export declare const ARC_TESTNET_CONTRACTS: {
    readonly USDC: {
        readonly address: "0x3600000000000000000000000000000000000000";
        readonly decimals: 6;
    };
    readonly EURC: {
        readonly address: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
        readonly decimals: 6;
    };
    readonly USYC: {
        readonly address: "0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C";
        readonly decimals: 6;
    };
    readonly USYC_ENTITLEMENTS: "0xcc205224862c7641930c87679e98999d23c26113";
    readonly USYC_TELLER: "0x9fdF14c5B14173D74C08Af27AebFf39240dC105A";
    readonly USDT: null;
    readonly CCTP: {
        readonly domain: 26;
        readonly tokenMessengerV2: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
        readonly messageTransmitterV2: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275";
        readonly tokenMinterV2: "0xb43db544E2c27092c107639Ad201b3dEfAbcF192";
        readonly messageV2: "0xbaC0179bB358A8936169a63408C8481D582390C4";
    };
    readonly GATEWAY: {
        readonly domain: 26;
        readonly gatewayWallet: "0x0077777d7EBA4688BDeF3E311b846F25870A19B9";
        readonly gatewayMinter: "0x0022222ABE238Cc2C7Bb1f21003F0a260052475B";
    };
    readonly FX_ESCROW_STABLEFX: "0x867650F5eAe8df91445971f14d89fd84F0C9a9f8";
    readonly MEMO: "0x5294E9927c3306DcBaDb03fe70b92e01cCede505";
    readonly MULTICALL3_FROM: "0x522fAf9A91c41c443c66765030741e4AaCe147D0";
    readonly CREATE2_FACTORY: "0x4e59b44847b379578588920cA78FbF26c0B4956C";
    readonly MULTICALL3: "0xcA11bde05977b3631167028862bE2a173976CA11";
    readonly PERMIT2: "0x000000000022D473030F116dDEE9F6B43aC78BA3";
    readonly INFINITY_NAME: "0x76a816EFa69e3183972ff7a231F5C8d7b065d9De";
    readonly PYTH: {
        readonly address: "0x2880aB155794e7179c9eE2e38200202908C17B43";
        readonly EUR_USD_FEED_ID: "0xa995d00bb36a63cef7fd2c287dc105fc8f3d93779f062f09551b0af3e81ec30b";
    };
};
export declare const APP_KIT_NETWORK_SUPPORT: {
    readonly arcTestnet: {
        readonly bridge: true;
        readonly unifiedBalance: true;
        readonly swap: true;
    };
    readonly baseSepolia: {
        readonly bridge: true;
        readonly unifiedBalance: true;
        readonly swap: false;
    };
    readonly arbitrumSepolia: {
        readonly bridge: true;
        readonly unifiedBalance: true;
        readonly swap: false;
    };
};
export declare const BASE_SEPOLIA: {
    readonly id: 84532;
    readonly name: "Base Sepolia";
    readonly rpcUrl: "https://sepolia.base.org";
    readonly blockExplorer: "https://sepolia.basescan.org";
};
export declare const ARBITRUM_SEPOLIA: {
    readonly id: 421614;
    readonly name: "Arbitrum Sepolia";
    readonly rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc";
    readonly blockExplorer: "https://sepolia.arbiscan.io";
};
export declare const CHAINS: {
    readonly arcTestnet: {
        readonly id: 5042002;
        readonly name: "Arc Testnet";
        readonly nativeCurrency: {
            readonly name: "USDC";
            readonly symbol: "USDC";
            readonly decimals: 18;
        };
        readonly rpcUrls: {
            readonly default: {
                readonly http: readonly ["https://rpc.testnet.arc.network"];
                readonly webSocket: readonly ["wss://rpc.testnet.arc.network"];
            };
            readonly blockdaemon: {
                readonly http: readonly ["https://rpc.blockdaemon.testnet.arc.network"];
                readonly webSocket: readonly ["wss://rpc.blockdaemon.testnet.arc.network:443/websocket"];
            };
            readonly drpc: {
                readonly http: readonly ["https://rpc.drpc.testnet.arc.network"];
                readonly webSocket: readonly ["wss://rpc.drpc.testnet.arc.network"];
            };
            readonly quicknode: {
                readonly http: readonly ["https://rpc.quicknode.testnet.arc.network"];
                readonly webSocket: readonly ["wss://rpc.quicknode.testnet.arc.network"];
            };
        };
        readonly blockExplorers: {
            readonly default: {
                readonly name: "Arcscan";
                readonly url: "https://testnet.arcscan.app";
            };
        };
        readonly faucet: "https://faucet.circle.com";
    };
    readonly baseSepolia: {
        readonly id: 84532;
        readonly name: "Base Sepolia";
        readonly rpcUrl: "https://sepolia.base.org";
        readonly blockExplorer: "https://sepolia.basescan.org";
    };
    readonly arbitrumSepolia: {
        readonly id: 421614;
        readonly name: "Arbitrum Sepolia";
        readonly rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc";
        readonly blockExplorer: "https://sepolia.arbiscan.io";
    };
};
