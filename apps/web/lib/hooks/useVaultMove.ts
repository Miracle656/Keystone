"use client";

import { useState } from "react";
import { useAccount, useConfig } from "wagmi";
import { getAccount, readContract, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { parseUnits } from "viem";
import { ERC20_ABI, BALANCE_MANAGER_ABI, KEYSTONE_RESERVE_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, KEYSTONE_RESERVE_ADDRESS, USDC_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";

export type MoveDirection = "TO_VAULT" | "TO_TRADING";
export type VaultMoveStep = 0 | 1 | 2;

/** Moves already-deposited USDC between a user's trading balance (BalanceManager) and the Earn
 * vault (KeystoneReserve) without a wallet round-trip to a bridge — both contracts settle on
 * Arc, so this is two sequential Arc-direct transactions in one guided flow, not one atomic tx
 * (BalanceManager.withdraw always pays out to msg.sender; there's no combined-move function on
 * either contract, and adding one would mean a new deploy, out of scope for this pass). */
export function useVaultMove() {
  const { address } = useAccount();
  const config = useConfig();
  const [step, setStep] = useState<VaultMoveStep>(0);
  const [error, setError] = useState<string | null>(null);

  async function ensureArc() {
    if (getAccount(config).chainId !== arcTestnet.id) {
      await switchChain(config, { chainId: arcTestnet.id });
    }
  }

  async function moveToVault(amountHuman: string) {
    if (!address) throw new Error("Connect a wallet first");
    setError(null);
    setStep(0);
    try {
      await ensureArc();
      const amount = parseUnits(amountHuman, 6);

      const withdrawHash = await writeContract(config, {
        address: BALANCE_MANAGER_ADDRESS,
        abi: BALANCE_MANAGER_ABI,
        functionName: "withdraw",
        args: [USDC_ADDRESS, amount],
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(config, { hash: withdrawHash, chainId: arcTestnet.id });
      setStep(1);

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
      setError(err instanceof Error ? err.message : "Move failed");
      throw err;
    }
  }

  async function moveToTrading(amountHuman: string) {
    if (!address) throw new Error("Connect a wallet first");
    setError(null);
    setStep(0);
    try {
      await ensureArc();
      const amount = parseUnits(amountHuman, 6);

      // ERC4626.withdraw(assets, receiver, owner) burns the caller's own shares (owner ==
      // receiver == msg.sender here) and pays out assets via KeystoneReserve's _transferOut,
      // which itself draws from the vault's own BalanceManager escrow — same rail deposit()
      // uses in reverse, just paying out to the connected wallet instead of BalanceManager.
      const withdrawHash = await writeContract(config, {
        address: KEYSTONE_RESERVE_ADDRESS,
        abi: KEYSTONE_RESERVE_ABI,
        functionName: "withdraw",
        args: [amount, address, address],
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(config, { hash: withdrawHash, chainId: arcTestnet.id });
      setStep(1);

      const allowance = await readContract(config, {
        address: USDC_ADDRESS,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, BALANCE_MANAGER_ADDRESS],
        chainId: arcTestnet.id,
      });
      if (allowance < amount) {
        const approveHash = await writeContract(config, {
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [BALANCE_MANAGER_ADDRESS, amount],
          chainId: arcTestnet.id,
        });
        await waitForTransactionReceipt(config, { hash: approveHash, chainId: arcTestnet.id });
      }
      const depositHash = await writeContract(config, {
        address: BALANCE_MANAGER_ADDRESS,
        abi: BALANCE_MANAGER_ABI,
        functionName: "deposit",
        args: [USDC_ADDRESS, amount],
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(config, { hash: depositHash, chainId: arcTestnet.id });
      setStep(2);
      return depositHash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed");
      throw err;
    }
  }

  return { moveToVault, moveToTrading, step, error, address };
}
