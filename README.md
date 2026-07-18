# Keystone

The on-chain order book for internet money. Full product spec in `KEYSTONE_PRD.md`; running
build log and every sourced fact in `DECISIONS.md`.

## Status (Phase 1 — the Book)

`KeystoneBook`, `BalanceManager`, `PairRegistry`, `FeeCollector`, `KeystoneReserve`,
`MockOracle`, `MockUSDT` are implemented, tested (23 tests: unit + invariant/fuzz + Reserve),
gas-measured, and **deployed live on Arc Testnet**:

| Contract | Address |
|---|---|
| PairRegistry | `0xF51eBb0Ed5AD4F5ab23a7b37163bBA24463EA6D9` |
| BalanceManager | `0x79CE00b1345E9D64830F17FbDD298851BDa6a5a8` |
| KeystoneBook | `0x03ce491b31180bB14848F508fA418b92962Df21a` |
| FeeCollector | `0xC1D3593fB76416FE3AC3422f4773938809b765db` |
| KeystoneReserve | `0x3cbEb36CB35192A574EAd5E1FB4D61f1A7b45Eb3` |
| MockOracle | `0xD7b7b802241506f833331c84477D97546b9Fc7c4` |
| MockUSDT | `0x061e59E532B9C852d747a3a0b36CEa698b9F6d5A` |

Pairs listed: `USDC/EURC` (pairId `0`, real Arc-native tokens, **active**) and `USDC/USDT`
(pairId `1`, `MockUSDT` — no canonical testnet USDT exists on Arc, see `DECISIONS.md`).
**USDC/USDT is paused** (`PairRegistry.setActive(1, false)`, 2026-07-17) — Circle/Arc's testnet
only really supports USDC + EURC natively, so the mock-backed pair is deprioritized rather than
presented as equivalent to the real one. Cancels/withdrawals are unaffected by the pause; it can
be re-activated later with no redeploy if a real testnet USDT ever lands. Mirrored
machine-readable in `packages/shared/addresses.json`.

Explorer: https://testnet.arcscan.app (search any address/tx above).

## Environment

- **Contracts**: Foundry, run under **WSL2** (`wsl -d Ubuntu-22.04`) — Foundry isn't installed
  natively on Windows in this setup. From WSL: `export PATH="$PATH:/root/.foundry/bin"` if a
  fresh shell doesn't pick it up from `.profile`.
- **Everything else** (web, engine, indexer): native Windows / pnpm, no WSL needed.
- If invoking WSL from Git Bash on Windows, set `MSYS_NO_PATHCONV=1` — Git Bash otherwise
  rewrites `/mnt/c/...` paths before `wsl.exe` ever sees them.

## Try it: place a real limit order

```bash
cd packages/contracts
forge test -vv                       # 23 tests green
forge test --match-contract KeystoneBookGasTest -vv   # gas report (see DECISIONS.md)
```

Place a real resting limit order on Arc Testnet with `cast` (needs `DEMO_USER_PRIVATE_KEY` in
the repo-root `.env`; that wallet needs a little Arc Testnet USDC — faucet.circle.com):

```bash
# from WSL2, with Foundry on PATH
cd /mnt/c/Users/HP/Documents/Arc/keystone
set -a && source .env && set +a
RPC=https://rpc.testnet.arc.network
USDC=0x3600000000000000000000000000000000000000
BM=0x79CE00b1345E9D64830F17FbDD298851BDa6a5a8
BOOK=0x03ce491b31180bB14848F508fA418b92962Df21a

cast send "$USDC" "approve(address,uint256)" "$BM" 2000000 --private-key "$DEMO_USER_PRIVATE_KEY" --rpc-url "$RPC"
cast send "$BM" "deposit(address,uint256)" "$USDC" 2000000 --private-key "$DEMO_USER_PRIVATE_KEY" --rpc-url "$RPC"
cast send "$BOOK" "placeLimit(uint256,bool,uint256,uint256,uint32,uint256)" 0 true 1080000 1000000 0 0 \
  --private-key "$DEMO_USER_PRIVATE_KEY" --rpc-url "$RPC"
```

The third call's receipt emits `OrderPlaced` and `LevelChanged` from `KeystoneBook` — paste the
`transactionHash` into https://testnet.arcscan.app to see it. (A ready-to-run copy of this lives
at `packages/contracts/script/demo-place-order.sh`.)

Verified live on 2026-07-17: placing a 1.0-lot bid at 1.08 USDC/EURC cost 413,559 gas and
succeeded (`status: 1`) — tx `0x0be1ce931fe6ec83b53ee2b03623e5e7167205f6354df57103dd710fae8c5c05`.
