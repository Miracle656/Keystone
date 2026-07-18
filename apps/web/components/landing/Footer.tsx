import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto mt-14 flex max-w-[1280px] flex-wrap items-center justify-between gap-5 border-t border-ink-line px-[30px] pb-[60px] pt-[30px]">
      <div className="flex items-center gap-3.5">
        <span className="font-mono text-xs text-ink-faint">BUILT ON</span>
        <Image src="/brand/arc-network.svg" alt="Arc" width={26} height={26} className="rounded-md" />
        <span className="ml-2.5 font-mono text-xs text-ink-faint">SETTLED IN</span>
        <Image src="/brand/usdc.svg" alt="USDC" width={24} height={24} className="h-6 w-auto" />
        <Image src="/brand/eurc.svg" alt="EURC" width={24} height={24} className="h-6 w-auto" />
      </div>
      <div className="flex gap-[22px] font-mono text-[13px]">
        <Link href="/transparency" className="hover:text-gold">TRANSPARENCY</Link>
        <Link href="/docs" className="hover:text-gold">DOCS</Link>
        <Link href="/settings" className="hover:text-gold">SETTINGS</Link>
      </div>
    </footer>
  );
}
