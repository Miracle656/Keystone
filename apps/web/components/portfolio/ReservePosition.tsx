import Link from "next/link";

export function ReservePosition({ shares, sharePrice, valueUsd }: { shares: number; sharePrice: number; valueUsd: number }) {
  const rows = [
    { label: "SHARES", value: `${shares.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kUSDC` },
    { label: "SHARE PRICE", value: sharePrice.toFixed(4) },
    { label: "VALUE", value: `${valueUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })} USDC` },
  ];

  return (
    <div className="rounded-2xl border border-ink-line bg-panel p-6">
      <div className="font-mono mb-4 text-[10px] tracking-[0.14em] text-ink-soft">RESERVE POSITION — ERC-4626</div>
      <div className="flex flex-col gap-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between">
            <span className="font-mono text-[12px] text-ink-soft">{r.label}</span>
            <span className="font-mono text-[13px] font-semibold text-ink">{r.value}</span>
          </div>
        ))}
      </div>
      <Link
        href="/earn"
        className="font-mono mt-5 block rounded-lg border-[1.5px] border-gold px-4 py-3 text-center text-[12px] font-bold text-gold transition-colors hover:bg-gold hover:text-cream"
      >
        MANAGE IN EARN →
      </Link>
    </div>
  );
}
