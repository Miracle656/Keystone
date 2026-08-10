// Minimal ABIs — only the functions/events actually called from packages/engine,
// packages/indexer, and apps/web. Not full contract ABIs; extend as new call sites
// need more of the surface. Source of truth for the full ABI is the Foundry build
// output in packages/contracts/out/.
export const PAIR_REGISTRY_ABI = [
    {
        type: "function",
        name: "getPair",
        stateMutability: "view",
        inputs: [{ name: "pairId", type: "uint256" }],
        outputs: [
            {
                type: "tuple",
                components: [
                    { name: "base", type: "address" },
                    { name: "quote", type: "address" },
                    { name: "tickSize", type: "uint256" },
                    { name: "lotSize", type: "uint256" },
                    { name: "maxLevelsPerSide", type: "uint16" },
                    { name: "takerFeeBps", type: "uint16" },
                    { name: "makerFeeBps", type: "int16" },
                    { name: "active", type: "bool" },
                ],
            },
        ],
    },
];
export const BALANCE_MANAGER_ABI = [
    {
        type: "function",
        name: "deposit",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "withdraw",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [
            { name: "account", type: "address" },
            { name: "token", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "totalEscrowed",
        stateMutability: "view",
        inputs: [{ name: "token", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
];
export const ERC20_ABI = [
    {
        type: "function",
        name: "approve",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
    },
    {
        type: "function",
        name: "allowance",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "event",
        name: "Transfer",
        inputs: [
            { name: "from", type: "address", indexed: true },
            { name: "to", type: "address", indexed: true },
            { name: "value", type: "uint256", indexed: false },
        ],
    },
];
export const KEYSTONE_BOOK_ABI = [
    {
        type: "function",
        name: "placeLimit",
        stateMutability: "nonpayable",
        inputs: [
            { name: "pairId", type: "uint256" },
            { name: "isBid", type: "bool" },
            { name: "price", type: "uint256" },
            { name: "qty", type: "uint256" },
            { name: "flags", type: "uint32" },
            { name: "levelHint", type: "uint256" },
        ],
        outputs: [
            { name: "orderId", type: "uint256" },
            { name: "filledQty", type: "uint256" },
        ],
    },
    {
        type: "function",
        name: "cancel",
        stateMutability: "nonpayable",
        inputs: [{ name: "orderId", type: "uint256" }],
        outputs: [],
    },
    {
        type: "function",
        name: "placeMarket",
        stateMutability: "nonpayable",
        inputs: [
            { name: "pairId", type: "uint256" },
            { name: "isBid", type: "bool" },
            { name: "qty", type: "uint256" },
            { name: "worstPrice", type: "uint256" },
        ],
        outputs: [
            { name: "orderId", type: "uint256" },
            { name: "filledQty", type: "uint256" },
        ],
    },
    {
        type: "function",
        name: "bestBid",
        stateMutability: "view",
        inputs: [{ name: "pairId", type: "uint256" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "bestAsk",
        stateMutability: "view",
        inputs: [{ name: "pairId", type: "uint256" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "getOrder",
        stateMutability: "view",
        inputs: [{ name: "orderId", type: "uint256" }],
        outputs: [
            {
                type: "tuple",
                components: [
                    { name: "id", type: "uint256" },
                    { name: "owner", type: "address" },
                    { name: "pairId", type: "uint256" },
                    { name: "isBid", type: "bool" },
                    { name: "price", type: "uint256" },
                    { name: "qty", type: "uint256" },
                    { name: "remaining", type: "uint256" },
                    { name: "lockedRemaining", type: "uint256" },
                    { name: "prevInLevel", type: "uint256" },
                    { name: "nextInLevel", type: "uint256" },
                    { name: "flags", type: "uint32" },
                    { name: "active", type: "bool" },
                ],
            },
        ],
    },
    {
        type: "event",
        name: "OrderFilled",
        inputs: [
            { name: "orderId", type: "uint256", indexed: true },
            { name: "maker", type: "address", indexed: true },
            { name: "taker", type: "address", indexed: true },
            { name: "price", type: "uint256", indexed: false },
            { name: "qty", type: "uint256", indexed: false },
            { name: "fee", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "OrderPlaced",
        inputs: [
            { name: "orderId", type: "uint256", indexed: true },
            { name: "owner", type: "address", indexed: true },
            { name: "pairId", type: "uint256", indexed: true },
            { name: "isBid", type: "bool", indexed: false },
            { name: "price", type: "uint256", indexed: false },
            { name: "qty", type: "uint256", indexed: false },
            { name: "flags", type: "uint32", indexed: false },
        ],
    },
    {
        type: "event",
        name: "OrderCanceled",
        inputs: [
            { name: "orderId", type: "uint256", indexed: true },
            { name: "refundedQty", type: "uint256", indexed: false },
        ],
    },
    {
        type: "event",
        name: "TradeExecuted",
        inputs: [
            { name: "pairId", type: "uint256", indexed: true },
            { name: "price", type: "uint256", indexed: false },
            { name: "qty", type: "uint256", indexed: false },
            { name: "takerIsBid", type: "bool", indexed: false },
        ],
    },
    {
        type: "event",
        name: "LevelChanged",
        inputs: [
            { name: "pairId", type: "uint256", indexed: true },
            { name: "isBid", type: "bool", indexed: false },
            { name: "price", type: "uint256", indexed: false },
            { name: "totalQty", type: "uint256", indexed: false },
        ],
    },
];
export const MOCK_ORACLE_ABI = [
    {
        type: "function",
        name: "getMid",
        stateMutability: "view",
        inputs: [
            { name: "base", type: "address" },
            { name: "quote", type: "address" },
        ],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "setMid",
        stateMutability: "nonpayable",
        inputs: [
            { name: "base", type: "address" },
            { name: "quote", type: "address" },
            { name: "mid_", type: "uint256" },
        ],
        outputs: [],
    },
];
export const KEYSTONE_RESERVE_ABI = [
    {
        type: "function",
        name: "placeQuote",
        stateMutability: "nonpayable",
        inputs: [
            { name: "isBid", type: "bool" },
            { name: "price", type: "uint256" },
            { name: "qty", type: "uint256" },
            { name: "levelHint", type: "uint256" },
        ],
        outputs: [{ name: "orderId", type: "uint256" }],
    },
    {
        type: "function",
        name: "cancelQuote",
        stateMutability: "nonpayable",
        inputs: [{ name: "orderId", type: "uint256" }],
        outputs: [],
    },
    {
        type: "function",
        name: "deposit",
        stateMutability: "nonpayable",
        inputs: [
            { name: "assets", type: "uint256" },
            { name: "receiver", type: "address" },
        ],
        outputs: [{ name: "shares", type: "uint256" }],
    },
    {
        type: "function",
        name: "totalAssets",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "totalSupply",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint256" }],
    },
    // Inherited from OpenZeppelin's ERC4626/ERC20 (not hand-written here) — added for the internal
    // Vault -> Trading balance move (KeystoneReserve.withdraw burns the caller's shares and pays
    // out assets via the same BalanceManager-backed _transferOut path deposit() uses in reverse).
    {
        type: "function",
        name: "balanceOf",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "maxWithdraw",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ type: "uint256" }],
    },
    {
        type: "function",
        name: "withdraw",
        stateMutability: "nonpayable",
        inputs: [
            { name: "assets", type: "uint256" },
            { name: "receiver", type: "address" },
            { name: "owner", type: "address" },
        ],
        outputs: [{ name: "shares", type: "uint256" }],
    },
    {
        type: "function",
        name: "FLAG_POST_ONLY",
        stateMutability: "view",
        inputs: [],
        outputs: [{ type: "uint32" }],
    },
];
// Minimal IPyth fragment — just the one read reference-feed needs.
// getPriceNoOlderThan reverts (StalePrice) if the feed hasn't updated within `age` seconds,
// unlike getPriceUnsafe which returns whatever's stored with no freshness check at all — the
// safer of the two per Pyth's own docs, worth the revert-and-retry-next-cycle behavior it costs.
export const PYTH_ABI = [
    {
        type: "function",
        name: "getPriceNoOlderThan",
        stateMutability: "view",
        inputs: [
            { name: "id", type: "bytes32" },
            { name: "age", type: "uint256" },
        ],
        outputs: [
            {
                type: "tuple",
                components: [
                    { name: "price", type: "int64" },
                    { name: "conf", type: "uint64" },
                    { name: "expo", type: "int32" },
                    { name: "publishTime", type: "uint256" },
                ],
            },
        ],
    },
];
