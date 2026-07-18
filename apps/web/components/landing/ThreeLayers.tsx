import { Reveal } from "./Reveal";

const layers = [
  {
    no: "01",
    title: "The Book",
    tag: "CLOB · ON-CHAIN",
    body: "A permissionless, fully on-chain central limit order book. Price-time priority, limit & market orders, bounded matching. Flagship pair USDC/EURC — on-chain FX. Every fill is a verifiable event.",
  },
  {
    no: "02",
    title: "The Router",
    tag: "GATEWAY · CCTP v2",
    body: "USDC from any supported chain enters via Circle Gateway unified balance and CCTP v2, trades on Arc, and exits to any chain. One balance in, Arc execution, any chain out.",
  },
  {
    no: "03",
    title: "Earn",
    tag: "ERC-4626 · REAL YIELD",
    body: "A reserve vault that provides passive liquidity to the Book. Depositors earn real maker fees and spread from actual trading — one number, growing, with receipts.",
  },
];

export function ThreeLayers() {
  return (
    <section className="mx-auto mt-[130px] max-w-[1280px] px-[30px]">
      <Reveal>
        <div className="mb-1 flex flex-wrap items-end justify-between gap-4 border-b-[1.5px] border-ink pb-[18px]">
          <div className="flex items-end gap-4">
            <span className="font-mono text-4xl font-bold leading-none text-ink opacity-[0.16] sm:text-5xl">
              02
            </span>
            <h2 className="m-0 font-display text-[32px] leading-none tracking-[-0.01em] sm:text-[44px]">
              The Book. The Router. Earn.
            </h2>
          </div>
          <span className="font-mono text-xs tracking-[0.16em] text-gold">
            THREE LAYERS, ONE PROTOCOL
          </span>
        </div>
      </Reveal>
      {layers.map((ly, i) => (
        <Reveal key={ly.no} delay={i * 0.06}>
          <div className="grid grid-cols-1 items-center gap-6 border-b border-ink-line py-9 px-1 sm:grid-cols-[88px_1fr] lg:grid-cols-[88px_1fr_1.5fr_200px] lg:gap-8">
            <div className="font-mono text-4xl font-bold text-ink opacity-[0.16]">{ly.no}</div>
            <h3 className="m-0 font-display text-[27px] tracking-[-0.01em]">{ly.title}</h3>
            <p className="m-0 text-base leading-[1.55] text-ink-muted">{ly.body}</p>
            <div className="font-mono text-xs tracking-[0.06em] text-gold lg:text-right">{ly.tag}</div>
          </div>
        </Reveal>
      ))}
    </section>
  );
}
