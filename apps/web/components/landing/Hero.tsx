"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { KeystoneArch } from "./KeystoneArch";

export function Hero() {
  const eyeRef = useRef<HTMLDivElement>(null);
  const l1Ref = useRef<HTMLSpanElement>(null);
  const l2Ref = useRef<HTMLSpanElement>(null);
  const l3Ref = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const tl = gsap.timeline();
    tl.fromTo(eyeRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" });
    tl.fromTo(
      [l1Ref.current, l2Ref.current, l3Ref.current],
      { clipPath: "inset(0 0 108% 0)", y: 6 },
      {
        clipPath: "inset(0 0 -10% 0)",
        y: 0,
        duration: 0.7,
        stagger: 0.11,
        ease: "power3.out",
        clearProps: "clipPath,transform",
      },
      "-=0.2",
    );
    tl.fromTo(
      [subRef.current, ctaRef.current],
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "transform" },
      "-=0.3",
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-8 px-[30px] pb-5 pt-7 lg:grid-cols-[1.06fr_0.94fr]">
      <div>
        <div
          ref={eyeRef}
          className="mb-[22px] flex items-center gap-3 font-mono text-xs tracking-[0.18em] text-gold"
        >
          <span className="inline-block h-px w-[30px] bg-gold" />
          THE LOAD-BEARING MARKET OF ARC
        </div>
        <h1 className="m-0 mb-6 font-display text-[42px] leading-[0.99] tracking-[-0.02em] sm:text-[57px]">
          <span ref={l1Ref} className="block whitespace-nowrap">
            The on-chain
          </span>
          <span ref={l2Ref} className="block whitespace-nowrap">
            order book for
          </span>
          <span ref={l3Ref} className="relative block whitespace-nowrap italic text-gold-bright">
            internet money
            <span className="absolute bottom-1.5 left-0.5 right-0.5 -z-10 h-[9px] bg-gold-bright opacity-[0.3]" />
          </span>
        </h1>
        <p ref={subRef} className="m-0 mb-[34px] max-w-[440px] text-lg leading-[1.55] text-ink-soft">
          Any chain in. Arc execution. Real yield out. Matching happens fully on-chain — every
          fill is an event with a hash.
        </p>
        <div ref={ctaRef} className="flex flex-wrap items-center gap-3">
          <Link
            href="/trade"
            className="rounded-md bg-ink px-7 py-[15px] text-[15.5px] font-bold text-cream transition-colors hover:bg-gold hover:text-cream"
          >
            Start trading
          </Link>
          <Link
            href="/earn"
            className="whitespace-nowrap rounded-md border-[1.5px] border-ink/24 px-[26px] py-[15px] text-[15.5px] font-bold text-ink transition-colors hover:border-ink hover:bg-ink/4"
          >
            Earn real yield →
          </Link>
        </div>
      </div>

      <KeystoneArch />
    </section>
  );
}
