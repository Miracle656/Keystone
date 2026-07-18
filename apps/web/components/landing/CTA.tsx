import Link from "next/link";
import { Reveal } from "./Reveal";

export function CTA() {
  return (
    <section className="mx-auto mt-[120px] max-w-[1280px] px-[30px]">
      <Reveal>
        <div className="relative overflow-hidden rounded-[10px] border border-gold/25 bg-panel px-7 py-14 sm:px-14 sm:py-[76px]">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "repeating-linear-gradient(90deg, transparent 0 47px, rgba(245,241,230,0.04) 47px 48px), radial-gradient(80% 120% at 90% -10%, rgba(231,178,90,0.22), transparent 55%)",
            }}
          />
          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div>
              <h2 className="m-0 mb-4 font-display text-[36px] leading-none tracking-[-0.01em] text-ink sm:text-[50px]">
                Any chain in.
                <br />
                Arc execution.
                <br />
                <span className="text-gold-bright">Real yield out.</span>
              </h2>
              <p className="m-0 text-[17px] text-ink-soft">
                The load-bearing market of Arc, spanning every chain USDC lives on.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/trade"
                className="rounded-md bg-gold-bright px-7 py-[15px] text-[15.5px] font-bold text-cream transition-colors hover:bg-gold"
              >
                Launch app
              </Link>
              <Link
                href="/docs"
                className="whitespace-nowrap rounded-md border-[1.5px] border-ink-line px-[26px] py-[15px] text-[15.5px] font-bold text-ink transition-colors hover:border-gold hover:text-gold"
              >
                Read the docs →
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
