#!/usr/bin/env bash
set -euo pipefail
export PATH="$PATH:/root/.foundry/bin"
RPC=https://rpc.testnet.arc.network
BM=0x79CE00b1345E9D64830F17FbDD298851BDa6a5a8
USDC=0x3600000000000000000000000000000000000000
EURC=0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a

declare -A wallets=(
  [DEPLOYER]=0xBC68fe809a60DF7E50706bB0362420FC75CDAD0D
  [MM_BOT_A]=0x970277C5e97D66Ccee6d7B9AFFD311cF24fD9aBf
  [MM_BOT_B]=0x8c61b21De8d585d2797C3428D604f5d3Df0Bad5D
  [RESERVE_KEEPER]=0x00352Bd2f106377e530ECc87e675416dAB5F1Efa
  [DEMO_USER]=0xA8033fc6049863c2AD2269eD259A5B24cfd1fa0f
)

for name in "${!wallets[@]}"; do
  addr="${wallets[$name]}"
  wallet_usdc=$(cast call "$USDC" "balanceOf(address)(uint256)" "$addr" --rpc-url "$RPC")
  wallet_eurc=$(cast call "$EURC" "balanceOf(address)(uint256)" "$addr" --rpc-url "$RPC")
  bm_usdc=$(cast call "$BM" "balanceOf(address,address)(uint256)" "$addr" "$USDC" --rpc-url "$RPC")
  bm_eurc=$(cast call "$BM" "balanceOf(address,address)(uint256)" "$addr" "$EURC" --rpc-url "$RPC")
  echo "$name ($addr): wallet USDC=$wallet_usdc EURC=$wallet_eurc | BalanceManager USDC=$bm_usdc EURC=$bm_eurc"
  sleep 0.5
done
