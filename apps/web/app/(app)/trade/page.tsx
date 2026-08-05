import { AppNav } from "@/components/app/AppNav";
import { PairStatsBar } from "@/components/trade/PairStatsBar";
import { CandleChart } from "@/components/trade/CandleChart";
import { OpenOrders } from "@/components/trade/OpenOrders";
import { Ladder } from "@/components/trade/Ladder";
import { OrderTicket } from "@/components/trade/OrderTicket";

const PAIR_ID = 0;

export default function TradePage() {
  return (
    // bg-parchment is solid here (not the root layout's ambient gradient) — it fully covers
    // Landing's fixed navy-gradient background div, since app-theme's page bg is meant to be a
    // flat near-black, not the navy glow. h-screen + overflow-hidden: Trade is a fixed-viewport
    // terminal (per its mockup), not a normally-scrolling page.
    <div className="app-theme flex h-screen flex-col overflow-hidden bg-parchment font-sans text-ink">
      <AppNav />
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <PairStatsBar pairId={PAIR_ID} />

        <div className="grid min-h-0 flex-1 grid-cols-[1fr_288px_300px]">
          <div className="flex min-h-0 flex-col border-r border-[#1C2028]">
            <CandleChart pairId={PAIR_ID} />
            <OpenOrders />
          </div>

          <Ladder pairId={PAIR_ID} />

          <OrderTicket />
        </div>
      </div>
    </div>
  );
}
