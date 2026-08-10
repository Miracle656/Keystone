const CONTRACTS = [
  { name: "PairRegistry", addr: "0xF51eBb0Ed5AD4F5ab23a7b37163bBA24463EA6D9", tag: "REAL" },
  { name: "BalanceManager", addr: "0x79CE00b1345E9D64830F17FbDD298851BDa6a5a8", tag: "REAL" },
  { name: "KeystoneBook", addr: "0x03ce491b31180bB14848F508fA418b92962Df21a", tag: "REAL" },
  { name: "FeeCollector", addr: "0xC1D3593fB76416FE3AC3422f4773938809b765db", tag: "REAL" },
  { name: "KeystoneReserve", addr: "0x3cbEb36CB35192A574EAd5E1FB4D61f1A7b45Eb3", tag: "REAL" },
  { name: "MockOracle", addr: "0xD7b7b802241506f833331c84477D97546b9Fc7c4", tag: "SIMULATED" },
  { name: "MockUSDT", addr: "0x061e59E532B9C852d747a3a0b36CEa698b9F6d5A", tag: "PAUSED PAIR" },
] as const;

const TAG_COLOR: Record<(typeof CONTRACTS)[number]["tag"], string> = {
  REAL: "text-bid border-bid",
  SIMULATED: "text-gold border-gold",
  "PAUSED PAIR": "text-ink-faint border-ink-line",
};

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function AddressesCard() {
  return (
    <div className="rounded-2xl border border-ink-line bg-panel">
      <div className="font-mono border-b border-ink-line px-[22px] py-4 text-[11px] tracking-[0.14em] text-ink-soft">
        CONTRACT ADDRESSES — ARC TESTNET
      </div>
      <div className="px-[22px] py-1">
        {CONTRACTS.map((c) => (
          <div key={c.name} className="flex items-center justify-between border-b border-ink-line-soft py-[11px] last:border-b-0">
            <span className="font-mono text-[12px] font-bold text-ink">{c.name}</span>
            <span className="flex items-center gap-2">
              <a
                href={`https://testnet.arcscan.app/address/${c.addr}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-gold hover:text-ink"
              >
                {short(c.addr)}
              </a>
              <span className={`font-mono rounded border-[1.5px] px-[5px] py-[1px] text-[9px] ${TAG_COLOR[c.tag]}`}>{c.tag}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-line px-[22px] py-3 text-[11px] text-ink-faint">
        Not verified on Arcscan yet — source shows unverified. ABI lives in the repo, see below.
      </div>
    </div>
  );
}
