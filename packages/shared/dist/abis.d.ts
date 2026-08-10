export declare const PAIR_REGISTRY_ABI: readonly [{
    readonly type: "function";
    readonly name: "getPair";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "base";
            readonly type: "address";
        }, {
            readonly name: "quote";
            readonly type: "address";
        }, {
            readonly name: "tickSize";
            readonly type: "uint256";
        }, {
            readonly name: "lotSize";
            readonly type: "uint256";
        }, {
            readonly name: "maxLevelsPerSide";
            readonly type: "uint16";
        }, {
            readonly name: "takerFeeBps";
            readonly type: "uint16";
        }, {
            readonly name: "makerFeeBps";
            readonly type: "int16";
        }, {
            readonly name: "active";
            readonly type: "bool";
        }];
    }];
}];
export declare const BALANCE_MANAGER_ABI: readonly [{
    readonly type: "function";
    readonly name: "deposit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }, {
        readonly name: "token";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "totalEscrowed";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}];
export declare const ERC20_ABI: readonly [{
    readonly type: "function";
    readonly name: "approve";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "spender";
        readonly type: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "bool";
    }];
}, {
    readonly type: "function";
    readonly name: "allowance";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }, {
        readonly name: "spender";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "event";
    readonly name: "Transfer";
    readonly inputs: readonly [{
        readonly name: "from";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "value";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}];
export declare const KEYSTONE_BOOK_ABI: readonly [{
    readonly type: "function";
    readonly name: "placeLimit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
    }, {
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "price";
        readonly type: "uint256";
    }, {
        readonly name: "qty";
        readonly type: "uint256";
    }, {
        readonly name: "flags";
        readonly type: "uint32";
    }, {
        readonly name: "levelHint";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
    }, {
        readonly name: "filledQty";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "cancel";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "placeMarket";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
    }, {
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "qty";
        readonly type: "uint256";
    }, {
        readonly name: "worstPrice";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
    }, {
        readonly name: "filledQty";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "bestBid";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "bestAsk";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "getOrder";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "id";
            readonly type: "uint256";
        }, {
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly name: "pairId";
            readonly type: "uint256";
        }, {
            readonly name: "isBid";
            readonly type: "bool";
        }, {
            readonly name: "price";
            readonly type: "uint256";
        }, {
            readonly name: "qty";
            readonly type: "uint256";
        }, {
            readonly name: "remaining";
            readonly type: "uint256";
        }, {
            readonly name: "lockedRemaining";
            readonly type: "uint256";
        }, {
            readonly name: "prevInLevel";
            readonly type: "uint256";
        }, {
            readonly name: "nextInLevel";
            readonly type: "uint256";
        }, {
            readonly name: "flags";
            readonly type: "uint32";
        }, {
            readonly name: "active";
            readonly type: "bool";
        }];
    }];
}, {
    readonly type: "event";
    readonly name: "OrderFilled";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "maker";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "taker";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "price";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "qty";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "fee";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "OrderPlaced";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "owner";
        readonly type: "address";
        readonly indexed: true;
    }, {
        readonly name: "pairId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "isBid";
        readonly type: "bool";
        readonly indexed: false;
    }, {
        readonly name: "price";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "qty";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "flags";
        readonly type: "uint32";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "OrderCanceled";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "refundedQty";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "TradeExecuted";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "price";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "qty";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "takerIsBid";
        readonly type: "bool";
        readonly indexed: false;
    }];
}, {
    readonly type: "event";
    readonly name: "LevelChanged";
    readonly inputs: readonly [{
        readonly name: "pairId";
        readonly type: "uint256";
        readonly indexed: true;
    }, {
        readonly name: "isBid";
        readonly type: "bool";
        readonly indexed: false;
    }, {
        readonly name: "price";
        readonly type: "uint256";
        readonly indexed: false;
    }, {
        readonly name: "totalQty";
        readonly type: "uint256";
        readonly indexed: false;
    }];
}];
export declare const MOCK_ORACLE_ABI: readonly [{
    readonly type: "function";
    readonly name: "getMid";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "base";
        readonly type: "address";
    }, {
        readonly name: "quote";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "setMid";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "base";
        readonly type: "address";
    }, {
        readonly name: "quote";
        readonly type: "address";
    }, {
        readonly name: "mid_";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}];
export declare const KEYSTONE_RESERVE_ABI: readonly [{
    readonly type: "function";
    readonly name: "placeQuote";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "isBid";
        readonly type: "bool";
    }, {
        readonly name: "price";
        readonly type: "uint256";
    }, {
        readonly name: "qty";
        readonly type: "uint256";
    }, {
        readonly name: "levelHint";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "cancelQuote";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "orderId";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [];
}, {
    readonly type: "function";
    readonly name: "deposit";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "assets";
        readonly type: "uint256";
    }, {
        readonly name: "receiver";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "shares";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "totalAssets";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "totalSupply";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "balanceOf";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "account";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "maxWithdraw";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "withdraw";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly name: "assets";
        readonly type: "uint256";
    }, {
        readonly name: "receiver";
        readonly type: "address";
    }, {
        readonly name: "owner";
        readonly type: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "shares";
        readonly type: "uint256";
    }];
}, {
    readonly type: "function";
    readonly name: "FLAG_POST_ONLY";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint32";
    }];
}];
export declare const PYTH_ABI: readonly [{
    readonly type: "function";
    readonly name: "getPriceNoOlderThan";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly name: "id";
        readonly type: "bytes32";
    }, {
        readonly name: "age";
        readonly type: "uint256";
    }];
    readonly outputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly name: "price";
            readonly type: "int64";
        }, {
            readonly name: "conf";
            readonly type: "uint64";
        }, {
            readonly name: "expo";
            readonly type: "int32";
        }, {
            readonly name: "publishTime";
            readonly type: "uint256";
        }];
    }];
}];
