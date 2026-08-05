"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { CURRENCIES, type CurrencyCode } from "@/lib/currency";

const links = [
  { href: "/trade", label: "TRADE" },
  { href: "/earn", label: "EARN" },
  { href: "/portfolio", label: "PORTFOLIO" },
  { href: "/transparency", label: "TRANSPARENCY" },
  { href: "/docs", label: "DOCS" },
];

const CURRENCY_LABEL: Record<CurrencyCode, string> = {
  USD: "$ USD",
  EUR: "€ EUR",
  PHP: "₱ PHP",
  BRL: "R$ BRL",
  NGN: "₦ NGN",
  JPY: "¥ JPY",
  MXN: "$ MXN",
  KRW: "₩ KRW",
};

export function EarnNav({ currency, onCurrency }: { currency: CurrencyCode; onCurrency: (c: CurrencyCode) => void }) {
  const pathname = usePathname();
  const { isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const injectedConnector = connectors.find((c) => c.type === "injected") ?? connectors[0];

  return (
    <nav className="flex h-[58px] flex-none items-center justify-between border-b border-ink-line bg-panel px-[22px]">
      <div className="flex items-center gap-[26px]">
        <Link href="/" className="flex items-center gap-2.5 text-ink">
          <Image src="/brand/arc-network.svg" alt="" width={28} height={28} className="rounded-md" />
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
      <div className="flex items-center gap-3">
        <select
          value={currency}
          onChange={(e) => onCurrency(e.target.value as CurrencyCode)}
          className="font-mono rounded-md border-[1.5px] border-ink-line bg-parchment px-2 py-[7px] text-[12px] text-ink outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {CURRENCY_LABEL[c]}
            </option>
          ))}
        </select>
        {isConnected ? (
          <Link
            href="/settings"
            className="font-mono rounded-md border-[1.5px] border-ink-line px-3 py-2 text-[12px] text-bid transition-colors hover:border-ink-soft"
          >
            ● 1 WALLET
          </Link>
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
