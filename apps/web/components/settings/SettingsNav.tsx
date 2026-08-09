"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/trade", label: "TRADE" },
  { href: "/earn", label: "EARN" },
  { href: "/portfolio", label: "PORTFOLIO" },
  { href: "/transparency", label: "TRANSPARENCY" },
  { href: "/docs", label: "DOCS" },
];

export function SettingsNav() {
  const pathname = usePathname();

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
      <Link
        href="/settings"
        className="font-mono rounded-md border-[1.5px] border-ink-line px-3 py-2 text-[12px] text-ink transition-colors hover:border-ink-soft"
      >
        SETTINGS
      </Link>
    </nav>
  );
}
