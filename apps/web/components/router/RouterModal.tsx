"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { useQuery } from "@tanstack/react-query";
import { USDC_ADDRESS, EURC_ADDRESS } from "@/lib/addresses";
import { arcTestnet } from "@/lib/wagmi";
import { baseSepolia, arbitrumSepolia } from "viem/chains";
import { useRouterFlow, type ChainOption } from "@/lib/hooks/useRouterFlow";
import { useVaultDeposit } from "@/lib/hooks/useVaultDeposit";
import { useSolanaWallet } from "@/lib/hooks/useSolanaWallet";
import { getSolanaDevnetUsdcBalance } from "@/lib/solana";

export type RouterMode = "deposit" | "withdraw" | null;

type Phase = "form" | "pending" | "success";
type TokenSymbol = "USDC" | "EURC";
// VAULT is deposit-only, Arc-direct-only (KeystoneReserve's asset is USDC on Arc; there's no
// cross-chain-to-vault path yet — that needs a per-user CREATE2 deposit-address contract, logged
// as a real, separately-scoped roadmap item in DECISIONS.md, not something to fake here).
export type Destination = "TRADING" | "VAULT";

// Solana has no `chainId` in wagmi's EVM sense — it isn't used for chain-switching (Solana
// wallets don't have "networks" the way EVM ones do) or for useBalance's chainId param (Solana
// balance is read separately, see solanaUsdcBalance below), only kept here so every chain shares
// one row shape. 0 is a harmless placeholder, never passed to any wagmi call for the SOLANA row.
const CHAINS: { id: ChainOption; name: string; logo: string; logoBg: string | null; chainId: number }[] = [
  { id: "ARC", name: "ARC", logo: "/brand/arc-icon-white.svg", logoBg: "#1B3158", chainId: arcTestnet.id },
  { id: "BASE", name: "BASE", logo: "/brand/base.svg", logoBg: null, chainId: baseSepolia.id },
  { id: "ARBITRUM", name: "ARBITRUM", logo: "/brand/arbitrum.png", logoBg: null, chainId: arbitrumSepolia.id },
  { id: "SOLANA", name: "SOLANA", logo: "/brand/solana.svg", logoBg: null, chainId: 0 },
];

// Circle's CCTP v2 (what the cross-chain bridge legs run on) only moves USDC — EURC has no
// bridge path through it, so EURC stays Arc-direct-only (still fully real: approve + deposit
// straight into BalanceManager, just never leaves/enters via Base or Arbitrum).
const TOKENS: { symbol: TokenSymbol; address: `0x${string}`; logo: string }[] = [
  { symbol: "USDC", address: USDC_ADDRESS, logo: "/brand/usdc.svg" },
  { symbol: "EURC", address: EURC_ADDRESS, logo: "/brand/eurc.svg" },
];

// USDC is a different ERC-20 contract on every chain — reusing Arc's address elsewhere would
// silently read the wrong (nonexistent-there) contract and always show 0. Sourced from
// @circle-fin/app-kit's own chain definitions (chains.mjs), not guessed.
const USDC_ADDRESS_BY_CHAIN: Record<"ARC" | "BASE" | "ARBITRUM", `0x${string}`> = {
  ARC: USDC_ADDRESS,
  BASE: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  ARBITRUM: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
};

