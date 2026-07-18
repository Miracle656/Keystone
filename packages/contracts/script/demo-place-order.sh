#!/usr/bin/env bash
set -euo pipefail

export PATH="$PATH:/root/.foundry/bin"
cd /mnt/c/Users/HP/Documents/Arc/keystone
set -a
source .env
set +a

RPC=https://rpc.testnet.arc.network
USDC=0x3600000000000000000000000000000000000000
BM=0x79CE00b1345E9D64830F17FbDD298851BDa6a5a8
BOOK=0x03ce491b31180bB14848F508fA418b92962Df21a
PAIR_ID=0
PRICE=1080000   # 1.08, matches the seeded oracle mid
QTY=1000000     # 1.0 EURC lot

echo "--- 1. approve BalanceManager to pull USDC ---"
cast send "$USDC" "approve(address,uint256)" "$BM" 2000000 \
  --private-key "$DEMO_USER_PRIVATE_KEY" --rpc-url "$RPC"

echo "--- 2. deposit USDC into BalanceManager ---"
cast send "$BM" "deposit(address,uint256)" "$USDC" 2000000 \
  --private-key "$DEMO_USER_PRIVATE_KEY" --rpc-url "$RPC"

echo "--- 3. place a limit bid on the USDC/EURC book ---"
cast send "$BOOK" "placeLimit(uint256,bool,uint256,uint256,uint32,uint256)" \
  "$PAIR_ID" true "$PRICE" "$QTY" 0 0 \
  --private-key "$DEMO_USER_PRIVATE_KEY" --rpc-url "$RPC"
