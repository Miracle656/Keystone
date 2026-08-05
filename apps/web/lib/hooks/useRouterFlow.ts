"use client";

import { useState } from "react";
import { useAccount, useConfig, type Config } from "wagmi";
import { getAccount, readContract, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import { parseUnits, type Address } from "viem";
import { ERC20_ABI, BALANCE_MANAGER_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, USDC_ADDRESS } from "@/lib/addresses";
import { createBrowserAdapter, getAppKit, BridgeChain, isRetryableError } from "@/lib/appkit";
import { arcTestnet } from "@/lib/wagmi";
import type { AppKit } from "@circle-fin/app-kit";

export type ChainOption = "ARC" | "BASE" | "ARBITRUM";

const BRIDGE_CHAIN_BY_OPTION: Record<Exclude<ChainOption, "ARC">, "Base_Sepolia" | "Arbitrum_Sepolia"> = {
  BASE: "Base_Sepolia",
  ARBITRUM: "Arbitrum_Sepolia",
};

export type FlowStep = 0 | 1 | 2;

// wagmi's writeContract/readContract actions accept a `chainId` but only use it to pick the
// right client/transport — they do NOT call connector.switchChain() first. If the wallet's
// actual connected chain differs, viem throws ChainMismatchError immediately with no prompt
// ever shown. switchChain() is the thing that actually triggers the wallet's "switch network"
// popup (and no-ops if already on that chain) — must be called explicitly before any Arc-direct
// call, since the wallet may still be on Base/Arbitrum from a prior cross-chain leg.
async function ensureChain(config: Config, chainId: number) {
  if (getAccount(config).chainId !== chainId) {
    await switchChain(config, { chainId });
  }
}

// kit.retryBridge() only supports resuming a step that failed for a transient reason (network
// blip, RPC timeout) — per the SDK's own isRetryableError(). If the failure instead needed the
// user to act (rejected the wallet prompt, insufficient balance/gas on the source chain, etc.),
// retryBridge() itself throws "Retry not supported for this result, requires user action" — a
// confusing SECOND error that masks the real one. Checking isRetryableError() first and, when
// not retryable, surfacing the bridge step's own errorMessage avoids that masking.
async function runBridge(kit: ReturnType<typeof getAppKit>, params: Parameters<AppKit["bridge"]>[0]) {
  let result = await kit.bridge(params);
  if (result.state === "error") {
    const failedStep = result.steps.find((s) => s.state === "error");
    if (failedStep?.errorCategory === "user_rejected") {
      throw new Error("Bridge cancelled — you rejected the request in your wallet.");
    }
    const stepError = failedStep?.error instanceof Error ? failedStep.error : new Error(failedStep?.errorMessage ?? "Bridge step failed");
    if (isRetryableError(stepError)) {
      result = await kit.retryBridge(result, {
        from: params.from.adapter,
        to: "adapter" in params.to ? params.to.adapter : undefined,
      });
    } else {
      throw new Error(failedStep?.errorMessage ?? "Bridge failed and cannot be automatically retried.");
    }
  }
  if (result.state !== "success") {
    throw new Error(`Bridge did not complete: ${JSON.stringify(result.steps)}`);
  }
  return result;
}

export function useRouterFlow() {
  const { address, connector } = useAccount();
  const config = useConfig();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<FlowStep>(0);
  const [error, setError] = useState<string | null>(null);

  async function getAdapter() {
    if (!connector) throw new Error("Connect a wallet first");
    const provider = await connector.getProvider();
    return createBrowserAdapter(provider as Parameters<typeof createBrowserAdapter>[0]);
  }

  // Explicit chainId on every call below: the connected wallet may still be switched to
  // Base/Arbitrum from a prior cross-chain leg, and Arc-direct addresses like USDC_ADDRESS
  // don't exist as contracts on those chains. Without chainId, wagmi/actions default to
  // whatever chain the wallet currently has active, silently reading/writing the wrong chain
  // (surfaces as a "returned no data" error, not an obvious network mismatch). Passing chainId
  // also makes wagmi prompt the wallet to switch to Arc first if it isn't already there.
  async function depositDirectArc(token: Address, amount: bigint) {
    if (!address) throw new Error("Connect a wallet first");
    await ensureChain(config, arcTestnet.id);
    const allowance = await readContract(config, {
      address: token,
      abi: ERC20_ABI,
      functionName: "allowance",
      args: [address, BALANCE_MANAGER_ADDRESS],
      chainId: arcTestnet.id,
    });
    if (allowance < amount) {
      const approveHash = await writeContract(config, {
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [BALANCE_MANAGER_ADDRESS, amount],
        chainId: arcTestnet.id,
      });
      await waitForTransactionReceipt(config, { hash: approveHash, chainId: arcTestnet.id });
    }
    setStep(1);
    const depositHash = await writeContract(config, {
      address: BALANCE_MANAGER_ADDRESS,
      abi: BALANCE_MANAGER_ABI,
      functionName: "deposit",
      args: [token, amount],
      chainId: arcTestnet.id,
    });
    await waitForTransactionReceipt(config, { hash: depositHash, chainId: arcTestnet.id });
    setStep(2);
    return depositHash;
  }

  async function withdrawDirectArc(token: Address, amount: bigint) {
    setStep(0);
    const hash = await withdrawDirectArcRaw(token, amount);
    setStep(2);
    return hash;
  }

  // Cross-chain legs always move USDC — Circle's CCTP v2 (what App Kit's bridge() wraps) is a
  // USDC-only bridge protocol, EURC has no cross-chain path through it. The token param on
  // `run` only ever applies to the Arc-direct leg; the UI is expected to keep EURC scoped to
  // the ARC chain option, but these two functions hardcode USDC regardless as a second guard.
  async function depositCrossChain(chain: Exclude<ChainOption, "ARC">, amountHuman: string) {
    const adapter = await getAdapter();
    const kit = getAppKit();
    setStep(0);
    const result = await runBridge(kit, {
      from: { adapter, chain: BRIDGE_CHAIN_BY_OPTION[chain] },
      to: { adapter, chain: BridgeChain.Arc_Testnet },
      amount: amountHuman,
    });
    setStep(1);
    const depositHash = await depositDirectArc(USDC_ADDRESS, parseUnits(amountHuman, 6));
    return { bridgeResult: result, depositHash };
  }

  async function withdrawCrossChain(chain: Exclude<ChainOption, "ARC">, amountHuman: string) {
    setStep(0);
    const withdrawHash = await withdrawDirectArcRaw(USDC_ADDRESS, parseUnits(amountHuman, 6));
    setStep(1);
    const adapter = await getAdapter();
    const kit = getAppKit();
    const result = await runBridge(kit, {
      from: { adapter, chain: BridgeChain.Arc_Testnet },
      to: { adapter, chain: BRIDGE_CHAIN_BY_OPTION[chain] },
      amount: amountHuman,
    });
    setStep(2);
    return { withdrawHash, bridgeResult: result };
  }

  // Withdraw's first leg, without the setStep(2) that withdrawDirectArc uses for the
  // direct-to-Arc-only flow (cross-chain withdraw has its own final step at the bridge finish).
  async function withdrawDirectArcRaw(token: Address, amount: bigint) {
    await ensureChain(config, arcTestnet.id);
    const hash = await writeContract(config, {
      address: BALANCE_MANAGER_ADDRESS,
      abi: BALANCE_MANAGER_ABI,
      functionName: "withdraw",
      args: [token, amount],
      chainId: arcTestnet.id,
    });
    await waitForTransactionReceipt(config, { hash, chainId: arcTestnet.id });
    return hash;
  }

  async function run(mode: "deposit" | "withdraw", chain: ChainOption, token: Address, amountHuman: string) {
    setError(null);
    setStep(0);
    try {
      const amount = parseUnits(amountHuman, 6);
      let hash: string;
      if (mode === "deposit") {
        hash = chain === "ARC" ? await depositDirectArc(token, amount) : (await depositCrossChain(chain, amountHuman)).depositHash;
      } else {
        hash = chain === "ARC" ? await withdrawDirectArc(token, amount) : (await withdrawCrossChain(chain, amountHuman)).withdrawHash;
      }
      queryClient.invalidateQueries({ queryKey: ["book"] });
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
      throw err;
    }
  }

  return { run, step, error, address: address as Address | undefined };
}
