import Image from "next/image";
import Link from "next/link";

const links = [
  { href: "/trade", label: "Trade" },
  { href: "/earn", label: "Earn" },
  { href: "/transparency", label: "Transparency" },
  { href: "/docs", label: "Docs" },
];

export function Nav() {
  return (
    <nav className="mx-auto flex max-w-[1280px] items-center justify-between px-[30px] py-5">
      <div className="flex items-center gap-3">
        <Image
          src="/brand/arc-network.svg"
          alt=""
          width={34}
          height={34}
          className="rounded-lg"
        />
        <span className="text-[21px] font-extrabold tracking-[-0.02em]">Keystone</span>
      </div>
      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="px-[15px] py-[9px] text-[14.5px] font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            {l.label}
          </Link>
        ))}
        <Link
          href="/trade"
          className="ml-3 rounded-md bg-ink px-[22px] py-[11px] text-[14.5px] font-bold text-cream transition-colors hover:bg-gold hover:text-cream"
        >
          Launch app
        </Link>
      </div>
    </nav>
  );
}
