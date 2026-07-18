import { Fragment } from "react";
import { Reveal } from "./Reveal";

const rows = [
  { label: "Finality", l1: "~12s", l1Color: "text-ink-faint", arc: "~780ms", arcColor: "text-bid" },
  { label: "Fee / cancel", l1: "volatile $$", l1Color: "text-ink-faint", arc: "<$0.01 flat", arcColor: "text-bid" },
  { label: "On-chain CLOB", l1: "impossible", l1Color: "text-ask", arc: "Keystone", arcColor: "text-ink" },
];

export function Thesis() {
  return (
    <section className="mx-auto mt-[120px] max-w-[1280px] px-[30px]">
      <Reveal>
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <div className="font-mono text-[64px] font-bold leading-[0.8] tracking-[-0.04em] text-ink opacity-[0.14] sm:text-[90px]">
              01
            </div>
            <div className="my-4 font-mono text-xs tracking-[0.16em] text-gold">THE THESIS</div>
            <h2 className="m-0 font-display text-[30px] leading-[1.06] tracking-[-0.01em] sm:text-[40px]">
              On-chain books were impossible on EVM. Arc changed the physics.
            </h2>
          </div>
          <div className="pt-2">
            <p className="m-0 mb-[34px] text-lg leading-[1.62] text-ink-muted">
              Every place, cancel, and match is a transaction. On chains with volatile gas,
              market makers refreshing quotes hundreds of times a day bleed to death — so
              serious books went off-chain, or died. Arc gives an EVM chain sub-second
              deterministic finality and flat, sub-cent fees for the first time. The enabling
              conditions now exist. The slot is empty. Keystone fills it.
            </p>
            <div className="border-t border-ink-line">
              <div className="grid grid-cols-[1.3fr_1fr_1fr] font-mono text-sm">
                <div className="px-2 py-[15px] text-ink-faint" />
                <div className="px-2 py-[15px] text-ink-faint">ETHEREUM L1</div>
                <div className="px-2 py-[15px] font-bold text-gold">ARC</div>
                {rows.map((row) => (
                  <Fragment key={row.label}>
                    <div className="border-t border-ink-line-soft px-2 py-[15px] text-ink-muted">
                      {row.label}
                    </div>
                    <div className={`border-t border-ink-line-soft px-2 py-[15px] ${row.l1Color}`}>
                      {row.l1}
                    </div>
                    <div className={`border-t border-ink-line-soft px-2 py-[15px] font-bold ${row.arcColor}`}>
                      {row.arc}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
