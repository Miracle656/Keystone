"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { useRouterModal } from "@/components/app/RouterModalProvider";

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

// Same navy tokens as EarnNav (Portfolio sits in that brand, not Trade's separate near-black
// terminal), but with AppNav's Deposit/Withdraw/settings/wallet-chip action set on the right —
// Portfolio is a place you act from, not just a currency display like Earn's selector.
export function PortfolioNav() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { open } = useRouterModal();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];

  return (
    <nav className="flex h-[58px] flex-none items-center justify-between border-b border-ink-line bg-panel px-[22px]">
      <div className="flex items-center gap-[26px]">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Image src="/brand/keystone-icon.svg" alt="" width={28} height={28} className="rounded-md" />
          <span className="text-[18px] font-extrabold tracking-[-0.02em]">Keystone</span>
        </Link>
        <div className="font-mono flex gap-1.5 text-[12px] font-semibold tracking-[0.04em]">
          {links.map((l) => {
            const active = pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 transition-colors ${
                  active ? "bg-ink-line-soft text-ink" : "text-ink-soft hover:text-ink"
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
          className="font-mono rounded-md bg-gold px-[15px] py-[9px] text-[12px] font-bold text-cream transition-[filter] hover:brightness-110"
        >
          DEPOSIT
        </button>
        <button
          onClick={() => open("withdraw")}
          className="font-mono rounded-md border-[1.5px] border-ink-line bg-transparent px-[15px] py-[9px] text-[12px] font-bold text-ink transition-colors hover:border-ink-soft"
        >
          WITHDRAW
        </button>
        <Link
          href="/settings"
          className="font-mono flex items-center rounded-md border-[1.5px] border-ink-line px-[11px] py-2 text-[13px] text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          aria-label="Settings"
        >
          ⚙
        </Link>
        {isConnected && address ? (
          <span className="font-mono rounded-md border-[1.5px] border-ink-line px-3 py-2 text-[12px] text-bid">
            ● {short(address)}
          </span>
        ) : (
          <button
            onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            disabled={isPending || !injectedConnector}
            className="font-mono rounded-md border-[1.5px] border-ink-line px-3 py-2 text-[12px] text-ink-soft transition-colors hover:border-ink-soft hover:text-ink disabled:opacity-50"
          >
            {isPending ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
    </nav>
  );
}
