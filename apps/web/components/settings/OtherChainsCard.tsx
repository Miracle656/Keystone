"use client";

import { useSolanaWallet } from "@/lib/hooks/useSolanaWallet";

export function OtherChainsCard() {
  const solanaWallet = useSolanaWallet();

  return (
    <div className="mb-[18px] rounded-2xl border border-ink-line bg-panel">
      <div className="border-b border-ink-line px-[22px] py-[18px]">
        <div className="font-mono text-[11px] tracking-[0.14em] text-ink-soft">OTHER CHAIN WALLETS</div>
        <div className="mt-1.5 text-[13px] text-ink-muted">
          The Router moves USDC in today over Circle&apos;s Gateway and CCTP v2. Solana is wired up (devnet, deposit-only for now); Sui
          isn&apos;t connected yet — listed honestly as not-yet, not as a working button.
        </div>
      </div>
      <div className="divide-y divide-ink-line">
        <div className="flex items-center justify-between px-[22px] py-4">
          <div>
            <div className="font-mono text-[12px] font-bold text-ink">Solana</div>
            <div className="mt-1 text-[11.5px] text-ink-faint">
              {solanaWallet.isConnected
                ? `${solanaWallet.publicKey!.slice(0, 4)}…${solanaWallet.publicKey!.slice(-4)} · devnet`
                : "SVM — devnet, deposit into Keystone only (see Router)."}
            </div>
          </div>
          <button
            onClick={() => (solanaWallet.isConnected ? solanaWallet.disconnect() : solanaWallet.connect())}
            disabled={solanaWallet.isConnecting}
            className={`font-mono rounded-md border-[1.5px] px-3 py-2 text-[10px] tracking-[0.08em] transition-colors disabled:opacity-50 ${
              solanaWallet.isConnected ? "border-bid text-bid" : "border-ink-line text-ink-soft hover:border-ink-soft hover:text-ink"
            }`}
          >
            {solanaWallet.isConnecting ? "CONNECTING…" : solanaWallet.isConnected ? "● CONNECTED · DISCONNECT" : "CONNECT"}
          </button>
        </div>
        <div className="flex items-center justify-between px-[22px] py-4">
          <div>
            <div className="font-mono text-[12px] font-bold text-ink">Sui</div>
            <div className="mt-1 text-[11.5px] text-ink-faint">Move VM — needs a separate wallet standard (e.g. @mysten/dapp-kit).</div>
          </div>
          <span className="font-mono rounded-md border-[1.5px] border-ink-line px-3 py-2 text-[10px] tracking-[0.08em] text-ink-faint">
            NOT YET CONNECTED
          </span>
        </div>
      </div>
    </div>
  );
}
