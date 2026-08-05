"use client";

import { useAccount, useReadContracts } from "wagmi";
import { BALANCE_MANAGER_ABI, ERC20_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, USDC_ADDRESS, EURC_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { formatUsd } from "@/lib/format";

export function BalancesStrip() {
  const { address, isConnected } = useAccount();

  // chainId pinned to Arc on every read — both BalanceManager and Arc's own USDC/EURC contracts
  // only exist there; without it these silently default to whatever chain the wallet has active
  // (e.g. still switched to Base/Arbitrum from a prior cross-chain Router leg), reading a
  // nonexistent contract there. See DECISIONS.md's Phase 6/7 vault-routing section.
  const { data, isLoading } = useReadContracts({
    contracts: address
      ? [
          { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: [address, USDC_ADDRESS], chainId: arcTestnet.id },
          { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: [address, EURC_ADDRESS], chainId: arcTestnet.id },
          { address: USDC_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [address], chainId: arcTestnet.id },
          { address: EURC_ADDRESS, abi: ERC20_ABI, functionName: "balanceOf", args: [address], chainId: arcTestnet.id },
        ]
      : [],
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  if (!isConnected) {
    return (
      <div className="flex items-center justify-between border border-ink-line bg-panel px-4 py-3 text-[13px] text-ink-faint">
        Connect a wallet to see balances
      </div>
    );
  }

  const [bmUsdc, bmEurc, wUsdc, wEurc] = data?.map((d) => (d.status === "success" ? (d.result as bigint) : 0n)) ?? [0n, 0n, 0n, 0n];

  return (
    <div className="grid grid-cols-2 gap-px border border-ink-line bg-ink-line sm:grid-cols-4">
      {[
        { label: "TRADING · USDC", value: bmUsdc },
        { label: "TRADING · EURC", value: bmEurc },
        { label: "WALLET · USDC", value: wUsdc },
        { label: "WALLET · EURC", value: wEurc },
      ].map((cell) => (
        <div key={cell.label} className="bg-panel px-4 py-3">
          <div className="mb-1 font-mono text-[10px] tracking-[0.08em] text-ink-faint">{cell.label}</div>
          <div className="font-mono text-[16px] font-bold">{isLoading ? "…" : formatUsd(cell.value)}</div>
        </div>
      ))}
    </div>
  );
}
