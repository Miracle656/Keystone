import { DocsNav } from "@/components/docs/DocsNav";
import { AddressesCard } from "@/components/docs/AddressesCard";
import { EventsCard } from "@/components/docs/EventsCard";
import { FunctionsCard } from "@/components/docs/FunctionsCard";
import { IndexerApiCard } from "@/components/docs/IndexerApiCard";
import { QuickstartCard } from "@/components/docs/QuickstartCard";

export default function DocsPage() {
  return (
    <div className="min-h-screen text-ink" style={{ fontFamily: "var(--font-figtree), sans-serif" }}>
      <DocsNav />

      <div className="mx-auto max-w-[1180px] px-6 py-9 pb-[90px]">
        <h1 className="mb-2.5 text-[40px] font-extrabold tracking-[-0.03em]">Build on the Book.</h1>
        <p className="mb-8 max-w-[680px] text-[15px] text-ink-muted">
          Keystone is public market infrastructure — permissionless contracts, deterministic events, flat sub-cent fees. No API key,
          no allowlist, no published SDK to install: everything below is the real ABI and a real read API, called directly.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[5fr_7fr]">
          <div className="grid gap-6">
            <AddressesCard />
            <FunctionsCard />
            <EventsCard />
          </div>
          <div className="grid gap-6">
            <QuickstartCard />
            <IndexerApiCard />
          </div>
        </div>
      </div>
    </div>
  );
}
