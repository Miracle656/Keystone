"use client";

import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { arcTestnet } from "@/lib/wagmi";
import { baseSepolia, arbitrumSepolia } from "viem/chains";

const CHAINS = [
  { id: arcTestnet.id, label: "ARC TESTNET" },
  { id: baseSepolia.id, label: "BASE SEPOLIA" },
  { id: arbitrumSepolia.id, label: "ARBITRUM SEPOLIA" },
];

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletCard() {
  const { address, isConnected, chainId, connector } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];

  return (
    <div className="mb-[18px] rounded-2xl border border-ink-line bg-panel">
      <div className="border-b border-ink-line px-[22px] py-[18px]">
        <div className="font-mono text-[11px] tracking-[0.14em] text-ink-soft">WALLET</div>
        <div className="mt-1.5 text-[13px] text-ink-muted">
          Keystone reads and writes directly against your connected wallet — no custody, ever.
        </div>
      </div>

      {!isConnected ? (
        <div className="p-[22px]">
          <button
            onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            disabled={isConnecting || !injectedConnector}
            className="font-mono rounded-md bg-gold px-4 py-2.5 text-[12px] font-bold text-cream transition-[filter] hover:brightness-110 disabled:opacity-50"
          >
            {isConnecting ? "CONNECTING…" : "CONNECT WALLET"}
          </button>
        </div>
      ) : (
        <div className="p-[22px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-[15px] font-bold text-ink">{address ? short(address) : ""}</div>
              <div className="mt-1 text-[11px] text-ink-faint">{connector?.name ?? "Injected wallet"}</div>
            </div>
            <button
              onClick={() => disconnect()}
              className="font-mono rounded-md border-[1.5px] border-ink-line px-3 py-2 text-[11px] text-ink-soft transition-colors hover:border-ask hover:text-ask"
            >
              DISCONNECT
            </button>
          </div>

          <div className="font-mono mb-2.5 text-[10px] tracking-[0.12em] text-ink-faint">NETWORK</div>
          <div className="flex flex-wrap gap-2">
            {CHAINS.map((c) => {
              const active = chainId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => !active && switchChain({ chainId: c.id })}
                  disabled={active || isSwitching}
                  className={`font-mono rounded-md border-[1.5px] px-3 py-2 text-[11px] transition-colors disabled:cursor-default ${
                    active ? "border-bid text-bid" : "border-ink-line text-ink-soft hover:border-ink-soft hover:text-ink"
                  }`}
                >
                  {active ? "● " : ""}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