export function RouterModal({
  mode,
  initialDestination = "TRADING",
  onClose,
}: {
  mode: RouterMode;
  initialDestination?: Destination;
  onClose: () => void;
}) {
  const { address } = useAccount();
  const { run, step: routerStep, error: routerError } = useRouterFlow();
  const { deposit: vaultDeposit, step: vaultStep, error: vaultError } = useVaultDeposit();
  const solanaWallet = useSolanaWallet();

  const [chain, setChain] = useState<ChainOption>("ARC");
  const [tokenSymbol, setTokenSymbol] = useState<TokenSymbol>("USDC");
  const [tokenMenuOpen, setTokenMenuOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [destination, setDestination] = useState<Destination>(initialDestination);

  useEffect(() => {
    if (mode) {
      setPhase("form");
      setAmount("");
      setTokenMenuOpen(false);
      setDestination(initialDestination);
    }
    // initialDestination is only meant to seed the very first render after opening, not
    // re-fire every time the modal's own internal destination state changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // The vault only holds USDC on Arc — no cross-chain-to-vault path yet (see the Destination
  // type comment), so switching destination to VAULT snaps chain/token to the only combination
  // that's actually real, the same way selecting EURC already snaps chain to ARC below.
  useEffect(() => {
    if (destination === "VAULT") {
      setChain("ARC");
      setTokenSymbol("USDC");
    }
  }, [destination]);

  const step = destination === "VAULT" ? vaultStep : routerStep;
  const error = destination === "VAULT" ? vaultError : routerError;

  const token = TOKENS.find((t) => t.symbol === tokenSymbol)!;
  const selectedChain = CHAINS.find((c) => c.id === chain)!;
  // Always the real ERC-20 balance (never Arc's native gas-token balance, which happens to
  // also be called USDC at 18 decimals but is a different asset from BalanceManager's POV) —
  // and always that chain's own USDC contract, not Arc's (tokenSymbol is only ever EURC when
  // chain is ARC, since selectToken forces that pairing, so USDC_ADDRESS_BY_CHAIN covers it).
  const balanceToken = tokenSymbol === "EURC" ? token.address : USDC_ADDRESS_BY_CHAIN[chain as "ARC" | "BASE" | "ARBITRUM"];
  const { data: balance } = useBalance({
    address,
    chainId: selectedChain.chainId,
    token: balanceToken,
    query: { enabled: !!address && !!mode && chain !== "SOLANA" },
  });
  // Solana isn't an EVM balance — read separately via the SPL token account, only while the
  // Solana row is actually selected and a Solana wallet is connected.
  const { data: solanaBalance } = useQuery({
    queryKey: ["solana-usdc-balance", solanaWallet.publicKey],
    queryFn: () => getSolanaDevnetUsdcBalance(solanaWallet.publicKey!),
    enabled: chain === "SOLANA" && !!solanaWallet.publicKey && !!mode,
    refetchInterval: 8000,
  });

  function selectToken(symbol: TokenSymbol) {
    setTokenSymbol(symbol);
    setTokenMenuOpen(false);
    if (symbol === "EURC") setChain("ARC");
  }

  if (!mode) return null;
  const isDeposit = mode === "deposit";
  const availableHuman = chain === "SOLANA" ? (solanaBalance ?? 0) : balance ? Number(formatUnits(balance.value, balance.decimals)) : 0;
  const solanaNeedsConnect = chain === "SOLANA" && !solanaWallet.isConnected;

  const railLabel = chain === "ARC" ? "DIRECT (NO BRIDGE)" : "GATEWAY + CCTP V2";
  const etaLabel = chain === "ARC" ? "~1s" : "~45s";
  const routeLabel = isDeposit ? `${chain} → ARC` : `ARC → ${chain}`;

  const vaultStepDefs = [
    { label: "APPROVED", sub: "USDC approved for the Reserve vault" },
    { label: "DEPOSITED", sub: "Shares minted — Reserve totalAssets() updated" },
  ];
  const stepDefs = isDeposit
    ? [
        { label: "DETECTED", sub: `${tokenSymbol} seen on ${chain} — Gateway unified balance` },
        { label: "BRIDGING", sub: "CCTP v2 burn → attest → mint on Arc" },
        { label: "CREDITED", sub: "BalanceManager escrow credited — ready to trade" },
      ]
    : [
        { label: "RELEASED", sub: "Escrow released from BalanceManager on Arc" },
        { label: "BRIDGING", sub: `CCTP v2 burn on Arc → mint on ${chain}` },
        { label: "ARRIVED", sub: `${tokenSymbol} in your wallet on ${chain}` },
      ];
  // Direct-Arc has only 2 real legs (approve+deposit, or just withdraw) — collapse the
  // 3-step bridge UI down to what's actually happening rather than showing a fake middle step.
  const activeSteps = destination === "VAULT" ? vaultStepDefs : chain === "ARC" ? [stepDefs[0], stepDefs[2]] : stepDefs;
  const activeStepIndex = destination === "VAULT" ? step : chain === "ARC" ? (step >= 2 ? 1 : 0) : step;

  async function handleStart() {
    setPhase("pending");
    try {
      const hash =
        destination === "VAULT"
          ? await vaultDeposit(amount || "0")
          : await run(mode!, chain, token.address, amount || "0", chain === "SOLANA" ? solanaWallet.provider : undefined);
      setTxHash(hash);
      setPhase("success");
    } catch {
      setPhase("form");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-sm"
      style={{ background: "rgba(11,13,18,0.7)" }}
      onClick={onClose}
    >
      <div
        style={{ width: 448, background: "#0E1116", border: "1px solid #2E333D", boxShadow: "0 30px 70px rgba(0,0,0,0.5)", color: "#E7E4DB" }}
        className="font-sans rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-xl px-[22px] py-[18px]" style={{ borderBottom: "1px solid #1C2028", background: "#0C0E13" }}>
          <span className="text-[17px] font-extrabold tracking-[-0.01em]">{isDeposit ? "Deposit — any chain in" : "Withdraw — any chain out"}</span>
          <button onClick={onClose} className="font-mono rounded-md px-2.5 py-1 text-[12px]" style={{ border: "1.5px solid #2E333D", color: "#6A7280" }}>
            ESC
          </button>
        </div>

        {phase === "form" && (
          <div className="px-[22px] py-[22px]">
            {isDeposit && (
              <>
                <div className="font-mono mb-2.5 text-[10px] tracking-[0.12em]" style={{ color: "#6A7280" }}>
                  DEPOSIT INTO
                </div>
                <div className="mb-5 grid grid-cols-2 gap-2.5">
                  {(["TRADING", "VAULT"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDestination(d)}
                      className="rounded-lg py-2.5 text-center"
                      style={{
                        background: destination === d ? "rgba(232,181,77,0.12)" : "#14171E",
                        border: `1.5px solid ${destination === d ? "#E8B54D" : "#2E333D"}`,
                      }}
                    >
                      <div className="font-mono text-[12px] font-bold">{d === "TRADING" ? "Trading balance" : "Earn vault"}</div>
                      <div className="font-mono mt-0.5 text-[9.5px]" style={{ color: "#6A7280" }}>
                        {d === "TRADING" ? "for placing orders" : "earn maker fees + spread"}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="font-mono mb-2.5 text-[10px] tracking-[0.12em]" style={{ color: "#6A7280" }}>
              {isDeposit ? "FROM CHAIN" : "TO CHAIN"}
            </div>
            <div className="mb-5 grid grid-cols-4 gap-2.5">
              {CHAINS.map((c) => {
                const disabled = ((tokenSymbol === "EURC" || destination === "VAULT") && c.id !== "ARC") || (c.id === "SOLANA" && !isDeposit);
                return (
                  <button
                    key={c.id}
                    onClick={() => !disabled && setChain(c.id)}
                    disabled={disabled}
                    title={
                      c.id === "SOLANA" && !isDeposit
                        ? "Withdrawing to Solana isn't supported yet — deposit only"
                        : disabled
                          ? destination === "VAULT"
                            ? "Vault deposits are Arc-direct only for now — bridge to your wallet first"
                            : "EURC has no CCTP bridge path — Arc only"
                          : undefined
                    }
                    className="flex flex-col items-center gap-2 rounded-lg py-3.5 disabled:cursor-not-allowed disabled:opacity-35"
                    style={{
                      background: chain === c.id ? "rgba(232,181,77,0.12)" : "#14171E",
                      border: `1.5px solid ${chain === c.id ? "#E8B54D" : "#2E333D"}`,
                    }}
                  >
                    <div
                      className="relative flex h-[28px] w-[28px] items-center justify-center overflow-hidden rounded-full"
                      style={c.logoBg ? { background: c.logoBg } : undefined}
                    >
                      <Image src={c.logo} alt={c.name} fill sizes="28px" className={c.logoBg ? "object-contain p-1.5" : "object-cover"} />
                    </div>
                    <span className="font-mono text-[11px] font-bold">{c.name}</span>
                  </button>
                );
              })}
            </div>
            {tokenSymbol === "EURC" && (
              <div className="font-mono mb-4 -mt-2.5 text-[10px]" style={{ color: "#6A7280" }}>
                EURC has no CCTP bridge path (USDC-only protocol) — Arc-direct only.
              </div>
            )}
            {destination === "VAULT" && (
              <div className="font-mono mb-4 -mt-2.5 text-[10px]" style={{ color: "#6A7280" }}>
                Vault deposits are USDC-only, Arc-direct only — this deposits straight into KeystoneReserve, not your trading balance.
              </div>
            )}
            {chain === "SOLANA" && isDeposit && (
              <div className="mb-4 flex items-center justify-between rounded-lg p-[12px_14px]" style={{ border: "1px solid #2E333D", background: "#14171E" }}>
                <div>
                  <div className="font-mono text-[11px] font-bold">Solana wallet (devnet)</div>
                  <div className="font-mono mt-0.5 text-[10px]" style={{ color: "#6A7280" }}>
                    {solanaWallet.isConnected
                      ? `${solanaWallet.publicKey!.slice(0, 4)}…${solanaWallet.publicKey!.slice(-4)}`
                      : "Phantom or Solflare, Solana devnet"}
                  </div>
                </div>
                <button
                  onClick={() => (solanaWallet.isConnected ? solanaWallet.disconnect() : solanaWallet.connect())}
                  disabled={solanaWallet.isConnecting}
                  className="font-mono rounded-md px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                  style={{
                    background: solanaWallet.isConnected ? "transparent" : "#E8B54D",
                    color: solanaWallet.isConnected ? "#6A7280" : "#0B0D12",
                    border: solanaWallet.isConnected ? "1.5px solid #2E333D" : "none",
                  }}
                >
                  {solanaWallet.isConnecting ? "CONNECTING…" : solanaWallet.isConnected ? "DISCONNECT" : "CONNECT"}
                </button>
              </div>
            )}
            {solanaWallet.error && chain === "SOLANA" && (
              <div className="font-mono mb-4 -mt-2.5 text-[10px]" style={{ color: "#E5484D" }}>
                {solanaWallet.error}
              </div>
            )}

            <div className="font-mono mb-2 text-[10px] tracking-[0.12em]" style={{ color: "#6A7280" }}>
              AMOUNT
            </div>
            <div className="mb-2 flex rounded-lg" style={{ border: "1.5px solid #2E333D" }}>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="font-mono min-w-0 flex-1 rounded-l-lg p-[14px] text-[20px] outline-none"
                style={{ background: "#14171E", color: "#E7E4DB" }}
              />
              <button
                onClick={() => setAmount(availableHuman.toString())}
                className="font-mono px-[14px] text-[11px] font-bold"
                style={{ background: "#14171E", borderLeft: "1.5px solid #2E333D", color: "#E8B54D" }}
              >
                MAX
              </button>
              <div className="relative">
                <button
                  onClick={() => destination !== "VAULT" && setTokenMenuOpen((v) => !v)}
                  disabled={destination === "VAULT"}
                  className="flex h-full items-center gap-1.5 rounded-r-lg px-[14px] disabled:opacity-60"
                  style={{ background: "#14171E", borderLeft: "1.5px solid #2E333D" }}
                >
                  <Image src={token.logo} alt="" width={18} height={18} />
                  <span className="font-mono text-[13px] font-bold">{tokenSymbol}</span>
                  {destination !== "VAULT" && (
                    <span className="font-mono text-[9px]" style={{ color: "#6A7280" }}>
                      ▾
                    </span>
                  )}
                </button>
                {tokenMenuOpen && destination !== "VAULT" && (
                  <div
                    className="absolute right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-lg"
                    style={{ background: "#14171E", border: "1.5px solid #2E333D", minWidth: 120 }}
                  >
                    {TOKENS.map((t) => (
                      <button
                        key={t.symbol}
                        onClick={() => selectToken(t.symbol)}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#1A1E26]"
                      >
                        <Image src={t.logo} alt="" width={16} height={16} />
                        <span className="font-mono text-[12.5px] font-bold">{t.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="font-mono mb-5 flex justify-between text-[11px]" style={{ color: "#6A7280" }}>
              <span>AVAILABLE</span>
              <span>{availableHuman.toLocaleString("en-US", { maximumFractionDigits: 2 })} {tokenSymbol}</span>
            </div>

            <div className="font-mono mb-5 grid gap-2 rounded-lg p-[12px_14px] text-[11px]" style={{ border: "1px solid #22262E", background: "#101319" }}>
              {destination === "VAULT" ? (
                <>
                  <Row label="ROUTE" value="ARC → Reserve vault" />
                  <Row label="RAIL" value="DIRECT (NO BRIDGE)" />
                  <Row label="FEES" value="< $0.01" valueColor="#2FBF71" />
                  <Row label="EST. TIME" value="~1s" />
                </>
              ) : (
                <>
                  <Row label="ROUTE" value={routeLabel} />
                  <Row label="RAIL" value={railLabel} />
                  <Row label="FEES" value="< $0.01" valueColor="#2FBF71" />
                  <Row label="EST. TIME" value={etaLabel} />
                </>
              )}
            </div>

            {error && (
              <div className="font-mono mb-3 rounded-lg p-2.5 text-[11px]" style={{ background: "rgba(229,72,77,0.12)", color: "#E5484D" }}>
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              disabled={!address || solanaNeedsConnect || !amount || Number(amount) <= 0}
              className="font-mono w-full rounded-lg py-[14px] text-[14px] font-bold tracking-[0.05em] disabled:opacity-40"
              style={{ background: "#E8B54D", color: "#0B0D12" }}
            >
              {!address
                ? "CONNECT WALLET FIRST"
                : solanaNeedsConnect
                  ? "CONNECT SOLANA WALLET"
                  : destination === "VAULT"
                    ? "DEPOSIT INTO VAULT"
                    : isDeposit
                      ? `DEPOSIT ${tokenSymbol}`
                      : `WITHDRAW ${tokenSymbol}`}
            </button>
          </div>
        )}

        {phase === "pending" && (
          <div className="px-[22px] py-[26px]">
            <div className="grid gap-0">
              {activeSteps.map((st, i) => {
                const done = activeStepIndex > i;
                const active = activeStepIndex === i;
                const ringColor = done ? "#2FBF71" : active ? "#E8B54D" : "#2E333D";
                const iconColor = done ? "#08240F" : active ? "#E8B54D" : "#6A7280";
                const labelColor = done ? "#2FBF71" : active ? "#E7E4DB" : "#6A7280";
                return (
                  <div key={st.label} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className="font-mono flex h-[30px] w-[30px] items-center justify-center rounded-full text-[13px] font-bold"
                        style={{
                          border: `2px solid ${ringColor}`,
                          background: done ? "#2FBF71" : "transparent",
                          color: iconColor,
                          animation: active ? "rm-spin 1.1s linear infinite" : "none",
                        }}
                      >
                        {done ? "✓" : active ? "◌" : i + 1}
                      </div>
                      {i < activeSteps.length - 1 && <div className="h-[34px] w-[2px]" style={{ background: done ? "#2FBF71" : "#2E333D" }} />}
                    </div>
                    <div className="pt-1">
                      <div className="font-mono text-[13px] font-bold" style={{ color: labelColor }}>
                        {st.label}
                      </div>
                      <div className="font-mono mt-[3px] text-[11px]" style={{ color: "#6A7280" }}>
                        {st.sub}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="font-mono mt-5 pt-3.5 text-[10px] leading-[1.5]" style={{ borderTop: "1px solid #1C2028", color: "#6A7280" }}>
              {destination === "VAULT"
                ? "Direct deposit into KeystoneReserve on Arc — mints vault shares, no bridging needed."
                : chain === "ARC"
                  ? "Direct escrow into BalanceManager on Arc — no bridging needed."
                  : "Bridging can take a minute. Your funds are never in limbo — each leg is a CCTP v2 transfer you can verify on-chain."}
            </div>
          </div>
        )}

        {phase === "success" && (
          <div className="px-[22px] py-[34px] text-center">
            <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "#2FBF71" }}>
              <span style={{ color: "#08240F", fontSize: 24, fontWeight: 700 }}>✓</span>
            </div>
            <div className="mb-2 text-[21px] font-extrabold tracking-[-0.01em]">
              {destination === "VAULT" ? "Deposited into the Reserve." : isDeposit ? "Credited on Arc." : `Arrived on ${chain}.`}
            </div>
            <div className="font-mono mb-[18px] text-[13px]" style={{ color: "#B8BDC7" }}>
              {amount} {tokenSymbol} {destination === "VAULT" ? "→ ksUSDC vault shares" : isDeposit ? "→ Keystone book balance" : `→ your ${chain} wallet`}
            </div>
            {txHash && (
              <div className="font-mono mb-[22px] text-[11px]" style={{ color: "#6A7280" }}>
                tx <span style={{ color: "#E8B54D" }}>{txHash.slice(0, 10)}…{txHash.slice(-6)}</span>
              </div>
            )}
            <button onClick={onClose} className="font-mono rounded-lg px-8 py-3 text-[13px] font-bold" style={{ background: "#E8B54D", color: "#0B0D12" }}>
              DONE
            </button>
          </div>
        )}

        <div className="flex items-center justify-between rounded-b-xl px-[22px] py-3" style={{ borderTop: "1px solid #1C2028", background: "#0C0E13" }}>
          <span className="font-mono text-[10px]" style={{ color: "#6A7280" }}>
            {destination === "VAULT" ? "KEYSTONE RESERVE · ERC-4626" : "CIRCLE GATEWAY · CCTP V2"}
          </span>
          {destination !== "VAULT" && (
            <span className="font-mono text-[10px] font-bold" style={{ color: "#6A7280" }}>
              CIRCLE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "#6A7280" }}>{label}</span>
      <span style={{ color: valueColor ?? "#E7E4DB" }}>{value}</span>
    </div>
  );
}
