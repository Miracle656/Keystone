"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useRouterModal } from "./RouterModalProvider";

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
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { open } = useRouterModal();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];

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
            onClick={() => disconnect()}
            className="font-mono rounded-md border border-[#2E333D] px-3 py-2 text-[12px] text-bid"
            title="Click to disconnect"
          >
            ● {short(address)}
          </button>
        ) : (
          <button
            onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            disabled={isPending || !injectedConnector}
            className="font-mono rounded-md border border-[#2E333D] px-3 py-2 text-[12px] text-[#7A828F] transition-colors hover:border-[#565D6B] hover:text-ink disabled:opacity-50"
          >
            {isPending ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
