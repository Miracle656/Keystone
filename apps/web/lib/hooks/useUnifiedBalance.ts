"use client";

import { useAccount, useReadContracts } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { formatUnits } from "viem";
import { ERC20_ABI } from "@keystone/shared";
import { USDC_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { baseSepolia, arbitrumSepolia } from "viem/chains";
import { useSolanaWallet } from "@/lib/hooks/useSolanaWallet";
import { getSolanaDevnetUsdcBalance } from "@/lib/solana";

const USDC_ADDRESS_BY_CHAIN: Record<string, `0x${string}`> = {
  ARC: USDC_ADDRESS,
  BASE: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  ARBITRUM: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
};

// Same real brand assets as RouterModal's chain picker (not letter-in-a-circle placeholders) —
// Arc's official icon needs a navy backing chip since the SVG itself is transparent; Base's
// and Arbitrum's are self-contained (their own colored mark), no extra background needed.
export const CHAINS = [
  { id: "ARC", name: "Arc", chainId: arcTestnet.id, logo: "/brand/arc-icon-white.svg", logoBg: "#1B3158" },
  { id: "BASE", name: "Base", chainId: baseSepolia.id, logo: "/brand/base.svg", logoBg: null },
  { id: "ARBITRUM", name: "Arbitrum", chainId: arbitrumSepolia.id, logo: "/brand/arbitrum.png", logoBg: null },
] as const;

export interface ChainBalance {
  id: string;
  name: string;
  logo: string;
  logoBg: string | null;
  balance: bigint;
  balanceHuman: number;
}

/** Real per-chain USDC balance for the connected wallet(s) — Arc, Base Sepolia, Arbitrum
 * Sepolia via the single connected EVM wallet, plus Solana Devnet via a separately-connected
 * Solana wallet (see useSolanaWallet) once the user has one linked — wagmi itself is EVM-only,
 * so Solana's balance is read via its own SPL token account query, not wagmi's readContracts. */
export function useUnifiedBalance() {
  const { address, isConnected } = useAccount();
  const solanaWallet = useSolanaWallet();

  const { data, isLoading } = useReadContracts({
    contracts: CHAINS.map((c) => ({
      address: USDC_ADDRESS_BY_CHAIN[c.id],
      abi: ERC20_ABI,
      functionName: "balanceOf" as const,
      args: address ? [address] : undefined,
      chainId: c.chainId,
    })),
    query: { enabled: !!address },
  });

  const { data: solanaBalanceHuman, isLoading: solanaLoading } = useQuery({
    queryKey: ["solana-usdc-balance", solanaWallet.publicKey],
    queryFn: () => getSolanaDevnetUsdcBalance(solanaWallet.publicKey!),
    enabled: !!solanaWallet.publicKey,
    refetchInterval: 8000,
  });

  const evmBalances: ChainBalance[] = CHAINS.map((c, i) => {
    const raw = data?.[i]?.status === "success" ? (data[i].result as bigint) : 0n;
    return { ...c, balance: raw, balanceHuman: Number(formatUnits(raw, 6)) };
  });

  const balances: ChainBalance[] = solanaWallet.isConnected
    ? [
        ...evmBalances,
        {
          id: "SOLANA",
          name: "Solana",
          logo: "/brand/solana.svg",
          logoBg: null,
          balance: BigInt(Math.round((solanaBalanceHuman ?? 0) * 1e6)),
          balanceHuman: solanaBalanceHuman ?? 0,
        },
      ]
    : evmBalances;

  const totalHuman = balances.reduce((sum, b) => sum + b.balanceHuman, 0);

  return {
    isConnected,
    isLoading: isLoading || (solanaWallet.isConnected && solanaLoading),
    balances,
    totalHuman,
    solanaWallet,
  };
}
