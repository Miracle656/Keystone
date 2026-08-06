import Image from "next/image";

type TokenBalance = { escrowed: number; free: number; locked: number };

const ROWS: { key: "usdc" | "eurc"; name: string; logo: string }[] = [
  { key: "usdc", name: "USDC", logo: "/brand/usdc.svg" },
  { key: "eurc", name: "EURC", logo: "/brand/eurc.svg" },
];

export function BookBalances({ usdc, eurc }: { usdc: TokenBalance; eurc: TokenBalance }) {
  const balances = { usdc, eurc };

  return (
    <div className="rounded-2xl border border-ink-line bg-panel p-6">
      <div className="font-mono mb-4 text-[10px] tracking-[0.14em] text-ink-soft">BOOK BALANCES — BALANCEMANAGER ESCROW</div>
      <div className="flex flex-col gap-3.5">
        {ROWS.map((r) => {
          const b = balances[r.key];
          return (
            <div key={r.key} className="flex items-center justify-between border-b border-ink-line-soft pb-3.5 last:border-0 last:pb-0">
              <div className="flex items-center gap-2.5">
                <Image src={r.logo} alt="" width={26} height={26} className="rounded-full" />
                <div>
                  <div className="text-[14px] font-bold text-ink">{r.name}</div>
                  <div className="font-mono text-[11.5px] text-ink-soft">
                    {b.free.toLocaleString("en-US", { minimumFractionDigits: 2 })} free · {b.locked.toLocaleString("en-US", { minimumFractionDigits: 2 })} in orders
                  </div>
                </div>
              </div>
              <div className="font-mono text-[17px] font-bold text-ink">{b.escrowed.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
