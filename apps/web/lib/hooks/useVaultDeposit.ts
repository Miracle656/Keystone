"use client";

import { useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { getAccount, readContract, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { parseUnits } from "viem";
import { ERC20_ABI, KEYSTONE_RESERVE_ABI } from "@keystone/shared";
import { KEYSTONE_RESERVE_ADDRESS, USDC_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";

export type VaultDepositStep = 0 | 1 | 2;

/** Deposits real USDC straight into KeystoneReserve's own ERC-4626 `deposit(assets, receiver)` —
 * distinct from BalanceManager.deposit() (a user's personal trading balance). This is the ONLY
 * path that actually mints vault shares and grows the Reserve's totalAssets()/TVL; Arc-direct
 * only (the vault's asset is Arc's USDC contract) — bridge in via the Router modal first if the
 * USDC is on Base/Arbitrum. */
export function useVaultDeposit() {
  const { address } = useAccount();
  const config = useConfig();
  const [step, setStep] = useState<VaultDepositStep>(0);
  const [error, setError] = useState<string | null>(null);

  async function deposit(amountHuman: string) {
    if (!address) throw new Error("Connect a wallet first");
    setError(null);
    setStep(0);
    try {
      const amount = parseUnits(amountHuman, 6);
      // switchChain actually triggers the wallet's "switch network" prompt (writeContract's own
      // chainId param does not — it just picks a client and lets viem throw ChainMismatchError
      // if the wallet's real active chain differs). No-ops if already on Arc. See the matching
      // comment in useRouterFlow.ts's ensureChain.
      if (getAccount(config).chainId !== arcTestnet.id) {
        await switchChain(config, { chainId: arcTestnet.id });
      }
      const allowance = await readContract(config, {
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, KEYSTONE_RESERVE_ADDRESS],
        chainId: arcTestnet.id,
      });
      if (allowance < amount) {
        const approveHash = await writeContract(config, {
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [KEYSTONE_RESERVE_ADDRESS, amount],
          chainId: arcTestnet.id,
        });
        await waitForTransactionReceipt(config, { hash: approveHash, chainId: arcTestnet.id });
      }
      setStep(1);
      const depositHash = await writeContract(config, {
        address: KEYSTONE_RESERVE_ADDRESS,
        abi: KEYSTONE_RESERVE_ABI,
        functionName: "deposit",
        args: [amount, address],
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(config, { hash: depositHash, chainId: arcTestnet.id });
      setStep(2);
      return depositHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      throw err;
    }
  }

  return { deposit, step, error, address };
}
