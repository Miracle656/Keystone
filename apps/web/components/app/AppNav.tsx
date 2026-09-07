"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useRouterModal } from "./RouterModalProvider";
import { useWalletConnect } from "@/lib/hooks/useWalletConnect";
import { usePasskeyWallet } from "@/lib/hooks/usePasskeyWallet";

const links = [
  { href: "/trade", label: "TRADE" },
  { href: "/earn", label: "EARN" },
  { href: "/portfolio", label: "PORTFOLIO" },
  { href: "/transparency", label: "TRANSPARENCY" },
  { href: "/docs", label: "DOCS" },
];

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function AppNav() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { ready, connectWallet, disconnectWallet } = useWalletConnect();
  const { createWallet, busy: passkeyBusy } = usePasskeyWallet();
  const { open } = useRouterModal();

  return (
    <nav className="flex h-[54px] flex-none items-center justify-between border-b border-[#1C2028] bg-[#0E1116] px-[18px]">
      <div className="flex items-center gap-[26px]">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Image src="/brand/keystone-icon.svg" alt="" width={26} height={26} className="rounded-md" />
          <span className="text-[17px] font-extrabold tracking-[-0.02em]">Keystone</span>
        </Link>
        <div className="font-mono flex gap-1 text-[12px] font-semibold tracking-[0.03em]">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-[11px] py-[7px] transition-colors ${
                  active ? "bg-[#1A1E26] text-ink" : "text-[#7A828F] hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-[9px]">
        <button
          onClick={() => open("deposit")}
          className="font-mono rounded-md bg-gold px-[15px] py-[9px] text-[12px] font-bold text-[#0B0D12] transition-[filter] hover:brightness-110"
        >
          DEPOSIT
        </button>
        <button
          onClick={() => open("withdraw")}
          className="font-mono rounded-md border border-[#2E333D] bg-transparent px-[15px] py-[9px] text-[12px] font-bold text-ink transition-colors hover:border-[#565D6B]"
        >
          WITHDRAW
        </button>
        <Link
          href="/settings"
          className="font-mono flex items-center rounded-md border border-[#2E333D] px-[11px] py-[8px] text-[13px] text-[#7A828F] transition-colors hover:border-[#565D6B] hover:text-ink"
          aria-label="Settings"
        >
          ⚙
        </Link>
        {isConnected && address ? (
          <button
            onClick={() => disconnectWallet()}
            className="font-mono rounded-md border border-[#2E333D] px-3 py-2 text-[12px] text-bid"
            title="Click to disconnect"
          >
            ● {short(address)}
          </button>
        ) : (
          <>
            {/* Primary path for someone with no wallet yet — passkey, no seed phrase. */}
            <button
              onClick={() => createWallet()}
              disabled={!ready || passkeyBusy}
              className="font-mono rounded-md bg-gold px-3 py-2 text-[12px] font-bold text-[#0B0D12] transition-[filter] hover:brightness-110 disabled:opacity-50"
            >
              Get started
            </button>
            {/* Secondary path for someone who already has MetaMask/another wallet. */}
            <button
              onClick={() => connectWallet()}
              disabled={!ready}
              className="font-mono rounded-md border border-[#2E333D] px-3 py-2 text-[12px] text-[#7A828F] transition-colors hover:border-[#565D6B] hover:text-ink disabled:opacity-50"
            >
              Connect wallet
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
