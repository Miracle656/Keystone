#!/usr/bin/env bash
set -euo pipefail

export PATH="$PATH:/root/.foundry/bin"
cd /mnt/c/Users/HP/Documents/Arc/keystone
set -a
source .env
set +a

RPC=https://rpc.testnet.arc.network
PAIR_REGISTRY=0xF51eBb0Ed5AD4F5ab23a7b37163bBA24463EA6D9
USDC_USDT_PAIR_ID=1

echo "--- pausing USDC/USDT (MockUSDT) pair, pairId=$USDC_USDT_PAIR_ID ---"
cast send "$PAIR_REGISTRY" "setActive(uint256,bool)" "$USDC_USDT_PAIR_ID" false \
  --private-key "$DEPLOYER_PRIVATE_KEY" --rpc-url "$RPC"

echo "--- confirming ---"
cast call "$PAIR_REGISTRY" "getPair(uint256)((address,address,uint256,uint256,uint16,uint16,int16,bool))" "$USDC_USDT_PAIR_ID" --rpc-url "$RPC"
