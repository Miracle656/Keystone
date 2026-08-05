"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { BALANCE_MANAGER_ABI, KEYSTONE_RESERVE_ABI } from "@keystone/shared";
import { BALANCE_MANAGER_ADDRESS, KEYSTONE_RESERVE_ADDRESS, USDC_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { useVaultMove, type MoveDirection } from "@/lib/hooks/useVaultMove";

type Phase = "form" | "pending" | "success";

const STEPS: Record<MoveDirection, { label: string; sub: string }[]> = {
  TO_VAULT: [
    { label: "WITHDRAWN", sub: "Released from trading balance to your wallet" },
    { label: "DEPOSITED", sub: "Approved + deposited into the Reserve vault" },
  ],
  TO_TRADING: [
    { label: "WITHDRAWN", sub: "Vault shares redeemed to your wallet" },
    { label: "DEPOSITED", sub: "Approved + deposited into your trading balance" },
  ],
};

export function VaultMoveModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { address } = useAccount();
  const { moveToVault, moveToTrading, step, error } = useVaultMove();
  const [direction, setDirection] = useState<MoveDirection>("TO_VAULT");
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("form");
      setAmount("");
    }
  }, [open]);

  const { data } = useReadContracts({
    contracts: address
      ? [
          { address: BALANCE_MANAGER_ADDRESS, abi: BALANCE_MANAGER_ABI, functionName: "balanceOf", args: [address, USDC_ADDRESS], chainId: arcTestnet.id },
          { address: KEYSTONE_RESERVE_ADDRESS, abi: KEYSTONE_RESERVE_ABI, functionName: "maxWithdraw", args: [address], chainId: arcTestnet.id },
        ]
      : [],
    query: { enabled: !!address && open, refetchInterval: 5000 },
  });
  const tradingBalance = data?.[0]?.status === "success" ? Number(formatUnits(data[0].result as bigint, 6)) : 0;
  const vaultBalance = data?.[1]?.status === "success" ? Number(formatUnits(data[1].result as bigint, 6)) : 0;
  const availableHuman = direction === "TO_VAULT" ? tradingBalance : vaultBalance;

  if (!open) return null;

  async function handleStart() {
    setPhase("pending");
    try {
      const hash = direction === "TO_VAULT" ? await moveToVault(amount || "0") : await moveToTrading(amount || "0");
      setTxHash(hash);
      setPhase("success");
    } catch {
      setPhase("form");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm"
      style={{ background: "rgba(11,20,36,0.7)" }}
      onClick={onClose}
    >
      <div
        style={{ width: 420, background: "#16233B", border: "1px solid rgba(245,241,230,0.14)", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", color: "#F5F1E6" }}
        className="rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between rounded-t-xl px-[22px] py-[18px]"
          style={{ borderBottom: "1px solid rgba(245,241,230,0.1)", background: "rgba(11,20,36,0.4)" }}
        >
          <span className="text-[17px] font-extrabold tracking-[-0.01em]">Move funds</span>
          <button onClick={onClose} className="font-mono rounded-md px-2.5 py-1 text-[12px]" style={{ border: "1.5px solid rgba(245,241,230,0.2)", color: "rgba(245,241,230,0.6)" }}>
            ESC
          </button>
        </div>

        {phase === "form" && (
          <div className="px-[22px] py-[22px]">
            <div className="font-mono mb-2.5 text-[10px] tracking-[0.12em]" style={{ color: "rgba(245,241,230,0.55)" }}>
              DIRECTION
            </div>
            <div className="mb-5 grid grid-cols-2 gap-2.5">
              {(["TO_VAULT", "TO_TRADING"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDirection(d);
                    setAmount("");
                  }}
                  className="rounded-lg py-2.5 text-center"
                  style={{
                    background: direction === d ? "rgba(231,178,90,0.12)" : "#101A2E",
                    border: `1.5px solid ${direction === d ? "#E7B25A" : "rgba(245,241,230,0.16)"}`,
                  }}
                >
                  <div className="font-mono text-[12px] font-bold">{d === "TO_VAULT" ? "Trading → Vault" : "Vault → Trading"}</div>
                  <div className="font-mono mt-0.5 text-[9.5px]" style={{ color: "rgba(245,241,230,0.55)" }}>
                    {d === "TO_VAULT" ? "start earning" : "free up for orders"}
                  </div>
                </button>
              ))}
            </div>

            <div className="font-mono mb-2 text-[10px] tracking-[0.12em]" style={{ color: "rgba(245,241,230,0.55)" }}>
              AMOUNT
            </div>
            <div className="mb-2 flex rounded-lg" style={{ border: "1.5px solid rgba(245,241,230,0.16)" }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="font-mono min-w-0 flex-1 rounded-l-lg p-[14px] text-[20px] outline-none"
                style={{ background: "#101A2E", color: "#F5F1E6" }}
              />
              <button
                onClick={() => setAmount(availableHuman.toString())}
                className="font-mono rounded-r-lg px-[14px] text-[11px] font-bold"
                style={{ background: "#101A2E", borderLeft: "1.5px solid rgba(245,241,230,0.16)", color: "#E7B25A" }}
              >
                MAX
              </button>
            </div>
            <div className="font-mono mb-5 flex justify-between text-[11px]" style={{ color: "rgba(245,241,230,0.55)" }}>
              <span>{direction === "TO_VAULT" ? "TRADING BALANCE" : "AVAILABLE IN VAULT"}</span>
              <span>{availableHuman.toLocaleString("en-US", { maximumFractionDigits: 2 })} USDC</span>
            </div>

            {error && (
              <div className="font-mono mb-3 rounded-lg p-2.5 text-[11px]" style={{ background: "rgba(229,72,77,0.12)", color: "#E5484D" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!address || !amount || Number(amount) <= 0}
              className="font-mono w-full rounded-lg py-[14px] text-[14px] font-bold tracking-[0.05em] disabled:opacity-40"
              style={{ background: "#E7B25A", color: "#12213B" }}
            >
              {!address ? "CONNECT WALLET FIRST" : direction === "TO_VAULT" ? "MOVE TO VAULT" : "MOVE TO TRADING"}
            </button>
          </div>
        )}

        {phase === "pending" && (
          <div className="px-[22px] py-[26px]">
            <div className="grid gap-0">
              {STEPS[direction].map((st, i) => {
                const done = step > i;
                const active = step === i;
                const ringColor = done ? "#2FBF71" : active ? "#E7B25A" : "rgba(245,241,230,0.2)";
                const iconColor = done ? "#08240F" : active ? "#E7B25A" : "rgba(245,241,230,0.5)";
                const labelColor = done ? "#2FBF71" : active ? "#F5F1E6" : "rgba(245,241,230,0.5)";
                return (
                  <div key={st.label} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className="font-mono flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] font-bold"
                        style={{ border: `2px solid ${ringColor}`, background: done ? "#2FBF71" : "transparent", color: iconColor, animation: active ? "rm-spin 1.1s linear infinite" : "none" }}
                      >
                        {done ? "✓" : active ? "◌" : i + 1}
                      </div>
                      {i < STEPS[direction].length - 1 && <div className="h-[34px] w-[2px]" style={{ background: done ? "#2FBF71" : "rgba(245,241,230,0.16)" }} />}
                    </div>
                    <div className="pt-1">
                      <div className="font-mono text-[13px] font-bold" style={{ color: labelColor }}>
                        {st.label}
                      </div>
                      <div className="font-mono mt-[3px] text-[11px]" style={{ color: "rgba(245,241,230,0.55)" }}>
                        {st.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="font-mono mt-5 pt-3.5 text-[10px] leading-[1.5]" style={{ borderTop: "1px solid rgba(245,241,230,0.1)", color: "rgba(245,241,230,0.55)" }}>
              Two sequential Arc transactions — your wallet is a relay, not a bridge. You&apos;ll sign twice.
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="px-[22px] py-[34px] text-center">
            <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#2FBF71" }}>
              <span style={{ color: "#08240F", fontSize: 24, fontWeight: 700 }}>✓</span>
            </div>
            <div className="mb-2 text-[21px] font-extrabold tracking-[-0.01em]">
              {direction === "TO_VAULT" ? "Moved into the vault." : "Moved into your trading balance."}
            </div>
            <div className="font-mono mb-[18px] text-[13px]" style={{ color: "rgba(245,241,230,0.7)" }}>
              {amount} USDC {direction === "TO_VAULT" ? "→ ksUSDC vault shares" : "→ ready to trade"}
            </div>
            {txHash && (
              <div className="font-mono mb-[22px] text-[11px]" style={{ color: "rgba(245,241,230,0.55)" }}>
                tx <span style={{ color: "#E7B25A" }}>{txHash.slice(0, 10)}…{txHash.slice(-6)}</span>
              </div>
            )}
            <button onClick={onClose} className="font-mono rounded-lg px-8 py-3 text-[13px] font-bold" style={{ background: "#E7B25A", color: "#12213B" }}>
              DONE
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
