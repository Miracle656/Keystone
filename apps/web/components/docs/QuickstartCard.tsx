const SNIPPET = `import { createWalletClient, createPublicClient, http, parseAbi } from "viem"
import { privateKeyToAccount } from "viem/accounts"

const arcTestnet = {
  id: 5042002,
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
}
const BOOK = "0x03ce491b31180bB14848F508fA418b92962Df21a"
const PAIR_ID = 0n // USDC/EURC

const bookAbi = parseAbi([
  "function placeLimit(uint256,bool,uint256,uint256,uint32,uint256) returns (uint256,uint256)",
  "function bestBid(uint256) view returns (uint256)",
])

const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const wallet = createWalletClient({ account, chain: arcTestnet, transport: http() })
const client = createPublicClient({ chain: arcTestnet, transport: http() })

// Needs escrowed balance first -- BalanceManager.deposit(token, amount) -- the
// Book pulls from escrow, not your wallet balance directly. price is 1e6-scaled.
const bid = await client.readContract({
  address: BOOK, abi: bookAbi, functionName: "bestBid", args: [PAIR_ID],
})

await wallet.writeContract({
  address: BOOK, abi: bookAbi, functionName: "placeLimit",
  args: [PAIR_ID, true, bid - 100n, 1_000_000n, /* POST_ONLY */ 1, 0n],
})
// ~32,000 gas -- well under a cent on Arc`;

export function QuickstartCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gold bg-panel shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="flex items-center justify-between border-b border-ink-line px-[22px] py-4">
        <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-gold">PLACE A REAL ORDER — TYPESCRIPT · VIEM</span>
        <span className="font-mono text-[10px] text-ink-faint">no SDK, direct contract call</span>
      </div>
      <pre className="font-mono m-0 overflow-x-auto p-[22px] text-[12px] leading-[1.7] text-ink-muted">
        <code>{SNIPPET}</code>
      </pre>
      <div className="flex items-center justify-between border-t border-ink-line px-[22px] py-3.5 text-[11px]">
        <span className="text-ink-faint">
          There&apos;s no published <span className="text-ink">@keystone/sdk</span> — this is the real ABI, called directly.
        </span>
        <a
          href="https://github.com/Miracle656/Keystone/blob/main/packages/engine/src/mm-bot/index.ts"
          target="_blank"
          rel="noreferrer"
          className="flex-none text-gold hover:text-ink"
        >
          FULL BOT REFERENCE →
        </a>
      </div>
    </div>
  );
}
