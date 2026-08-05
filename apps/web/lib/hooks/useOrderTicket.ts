"use client";

import { useState } from "react";
import { useAccount, useConfig, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "wagmi/actions";
import { useQueryClient } from "@tanstack/react-query";
import { BALANCE_MANAGER_ABI, ERC20_ABI, KEYSTONE_BOOK_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, KEYSTONE_BOOK_ADDRESS } from "@/lib/addresses";
import { FLAG_NONE, FLAG_POST_ONLY, FLAG_IOC } from "@/lib/constants";

/** Explicit two-step flow (deposit-to-trading-balance, then place) rather than silently
 * chaining approve+deposit+place into one hidden sequence — the user sees and signs each
 * step, matching the Router's "honest multi-step" pattern used elsewhere in the PRD. */
export function useOrderTicket() {
  const { address } = useAccount();
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function depositToTrading(token: `0x${string}`, amount: bigint) {
    if (!address) throw new Error("Connect a wallet first");
    setError(null);
    try {
      setStatus("Checking allowance…");
      const allowance = await readContract(config, {
        address: token,
        abi: ERC20_ABI,
        functionName: "allowance",
        args: [address, BALANCE_MANAGER_ADDRESS],
      });
      if (allowance < amount) {
        setStatus("Approving…");
        const approveHash = await writeContractAsync({
          address: token,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [BALANCE_MANAGER_ADDRESS, amount],
        });
        await waitForTransactionReceipt(config, { hash: approveHash });
      }
      setStatus("Depositing to trading balance…");
      const depositHash = await writeContractAsync({
        address: BALANCE_MANAGER_ADDRESS,
        abi: BALANCE_MANAGER_ABI,
        functionName: "deposit",
        args: [token, amount],
      });
      await waitForTransactionReceipt(config, { hash: depositHash });
      setStatus("Deposited");
      queryClient.invalidateQueries({ queryKey: ["book"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deposit failed");
      throw err;
    } finally {
      setStatus(null);
    }
  }

  async function placeLimit(pairId: bigint, isBid: boolean, price: bigint, qty: bigint, postOnly: boolean, ioc = false) {
    setError(null);
    try {
      setStatus("Placing limit order…");
      const flags = postOnly ? FLAG_POST_ONLY : ioc ? FLAG_IOC : FLAG_NONE;
      const hash = await writeContractAsync({
        address: KEYSTONE_BOOK_ADDRESS,
        abi: KEYSTONE_BOOK_ABI,
        functionName: "placeLimit",
        args: [pairId, isBid, price, qty, flags, 0n],
      });
      await waitForTransactionReceipt(config, { hash });
      setStatus("Order placed");
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["orders", address] });
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
      throw err;
    } finally {
      setStatus(null);
    }
  }

  async function placeMarket(pairId: bigint, isBid: boolean, qty: bigint, worstPrice: bigint) {
    setError(null);
    try {
      setStatus("Placing market order…");
      const hash = await writeContractAsync({
        address: KEYSTONE_BOOK_ADDRESS,
        abi: KEYSTONE_BOOK_ABI,
        functionName: "placeMarket",
        args: [pairId, isBid, qty, worstPrice],
      });
      await waitForTransactionReceipt(config, { hash });
      setStatus("Order filled");
      queryClient.invalidateQueries({ queryKey: ["book"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["orders", address] });
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
      throw err;
    } finally {
      setStatus(null);
    }
  }

  return { depositToTrading, placeLimit, placeMarket, status, error, setError };
}
