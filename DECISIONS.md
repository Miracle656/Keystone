# Keystone — Decisions Log

Running log of verified facts, doc discrepancies vs the PRD/kickoff prompt, and judgment
calls. Newest entries at the bottom of each section. If official docs ever contradict this
prompt or this log, the docs win — update here and proceed.

---

## Phase 0 — Ground truth (2026-07-16)

### Chain config — CONFIRMED against docs.arc.io

All PRD-assumed values for Arc Testnet were correct:

| Value | PRD assumption | Verified | Source |
|---|---|---|---|
| Chain ID | 5042002 | ✅ 5042002 | `/arc/references/connect-to-arc` |
| Primary RPC | `https://rpc.testnet.arc.network` | ✅ confirmed | same |
| Explorer | `https://testnet.arcscan.app` | ✅ confirmed | same |
| USDC | `0x3600000000000000000000000000000000000000` | ✅ confirmed, 6 decimals (ERC-20 view) | `/arc/references/contract-addresses` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` | ✅ confirmed, 6 decimals | same |

Additional RPC/WS fallback providers recorded (Blockdaemon, dRPC, QuickNode) in
`packages/shared/src/chains.ts` — use as failover per PRD §12 risk "RPC flakiness."

Arc is a built-in viem chain (`import { arcTestnet } from "viem/chains"`), but we keep our
own copy in `chains.ts` so source URLs and verification dates travel with the values.

### USDT question — RESOLVED (open question #1)

**No canonical testnet USDT exists on Arc.** `/arc/references/contract-addresses` lists
USDC, EURC, USYC and system contracts only — no USDT. Per PRD §4.1 M2 fallback: we deploy
`MockUSDT.sol`, loudly labeled `// SIMULATED`, for the `USDC/USDT` pair.

Also newly discovered: **USYC** (`0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C`), a
yield-bearing money-market-fund-share token, is a first-class Arc testnet asset. Not in MVP
scope, but a candidate future pair (recorded in `chains.ts` for reference).

### App Kit SDK package names — CONFIRMED (open question #2)

- Core: `@circle-fin/app-kit`
- Viem adapter: `@circle-fin/adapter-viem-v2`
- Install: `npm install @circle-fin/app-kit @circle-fin/adapter-viem-v2 viem`
- Latest published versions at scaffold time: `1.10.0` / `1.14.0` respectively (npm registry
  had no `0.x` — any docs/prompts referencing `^0.1.0` are stale; pinned engine's
  `package.json` to `^1.10.0` / `^1.14.0`).
- Individual kits (Bridge Kit, Swap Kit, Unified Balance Kit) are available standalone if a
  lighter install is ever preferred — not used for MVP.

### ~~DISCREPANCY — Base Sepolia does NOT support Unified Balance~~ — CORRECTED 2026-07-17

**This Phase 0 finding was wrong**, caught while researching Phase 2 with direct filesystem
access to the docs (`mcp__arc-docs__query_docs_filesystem_arc_docs`) instead of the earlier
`WebFetch` summary. The live `/app-kit/references/supported-blockchains` capability table
actually shows:

| Network | Send | Bridge | Swap | Unified Balance |
|---|---|---|---|---|
| Arc Testnet | ✅ | ✅ | ✅ (USDC/EURC/cirBTC only) | ✅ |
| Base Sepolia | ✅ | ✅ | ❌ | **✅** |
| Arbitrum Sepolia | ✅ | ✅ | ❌ | ✅ |

All three testnets support **both** Bridge and Unified Balance. The earlier "Base Sepolia:
❌ Unified Balance" note was either a stale `WebFetch` summarization error or the docs changed
since — either way, trust this direct filesystem read over the earlier one. Doesn't change the
Phase 2 architecture decision below (bridge() was chosen for reasons independent of this), but
worth knowing Unified Balance was never actually off the table for Base Sepolia.

### Gas & fee model (informs deploy scripts + matching engine gas budget)

- Native gas token is USDC itself (18-decimal native balance; **6-decimal ERC-20 view is a
  separate accounting path** — `balanceOf() == 0` does NOT imply native balance is 0. This
  matters for `BalanceManager` deposit/withdraw bookkeeping — never conflate the two).
- Fee model: EIP-1559 + EWMA smoothing (utilization-based moving average, not per-block
  recompute) — traffic spikes cause only modest fee increases.
- Target ~$0.01/tx under normal load. Floor 20 Gwei, ceiling 20,000 Gwei.
- Deploy/engine scripts should set `maxFeePerGas >= 20 Gwei` with a small (~1 Gwei) priority
  tip; use `eth_feeHistory` for trend-aware estimates, display costs in USD not Gwei.

### EVM differences that matter to KeystoneBook / BalanceManager

Source: `/arc/references/evm-differences`.

- **Native USDC transfers can revert even with sufficient balance** (blocklist enforcement,
  zero-address restriction, burn prevention). This breaks the common assumption that a
  native-asset transfer only fails on insufficient balance — `BalanceManager` must not assume
  external token transfers are infallible; matching logic staying purely in internal
  debit/credit (no external calls mid-match, per PRD design) sidesteps this correctly.
- `SELFDESTRUCT`: a non-zero-value call to an already-self-destructed account **reverts**
  (vs. succeeding on Ethereum). Not expected to matter for our contracts (we don't
  selfdestruct), noted for completeness.
- `PREVRANDAO` always returns `0` — no on-chain randomness available. Not used by the Book.
- No blob transactions (EIP-4844), no `parentBeaconBlockRoot` (EIP-4788), empty withdrawals
  (EIP-4895) — none of these are load-bearing for our contracts.
- Base fees go to the block beneficiary, not burned (no EIP-1559 burn).
- **Block timestamps are non-decreasing, not strictly increasing** — sub-second blocks can
  repeat a timestamp. The indexer's candle bucketing must use `>=` semantics, never assume
  strictly monotonic timestamps for ordering (use block number / log index as tiebreaker).
- Finality is instant on inclusion — a single confirmation is sufficient for the UI to show
  "confirmed," no need to wait N blocks like on probabilistic-finality chains.

### Arc MCP server — CONFIGURED

Registered via `claude mcp add --transport http arc-docs https://docs.arc.io/mcp` (no auth
required, HTTP transport). Available in this session as an MCP tool for live doc lookups
going forward — prefer it over re-fetching raw doc URLs for quick checks.

### InfinityName / `.arc` resolution (open question #5, S2)

- **InfinityName contract confirmed:** `0x76a816EFa69e3183972ff7a231F5C8d7b065d9De` on Arc
  Testnet — matches the PRD's abbreviated address exactly. `getPrimaryDomain(address) view
  returns (string)`, empty string if unset. Source: infinityname.com/documentation +
  corroborating community sources (not an official Circle/Arc doc — treat as
  community-verified, sanity-check the ABI against a live call in Phase 4 before shipping).
- **ArcNS** (`https://arcnames.xyz/`) recorded as the fallback candidate per the PRD's
  15-minute spike instruction — address not yet verified, deferred until Phase 4 (S2
  implementation), pick one then and record the result here.

### Bridge error recovery (informs `router-watcher`, Phase 2)

- `BridgeResult` carries `state`, `steps` (four phases: `approve` → `burn` →
  `fetchAttestation` → `mint`), `txHash` per completed step, and `error` detail.
- Recommended retry: `kit.retry(failedResult, { sourceAdapter, destAdapter })` resumes from
  the failure point rather than restarting the whole transfer.
- Exponential backoff + persisted intermediate state, so a killed/restarted
  `router-watcher` can resume idempotently (matches PRD engine requirement).

---

## Scaffold decisions (Phase 0, 2026-07-16)

- **Next.js version:** PRD/prompt specify "Next.js 15"; `create-next-app@latest` installed
  **Next.js 16.2.10** (current stable at scaffold time). Decision: proceed on 16 rather than
  pin back to 15 — it's the actively supported release line and the hackathon ships in
  August 2026. Next 16 also dropped its own `AGENTS.md` into `apps/web/` warning that its
  APIs/conventions differ from older training data — **read `node_modules/next/dist/docs/`
  before writing Phase 5 App Router code**, don't assume Next 15 patterns carry over.
- **Foundry is not yet installed** in either available WSL2 distro (`kali-linux`,
  `Ubuntu-22.04` — both checked, neither has `forge`). This blocks `packages/contracts`
  bootstrapping (`forge init`, `forge install` for OZ). Needs installing at the start of
  Phase 1 (`curl -L https://foundry.paradigm.xyz | bash` inside Ubuntu-22.04, then
  `foundryup`) — deliberately deferred out of Phase 0 since Phase 0's DoD doesn't require it.
- **pnpm native build scripts are currently blocked** (`better-sqlite3`, `esbuild`, `sharp`,
  `bufferutil`, `utf-8-validate`, `unrs-resolver`) — pnpm's default policy ignores build
  scripts for packages without prior approval. Run `pnpm approve-builds` before Phase 4
  (indexer/`better-sqlite3`) actually needs to execute; not required for Phase 0/1.
- Root workspace (`pnpm-workspace.yaml`) covers `apps/*` and `packages/*`; six workspace
  projects created: `apps/web` (`@keystone/web`), `packages/contracts` (`@keystone/contracts`,
  no package manager deps — Foundry-driven), `packages/engine` (`@keystone/engine`),
  `packages/indexer` (`@keystone/indexer`), `packages/shared` (`@keystone/shared`). `pnpm i`
  from repo root installs cleanly across all of them.
- GitHub/git identity: repo-local `git config user.name`/`user.email` set to
  `Miracle656` / `iupacnumen2020@gmail.com` per explicit user instruction (not global config).
  `gh auth status` already had `Miracle656` as the active account — no switch needed.

---

---

## Phase 5 (early) — Landing page (2026-07-16)

A full Claude-Design export (all 8 PRD §7 screens as `.dc.html` files) was supplied ahead of
schedule, along with official Arc/USDC/EURC/Circle brand assets. Built the Landing screen
from it first.

### Visual system — SUPERSEDES PRD §8

The design export uses a light "architectural editorial" palette, not the PRD's dark
neobrutalist brief. Confirmed with the user this is the intended, authoritative direction —
proceeding with it for all future screens (Trade, Earn, Router, Portfolio, Transparency,
Docs, Settings), not the PRD prose:

- Background `#EFEBE0` (parchment), text `#151B26` (ink), accent `#B57E28`/`#E7B25A` (gold),
  bid `#1F9D63`, ask `#D6483F`, panel `#F7F4EC`, cream (inverse text) `#F5F1E6`.
- Fonts: **Figtree** (not Archivo Expanded/Inter) + **JetBrains Mono** for data.
- Soft shadows, 6–10px radius (not PRD's hard offset shadows / 0–2px radius).
- Light-mode only for now — PRD's S5 dark/light toggle (dark default) is deferred; when
  built, dark mode should probably adopt the PRD §8 Basalt palette as originally specified,
  since the design export doesn't cover a dark variant.
- Tokens live in `apps/web/app/globals.css` (`@theme` block); fonts wired in
  `apps/web/app/layout.tsx` via `next/font/google`.

### Implementation notes

- Ported `Landing.dc.html` (a proprietary Claude-Design runtime format — custom `{{ }}`
  templating + `sc-for` loops + a `support.js` runtime, GSAP for entrance/flash animations,
  IntersectionObserver for scroll reveals and stat count-up) into idiomatic React/Tailwind
  components under `apps/web/components/landing/`. The Router Flow diagram's travelling-token
  animation is pure SVG SMIL (`<animateMotion>`/`<animate>`) and ports almost verbatim to JSX
  (just camelCase attribute renames) — no JS driver needed for it.
- **Hydration-safety pattern for randomized visuals:** the hero's `KeystoneArch` component
  generates its book-depth geometry with `Math.random()`. Calling that inside a lazy
  `useState` initializer runs it once during SSR and again on the client during hydration,
  producing different output each time → React hydration mismatch (confirmed via a real
  console error caught during verification, not hypothetical). Fixed by rendering a fixed
  deterministic placeholder for the SSR + first client pass (`rand = () => 0.5`), then
  re-randomizing in a `useEffect` that runs only after mount. **Any future component that
  randomizes SSR'd visual content (e.g., simulated stats, mock oracle jitter) must follow
  this same pattern** — generate real randomness client-side-only, post-mount.
- Brand SVGs (Arc, USDC, EURC, cirBTC, USYC icons) copied from the provided
  `arc_usdc_logos` bundle into `apps/web/public/brand/`.
- Verified in an actual headless-Chromium render (Playwright, since `chromium-cli` wasn't
  available in this environment — installed as a one-off scratch dependency) at 1440×1000,
  confirmed zero console errors and correct visual output for hero/stats/router-flow/thesis/
  three-layers/roadmap/CTA/footer. Screenshots are not committed to the repo (verification
  artifacts only).
- All Landing stats (volume/trades/TVL/spread, the ticking mid price) are `// SIMULATED`
  client-side placeholders — no indexer exists yet. Each is commented at its data source so
  swapping in real `/api/stats` / `/api/book/:pair` reads (Phase 4/5) is a single-spot change.

---

---

## Phase 5 (early) — Dark Arc-brand reskin + font swap (2026-07-16)

Superseded the light "architectural editorial" palette (adopted a few hours earlier, see
above) with a dark navy theme matching arc.io's actual site, per explicit user direction and
a reference screenshot of arc.io. This is now the real, final direction — the light theme
was short-lived.

### Palette

- Page background: dark navy gradient `#0B1424` (top) → `#16294C` (bottom), plus a warm gold
  glow (top-right) and a cooler blue glow (bottom-left), echoing arc.io's own hero.
- Primary text: `#F5F1E6` (was the light theme's "cream", now reused as the main foreground
  color — `--color-ink` in `globals.css`).
- Card/panel surface: `#16233B`, distinct from page bg.
- Gateway/chain-card navy accents: Arc's **official brand navy `#1B3158`**, sourced directly
  from `Arc_Logos/Full Logo/SVG/Arc_Logo_Navy.svg` — not eyeballed from the screenshot.
- Gold accent: `#E7B25A` (brighter than the light theme's muted `#B57E28`, for pop on dark bg).
- Bid/ask: switched from the design-export's light-tuned greens/reds (`#1F9D63`/`#D6483F`) to
  the **PRD §8's original dark-mode functional colors** (`#2FBF71`/`#E5484D`) — those were
  literally specified against a dark Basalt background, so they're a better fit here than
  reinventing new ones. Net effect: light theme used the design-export's colors, dark theme
  uses the PRD's — each palette gets the colors actually tuned for its background.
- Voussoir (arch stone) fills changed from light pastel blocks to dark desaturated
  green/maroon tints (`#1E3A2E` / `#3B2228`) with a translucent light stroke, keeping the
  "glass masonry block" concept but inverted for a dark surface.

### Real bug class found during this pass: button contrast pairs

Several components had `bg-ink`/`text-cream`/`hover:text-ink` combinations that assumed
`ink` was always the *dark* color (correct in the light theme). Flipping the token values
made `ink` the *light* color instead, which silently broke every hover state that paired a
gold background with `text-ink` (light-on-light-gold = unreadable). Fixed case-by-case in
`Nav.tsx`, `Hero.tsx` (hover states → `hover:text-cream`), and rewrote `CTA.tsx`'s "inverted
block" concept entirely — it no longer flips to a light card (that stopped making sense once
the whole page went dark); it's now a `bg-panel` card with a gold border instead.
**Lesson for future palette changes:** grep for `bg-ink`/`text-ink`/`text-cream` pairs on
buttons specifically — token-only recoloring is not safe for contrast-sensitive pairs, they
need individual review.

### Fonts — Space Grotesk (primary) + Cal Sans (secondary/display)

Per user request: replaced Figtree entirely.
- `--font-sans` (global body/UI text, buttons, labels, nav): **Space Grotesk**
  (weights 300–700, variable).
- `--font-display` (new token; big headline moments only — Hero H1, and the large section H2s
  in Thesis/ThreeLayers/Roadmap/CTA/RouterFlow): **Cal Sans** (single weight 400 — it's a
  display face with no bold variant, so `font-extrabold` was dropped from every element using
  it; the typeface is already visually bold/expanded by design).
- Both resolved fine via `next/font/google` (`Cal_Sans`, `Space_Grotesk` exports) — Turbopack
  build only emitted a benign warning ("failed to find font override values for Cal Sans",
  a fallback-metrics optimization Next can't compute for less-common fonts, not an error).
- JetBrains Mono (data/ticker text) is unchanged.

### Still-light-theme artifacts to watch for

`Footer.tsx`'s brand SVGs (`arc-network.svg`, `usdc.svg`, `eurc.svg`) already have their own
navy/white fills baked in — confirmed they read fine unmodified on the new dark bg, no
changes needed. `RouterFlow.tsx`'s `sym-arc` icon shadow was tuned for a light bg
(`rgba(27,49,88,0.28)`) and has been changed to a neutral dark drop-shadow
(`rgba(0,0,0,0.35)`) so it still reads as a shadow rather than a near-invisible tint.

---

## Phase 1 — The Book (2026-07-17)

Foundry installed in WSL2 Ubuntu-22.04 (`curl -L https://foundry.paradigm.xyz | bash` +
`foundryup` → forge 1.5.1-stable); PATH fix needed in both `.bashrc` and `.profile` since
`bash -lc` (login shell) reads `.profile`, not `.bashrc`. `forge init --no-git --force .` +
`forge install OpenZeppelin/openzeppelin-contracts --no-git` (OZ v5.6.1) into
`packages/contracts`.

Implemented: `BalanceManager`, `PairRegistry`, `FeeCollector`, `KeystoneBook`,
`KeystoneReserve` (ERC-4626), `MockOracle`, `MockUSDT`. 23 tests green (10 unit + 8 Reserve +
5 invariant, each invariant run 128,000 calls) plus 5 isolated gas measurements — see below.

### Two real bugs found and fixed during implementation (not hypothetical — caught by
compile errors and failing tests, in that order)

1. **Missing fixed-point price scale.** First draft computed `notional = price * qty` with no
   descaling — only dimensionally correct if price were a raw 1:1 multiplier, which breaks
   tick-size semantics entirely (PRD's "tick 0.0001" wouldn't be representable). Fixed by
   introducing `PRICE_SCALE = 1e6` (`notional = price * qty / PRICE_SCALE`), documented as
   assuming base/quote share the same decimals — true for both MVP pairs, called out as a
   scope limit for any future mismatched-decimal pair.
2. **Dust-leak in the buy-order escrow buffer.** The initial design released each fill's
   share of a buy order's fee-buffered escrow as `lockPerUnit * fillQty` — a share of the
   *original* qty. Under repeated partial fills, floor-rounding each slice independently can
   under-release cumulatively, leaving unrefundable dust stuck in escrow forever once the
   order's `remaining` reaches zero. Fixed by tracking `lockedRemaining` directly on the order
   and releasing `lockedRemaining * fillQty / remaining` (both read pre-fill) — a share of
   *what's currently locked*, which by construction reaches exactly zero on the final fill
   regardless of how many partial fills preceded it. Neither bug was caught by inspection —
   the first surfaced as a `forge build` stack-too-deep forcing a refactor that made me
   re-derive the math by hand; the second was reasoned out before it ever produced a failing
   test, while re-deriving the settlement identity for the NatSpec comment above
   `_settleFill`.
3. Two Foundry-specific test-writing gotchas worth remembering: (a) `book.FLAG_IOC()` (or any
   external call) written *inline* as a `placeLimit(...)` argument executes as its own call
   *before* the outer call — which silently consumes a one-shot `vm.prank`/`vm.expectRevert`
   meant for `placeLimit`, not the flag getter. Fetch such values into a local (or, as done
   here, a `setUp()`-populated field) before arming prank/expectRevert. (b)
   `vm.snapshotGasLastCall` reports the *most recently completed* call — it must be invoked
   **after** the call being measured, not before (a "prime then snapshot" reading is backwards
   and just measures whatever happened earlier in the test).

### Gas report (`vm.snapshotGasLastCall`, isolated per-call — see
`packages/contracts/test/KeystoneBookGas.t.sol`)

| Scenario | Gas |
|---|---|
| `placeLimit` (rests, no match) | 343,720 |
| `cancel` | 35,929 |
| `placeLimit` matching 1 fill | 336,706 |
| `placeLimit` matching 5 fills | 464,862 |
| `placeLimit` matching 20 fills (= `MAX_MATCHES`) | 945,447 |

Marginal cost per additional fill is a consistent ~32,039 gas (`(945,447−336,706)/19` and
`(464,862−336,706)/4` both land on exactly that). Arc's testnet block throughput is
**30M gas/block** (confirmed via `docs.arc.io/arc/references/gas-and-fees` — "Gas throughput:
30M gas/block (~60M gas/sec at 0.5s block time)"). `MAX_MATCHES=20`'s worst case (945,447 gas)
is ~3.15% of a block — comfortable with a lot of headroom; **no need to lower it**, and it
could go meaningfully higher if deeper single-tx sweeps were ever wanted. Kept at the PRD's
suggested starting value of 20.

### PairRegistry validation invariants (enforced in `_validateFees`, load-bearing for the
escrow-buffer safety argument above)

- `takerFeeBps <= MAX_TAKER_FEE_BPS` (500, a sanity cap, not policy).
- `makerFeeBps <= takerFeeBps` — a buy order's escrow buffer is sized off `takerFeeBps` as an
  upper bound; this guarantees it's never insufficient even if the order later fills as a
  maker instead.
- `takerFeeBps + makerFeeBps >= 0` — net protocol fee per fill can never go negative (a maker
  rebate can never exceed the taker fee that funds it).

### Deploy script (`packages/contracts/script/Deploy.s.sol`)

Deploys the full stack (BalanceManager → PairRegistry → FeeCollector → MockOracle → MockUSDT →
list USDC/EURC + USDC/USDT pairs → KeystoneBook → `setBook` → seed oracle mid (1.08 EUR/USD) →
KeystoneReserve), using Arc's real USDC/EURC addresses for the flagship pair and a labeled
`MockUSDT` only for the USDC/USDT pair. Split into `_deployCore`/`_listPairs`/`_deployBook`/
`_deployReserve` internal steps — same stack-too-deep class of issue as the matching engine
itself; deployed-contract handles live in storage instead of `run()` locals to sidestep it.

**Dry-run (simulation only, `forge script ... --rpc-url arc_testnet`, no `--broadcast`) against
a live fork of Arc Testnet succeeded end-to-end** — every constructor wires correctly and both
real external addresses (USDC, EURC) resolve as live contracts on-chain. Estimated cost: **9.6M
gas total, ≈ $0.43** at the simulated 45 Gwei gas price (Arc's native gas token is USDC itself,
1:1 with USD) — comfortably inside the 20 USDC funded in `DEPLOYER`'s wallet.

**Broadcast to Arc Testnet for real, 2026-07-17, after explicit user go-ahead** (addresses
identical to the dry-run — same deployer key/nonce sequence). Recorded in
`packages/shared/addresses.json` and `.env`; full transaction record at
`packages/contracts/broadcast/Deploy.s.sol/5042002/run-latest.json`.

**Phase 1 DoD verified live, not just simulated**: ran a real 3-step `cast` sequence
(`packages/contracts/script/demo-place-order.sh`, also copy-pasteable from `README.md`) from
the `DEMO_USER` wallet — approve → `BalanceManager.deposit` → `KeystoneBook.placeLimit` (bid,
1.0 EURC lot @ 1.08 USDC) — against the live deployment. All three transactions succeeded
(`status: 1`); the third emits `OrderPlaced` + `LevelChanged` from `KeystoneBook`, gas used
413,559. Tx: `0x0be1ce931fe6ec83b53ee2b03623e5e7167205f6354df57103dd710fae8c5c05`.

Two Windows-specific tooling gotchas hit while running this, worth remembering for every future
`cast`/`forge script` invocation from this environment:
- **Git Bash mangles `/mnt/c/...` paths before `wsl.exe` sees them** (MSYS path conversion
  rewrites them to a Windows-relative path first). Fix: prefix the command with
  `MSYS_NO_PATHCONV=1`.
- **Deeply nested inline shell variables across PowerShell/Bash-tool → `wsl` → inner
  `bash -lc "..."` silently dropped/emptied** (`$VAR` expansions vanished, shifting positional
  args and producing confusing `cast` argument-parsing errors). Fix: write the multi-step
  sequence to an actual `.sh` file and invoke that file directly — never inline a multi-step
  script as one big quoted string through that many shell layers.

### USDC/USDT pair paused (2026-07-17, user direction)

Per explicit user request: Circle/Arc's testnet meaningfully supports USDC + EURC natively;
`MockUSDT` is our own stand-in, not something Circle provides. Rather than presenting it as an
equivalent third pair, paused it via `PairRegistry.setActive(1, false)` (GUARDIAN role, held by
`DEPLOYER`) — tx `0xb0b8ce5b3fe3fcbc0fca034b68a6d8b97ff074747e4c83d6ef8d2a68b041179f`. The
contract, pairId, and listing all still exist (nothing redeployed) — just deactivated, so new
`placeLimit`/`placeMarket` calls against it revert `PairPaused`; cancels/withdrawals are
unaffected. Trivially reversible (`setActive(1, true)`) if a real testnet USDT ever ships.

---

## Phase 2 — The Router (2026-07-17)

### App Kit SDK API, confirmed against `sdk-reference.mdx` directly

Two genuinely separate systems live under one `AppKit` class:

- **`kit.bridge({from, to, amount, token?})`** — direct point-to-point CCTP v2 burn-and-mint
  between exactly two chains. `from`/`to` are `{ adapter, chain, address? }`. Returns
  `BridgeResult` with `state: 'pending'|'success'|'error'` and a `steps` array
  (`approve`→`burn`→`fetchAttestation`→`mint`), each step carrying its own `explorerUrl`.
  Retry via **`kit.retryBridge(result, { from, to })`** — note: `bridge-error-recovery.mdx`'s
  prose example calls this `kit.retry(...)`, but the actual method defined in
  `sdk-reference.mdx` is `retryBridge`. Trusting the reference over the prose example (logged
  here as an internal docs inconsistency, not a prompt-vs-docs conflict).
- **`kit.unifiedBalance.*`** — a separate Gateway-custody-account abstraction. `deposit()`
  credits the caller's own cross-chain Gateway account (not any specific destination chain
  balance); `spend()` then mints USDC on a chosen destination chain by pulling from one or more
  of those Gateway-account allocations. This is a genuinely different mental model (a
  Circle-custodied intermediate balance) from `bridge()`'s direct point-to-point transfer.

**Decision: use `bridge()` exclusively for Keystone's Router, not Unified Balance.** Reasons:
1. `bridge()` is simpler — one direct call per leg, no intermediate Gateway-account balance to
   reason about or reconcile.
2. It works identically across all three chains we need (Arc, Base Sepolia, Arbitrum Sepolia
   all support it — confirmed above).
3. It's still genuinely CCTP v2 under the hood, matching the PRD's substance even if not
   literally invoking the "Gateway Unified Balance" product name.
Unified Balance remains available as a later enhancement (true cross-chain "one balance" UX)
if time permits post-MVP — not ruled out, just not needed for the core deposit/withdraw doors.

**Adapter**: `createViemAdapterFromPrivateKey({ privateKey })` from `@circle-fin/adapter-viem-v2`
— one adapter works across every EVM chain. Developer-controlled (raw private key), so per the
SDK's `AdapterContext` rules, `address` must be passed explicitly in every `from`/`to` context
(derived via viem's `privateKeyToAccount(pk).address`), unlike user-controlled browser-wallet
adapters where address is forbidden/auto-resolved.

### Custody flow (PRD open question #3) — resolved

**Decision: bridged funds land in the user's own Arc wallet first; a separate, explicit
`BalanceManager.deposit()` call is what actually credits Keystone's internal ledger.** This is
the fewest-trust-assumptions option:

- `bridge()`'s destination is just an address — it has no way to also invoke `deposit()` in the
  same step, and `BalanceManager.deposit()` requires `msg.sender` to be the token holder (it
  does `safeTransferFrom(msg.sender, ...)`), so crediting is never a single atomic step here
  regardless of design.
- The alternative — bridging directly to `BalanceManager`'s own address — was considered and
  rejected: a bare ERC-20 transfer to a contract doesn't invoke any code, so BalanceManager
  would have no way to know *whose* internal balance to credit for tokens that just landed on
  it. That would either orphan the funds (breaking the `contractBalance == sum(balanceOf) +
  totalEscrowed` invariant central to the whole ledger) or require a trusted relayer to decide
  attribution after the fact — exactly the kind of trust assumption we're trying to avoid.
- So: **two user-signed steps** for a cross-chain deposit (bridge, then deposit) — both signed
  by the same wallet, no custodial intermediary ever needs to be trusted to correctly attribute
  funds. In the real UI, this surfaces as "funds arrived — click to add to your Keystone
  balance" after the bridge completes.
- `router-watcher`'s role is therefore **detection and notification**, not autonomous crediting
  on a real user's behalf — it watches for a completed bridge (or polls `bridge()`'s result) and
  surfaces that state to the UI / structured logs. For our own *scripted* demo/test-automation
  runs specifically (where we hold every wallet's private key ourselves already, e.g.
  `DEMO_USER`), the same script can also submit the follow-up `deposit()` call to produce a full
  end-to-end transcript without manual UI interaction — that's a testing convenience, not a
  production trust model, and the distinction is worth keeping in mind when this becomes real UI
  in Phase 5.

### Withdraw-to-any-chain

Mirror of deposit: `BalanceManager.withdraw()` (real ERC-20 lands in the user's own Arc wallet)
→ user-signed `kit.bridge({from: {chain: 'Arc_Testnet', ...}, to: {chain: destination, ...}})`.
Same two-step, same-wallet-signs-both pattern — no new custody question, since withdrawal starts
from a state (funds already in the user's own wallet) that has no attribution ambiguity to begin
with.

### One real adapter bug found: `address` field on the private-key adapter

`createEngineAdapter` (viem private-key adapter) is treated by App Kit as a **user-controlled**
adapter — like a connected browser wallet — even though it's server-side. Passing `address`
explicitly in the `from`/`to` `AdapterContext` (which the "developer-controlled adapters"
note in `adapter-setups.mdx` seemed to imply was required) throws `"Address should not be
provided for user-controlled adapters."` Fixed by omitting `address` entirely for this adapter
type — it resolves the single implicit address from the private key on its own. That
"developer-controlled → address required" guidance apparently applies to adapters that can
represent *multiple* addresses on one credential (e.g. Circle Wallets), not a plain
one-private-key-one-address viem adapter.

### Phase 2 DoD — verified live, full round-trip transcript (2026-07-17)

`packages/engine/src/demo-router-roundtrip.ts` (+ two small continuation scripts written
after hitting Arc's public-RPC rate limit mid-run, see below) proved the complete loop for
real on testnet:

1. **Bridge in** — 2 USDC, Base Sepolia → Arc (DEMO_USER): [approve](https://sepolia.basescan.org/tx/0xa882da55ef270a153faf7246246cad56b0eb3cb2ece310e5cc0179ebe5b1a7a1) · [burn](https://sepolia.basescan.org/tx/0x873dc46da73bfb8e06312d3566c5eb588536bce06ca21f1033151a66061853a1) · [mint on Arc](https://testnet.arcscan.app/tx/0x239ea89a795e2a87beb6c2f05865852454336053c7690f408bcd2e639b98eb79)
2. **Credit Keystone** — [DEMO_USER `BalanceManager.deposit`](https://testnet.arcscan.app/tx/0xbfdbf642a564915687c5467c5c38781d6832128ef6a52a8daf153018b7b25797) · [MM_BOT_A EURC deposit](https://testnet.arcscan.app/tx/0x3683c6477010636c5b4f038540d50c89933df806cff48d13bf0241a640b24103) (scripted counterparty funding)
3. **Trade** — [DEMO_USER bid](https://testnet.arcscan.app/tx/0xc06ba1bce6e6722d8a9ef56e741df2cdd30981bff29f682eea4743d568d12508) resting @ 1.08, then **[MM_BOT_A's scripted counter-ask crosses it — real fill](https://testnet.arcscan.app/tx/0x811a6fdbcc429553e175ff587d6d3c5e52bb6bd5ac4235a81d1ddeebf10f76f3)** (also cleared a leftover resting order from the Phase 1 `cast` demo)
4. **Withdraw** — [`BalanceManager.withdraw`](https://testnet.arcscan.app/tx/0xc6fc918901ec5bfc737b2f93029dedf0b5d3634482af6b9276031ee9c0b902c9) back to DEMO_USER's own Arc wallet
5. **Bridge out** — 1 USDC, Arc → Arbitrum Sepolia: [approve](https://testnet.arcscan.app/tx/0x976c9e51cd554fe1944b706ddb0572e9357cae21f73344e94264971f4b26d9d7) · [burn](https://testnet.arcscan.app/tx/0x5025e9bb9720a4b58e58d26f922432fb801c56530a8383e5da1b50025362ffca) · [mint on Arbitrum Sepolia](https://sepolia.arbiscan.io/tx/0x3af6c5fa513b6fe285d5bc6a88bb9c1e80ec2b3e4e2877701bede7dfd5337816)

**Two operational snags along the way, both external, neither a code bug:**
- **Arc's public RPC rate-limits under back-to-back calls** (same class of issue as Phase 0's
  balance-check throttling) — hit mid-script on `waitForTransactionReceipt` polling for both
  the deposit and the withdraw steps. Fixed generally by adding exponential backoff
  (`retryCount: 8, retryDelay: 2000`) and a slower poll cadence (`pollingInterval: 2000`) to
  every Arc-facing viem client in `lib/arc.ts` and `lib/appkit.ts`. Because the withdraw
  transaction had already been broadcast and mined before its receipt-wait got rate-limited
  and threw, the script exited having actually completed more on-chain than it reported — a
  reminder that an RPC-layer error after submission doesn't mean the transaction failed, only
  that confirmation-watching did. Recovered by checking real on-chain state (wallet balance,
  then an `eth_getLogs` query for the specific `Withdrawn` event) rather than trusting the
  script's own exit code.
- **`DEMO_USER` had zero native ETH on Arbitrum Sepolia**, so the final mint-on-destination step
  failed with `BALANCE_INSUFFICIENT_GAS` even though approve, burn, and attestation-fetch all
  succeeded on Arc — Arbitrum Sepolia is a normal EVM chain needing its own gas token, unlike
  Arc (gas paid in USDC) or the CCTP mint itself (paid by the relayer/forwarder). Same class of
  gap flagged for Base Sepolia back when wallets were first funded. Resolved once the user sent
  `DEMO_USER` (`0xA8033fc6049863c2AD2269eD259A5B24cfd1fa0f`) a small amount of Arbitrum Sepolia
  ETH; a bare retry then completed the mint immediately.

---

## Phase 3 — MockOracle: real data, honestly labeled (2026-07-17)

User pushback, and a fair question: if the reference mid can't drive matching (architectural,
non-negotiable — see below), why does its *value* have to be fake? It doesn't. Fixed.

### Why the oracle exists at all, and why matching never reads it (unchanged, restated for
clarity since this came up)

An order book produces prices; it doesn't consume them. Price discovery on Keystone comes
from real resting orders meeting at price-time priority — the moment `KeystoneBook` reads an
external feed to decide a fill, it stops being an on-chain CLOB and becomes an
oracle-following contract, undermining the entire thesis (PRD §1, §3 principle #1). So the
reference mid has exactly two consumers, **both outside matching**: the mm-bots/reserve-keeper
(need to know roughly where fair value is to center quotes) and `KeystoneReserve`'s NAV math
(values idle EURC in USDC terms). This was correct from Phase 1 and doesn't change.

### What actually changes: the *data* is now real, not invented

`packages/engine/src/reference-feed/update.ts` fetches the live EUR/USD rate from
[Frankfurter](https://www.frankfurter.app/) (a free, no-key-required API serving ECB reference
rates) and pushes it on-chain via `MockOracle.setMid`, replacing the one-time hardcoded `1.08`
placeholder set at deploy time. Verified working: live rate at time of writing was **1.1435**
(fetched 2026-07-17), not the invented 1.08.

**What this is not:** a decentralized oracle. It's a single-operator push — `DEPLOYER` (the
contract's owner) is still the only account that can call `setMid`, same trust model as
before, just now relaying a real external number instead of an invented one. Worth being as
upfront about this limitation as about the fix itself.

### Chainlink/decentralized-oracle path — checked, not built (verification, not assertion)

Confirmed via `docs.arc.io/arc/tools/oracles` directly: Arc's own docs list **Chainlink,
Chronicle, Pyth, RedStone, and Stork** as available oracle providers. Of these, **only Stork**
has an Arc-specific contract-address page linked directly
(`docs.stork.network/resources/contract-addresses/evm#arc`) — Chainlink's/Pyth's/RedStone's
listed links all point to each provider's *generic* multi-chain address pages, with no
Arc-testnet-specific EUR/USD (or any FX) feed address confirmed by Arc's own docs. A claim
that Arc "joined Chainlink Scale" with live testnet feeds could not be corroborated this way —
**not asserting it's true or false, just that I couldn't verify it from official docs**, so it
isn't something to build against right now. If a concrete, address-verified FX feed turns up
on Arc testnet later, swapping the reference-feed updater's source for it (same `setMid` call
site) is a small, contained change — logged here as the next rung, not done.

### Not renaming the deployed contract

`MockOracle` keeps its on-chain name. Renaming the Solidity identifier would require
redeploying it at a new address, which cascades: `KeystoneReserve.ORACLE` is set immutably at
construction, so a new oracle address means redeploying `KeystoneReserve` too, re-funding it,
and re-granting roles — real churn for a purely cosmetic rename with zero behavior change. The
*data* flowing through the existing deployed instance is what changed; the label is corrected
in comments/docs (see `update.ts`'s NatSpec-style header) rather than through a redeploy.

### Deferred, not forgotten: book-mid as Reserve NAV's primary source

Once the mm-bots are quoting a real two-sided book (this phase's other main goal), `KeystoneReserve.totalAssets()` valuing idle EURC via the book's own mid (bestBid+bestAsk midpoint) instead of the external feed — feed as fallback/sanity bound only — would make Reserve NAV fully on-chain-sourced. Deliberately **not** doing this now: it's a `KeystoneReserve.sol` logic change requiring a full redeploy (re-funding, role re-grants) and its own careful design/testing pass, the same rigor the original escrow/fee math got — not something to bolt on mid-Phase-3 alongside the bot rollout. Tracked here for Phase 4/5.

### Arc RPC rate-limiting — fixed properly this time (fallback transport, not just retries)

This exact "request limit reached" error (code -32011) has now hit **four separate times**
across this build (Phase 0 balance checks, the Phase 2 round-trip's deposit and withdraw
steps, and just now the reference-feed push) — each time the underlying transaction had
already succeeded on-chain, only the receipt-wait polling got throttled. Bumping
`retryCount`/`retryDelay` on a single endpoint kept being a partial fix. Switched
`lib/arc.ts` and `lib/appkit.ts` to viem's `fallback()` transport across **all four**
recorded Arc RPC providers (primary + Blockdaemon + dRPC + QuickNode, from
`docs.arc.io/arc/tools/node-providers`, already in `chains.ts` since Phase 0) — spreading
load across providers instead of retrying the same rate-limited one. Confirmed the
reference-feed's `setMid` call landed correctly on-chain (`getMid` reads back `1.1435`,
matching the fetched rate) even on the run where the script itself reported an error —
another reminder that an RPC error after a transaction is submitted means confirmation-watching
failed, not that the transaction did.

### Real bug caught by its own unit test: inverted inventory-skew sign

`packages/engine/src/lib/quoting.ts`'s `computeQuote` shades the quoting center price to
rebalance a bot's/Reserve's inventory (long base -> shade down, keener to sell; long quote ->
shade up, keener to buy). The first implementation computed
`shadeBps = maxSkewShadeBps * (skewFraction - 5000) / 5000`, which for a 100%-base-heavy
inventory (`skewFraction = 10000`) produces a *positive* shade — pushing the effective mid
**up**, the opposite of the intended direction. A base-heavy bot would have quoted a *higher*
bid (more eager to buy still more of the asset it already had too much of) and a *higher* ask
(less competitive, less likely to sell it off) — actively worsening its own inventory
imbalance instead of correcting it, every single cycle. Caught by
`test/quoting.test.ts`'s skew-direction assertions before any of this ran live — exactly the
kind of bug that's obvious once a test states the expected direction in plain terms
("base-heavy must shade the mid *down*") but easy to get backwards writing the bps arithmetic
inline. Fixed by flipping the subtraction order (`5000 - skewFraction`, not
`skewFraction - 5000`); the corrected direction is asserted explicitly in three of the 19
`vitest` tests in `packages/engine/test/`.

---

### Phase 3 DoD, run for real on Arc Testnet

**Deploy-script role gap, found and fixed live.** `Deploy.s.sol` grants `RESERVE_KEEPER_ROLE`
to `vm.envOr("RESERVE_KEEPER_ADDRESS", deployer)` — since `RESERVE_KEEPER_ADDRESS` was never set
in `.env` at deploy time, the role landed on `DEPLOYER`, not on the wallet the keeper process
actually signs with. First live `reserve-keeper` run reverted both sides with the same error
selector (`0xe2517d3f`) regardless of bid/ask direction — a same-selector-both-sides signature is
the tell for an access-control revert (OZ v5's `AccessControlUnauthorizedAccount(address,bytes32)`
selector) rather than a business-logic rejection. `DEPLOYER` holds `DEFAULT_ADMIN_ROLE`, so fixed
without a redeploy: `packages/engine/src/grant-reserve-keeper-role.ts` grants the role directly
(tx `0xdad5e8e31f4e7d2741d899f6109ad79749c673e843bf93e56ba1b27a42251990`). Re-ran — bid placed
successfully (orderId 8).

**Added `placeMarket` (was missing from the ABI/lib surface).** `KeystoneBook.placeMarket` existed
in the contract since Phase 1 but had no ABI entry or `lib/arc.ts` helper — nothing had called it
yet. Added both (`packages/shared/src/abis.ts`, `placeMarket()` in `lib/arc.ts`, mirroring
`placeLimit`'s event-decoded-orderId pattern) to let `DEMO_USER` cross the live book as a taker.

**Live two-sided book, then a real fill against the Reserve.** `MM_BOT_A` and `MM_BOT_B` each ran
`run-once`, both funding their own working capital and quoting bid 1,141,000 / ask 1,145,700
(orderIds 4/5 and 6/7) — independent bots converging on the same price because both started from
identical idle-capital ratios, not because they share state. `reserve-keeper` then rested a bid at
1,141,200 (orderId 8) — tighter to the mid than either bot, since the Reserve's `maxSkewShadeBps`
is smaller. `DEMO_USER` (already holding 2 idle EURC in `BalanceManager` from earlier phases)
placed a real IOC market sell of 1 EURC
(`packages/engine/src/demo-market-order.ts`, tx `0x6c61ddfe13aeb83b70fd54448f155d0efdeb71494de3e6a4c6371f2aea47c161`)
— matched the Reserve's resting bid (best price), one fill, confirmed in 2.1s. `bestBid` moved to
1,141,000 (the bots' level) immediately after, confirming the Reserve's order was fully consumed
and removed from the book.

**Reserve NAV grew from a real trade, not a simulated one.** Before: `totalAssets`=10.000000,
`totalSupply`=10, share price 1.0 (seeded 1:1). After the fill: `totalAssets`=10.002528,
share price 1.0002528 — the Reserve bought EURC at 1.1412 (its own shaded bid) while
`MockOracle`/reference-feed marks EURC at 1.1435 for NAV purposes, so the spread it captured
shows up immediately as unrealized NAV gain, exactly as designed (`totalAssets()`'s idle-EURC
leg is marked to the reference feed; see the "MockOracle" section above). `reserve-keeper`'s
`logApyEstimate()` then reported a real (if naive-extrapolated) positive APY off that single data
point — correctly and honestly logged as "SIMULATED APY estimate — naive extrapolation from a
short local observation window," per its own log message; the number itself (~1700-1900%
annualized) is an artifact of extrapolating one small fill over a few minutes, not a claim about
sustained yield.

**`InventorySkewExceeded` on the next `reserve-keeper` cycle — correct, not a bug.** After the
fill, the Reserve held 1 idle EURC vs 8.86 idle USDC (~88.6% quote-heavy in NAV terms), past the
80% one-sided bound implied by `maxInventorySkewBps=3000` (30% skew allowance around the 50/50
midpoint). Its next ask attempt (which would have sold its last EURC, pushing skew to 100%
quote-heavy) reverted with `InventorySkewExceeded()` — the on-chain risk bound
(`KeystoneReserve._checkBounds`) doing exactly its job: refusing a quote that would deepen an
already-skewed inventory. The bid side (which *reduces* the skew) placed fine in the same cycle.
This is the PRD's "bounds enforced on-chain by the contract itself" behavior working as intended
on real capital, not a failure to fix.

Full Phase 3 DoD — two bots quoting a live two-sided book, a market order filled against it, and
`KeystoneReserve` deposited/quoting/showing real positive NAV growth from an actual fill — is
demonstrated live on Arc Testnet chain 5042002.

---

### Benchmarked against DeepBook v3 (Sui) — matching-engine infra check, and Arc's MEV posture

Prompted by an external question about (a) MEV/orderflow-protection layers and (b) whether
Keystone's CLOB is missing anything a production matching engine has. Read DeepBook v3's actual
source (`C:\Users\HP\Documents\sui\deepbookv3`, `packages/deepbook/sources/`) rather than going
off memory, plus queried `arc-docs` for Arc's consensus/mempool design. Findings, in order of
relevance:

1. **Arc's base layer already does most of the MEV-mitigation work.** Malachite BFT consensus
   gives sub-second, deterministic finality — no reorgs, no probabilistic-finality reordering.
   Arc's own docs state this plainly: "Transaction ordering guarantees prevent front-running and
   ensure payments settle in the order they are submitted"
   (https://docs.arc.io/build/payments#deterministic-ordering). This closes the classic
   multi-block sandwich vector structurally, not via an app-layer bolt-on.
2. **Arc Privacy Sector (APS) is a real, already-shipped encrypted-mempool primitive** — encrypt
   a tx to APS's public key, submit the ciphertext as calldata to a precompile, validators
   decrypt/execute inside hardware enclaves, results stay off the public ledger until retrieved
   with proof of authorization. If Keystone ever needed private order submission, this exists
   at the protocol level; no custom encrypted-mempool/batch-auction layer to build.
3. **One real residual gap vs. DeepBook: no gas-spike-aware fee defense.** DeepBook's
   `state/ewma.move` tracks a smoothed mean/variance of gas price and adds a taker-fee penalty
   when the current gas price's Z-score crosses a threshold — a direct defense against
   priority-gas-auction MEV. Arc still runs an EIP-1559-style tip market
   (`maxPriorityFeePerGas` "incentivize[s] sequencer inclusion" per the gas-and-fees docs), so the
   vector this defends against isn't fully closed by consensus alone. Given Arc's near-zero,
   stable USDC-denominated gas, this is a much smaller attack surface than on Sui/Ethereum —
   deliberately deferred (logged in PRD §5 roadmap), not an oversight.
4. **Matching-engine data structure: DeepBook's `BigVector<Order>` (self-balancing,
   O(log n), order IDs packing side+price+sequence into one sort key) vs. Keystone's sorted
   price-level linked list + per-level FIFO queues with a caller-supplied `levelHint` and bounded
   scan (`MAX_HINT_SCAN=10`).** DeepBook's structure doesn't degrade on a bad hint; Keystone's
   does, in principle, at high order density per level. Deployed and tested at hackathon scale
   (a handful of bots/orders) — not worth rearchitecting a live, tested contract this close to
   the deadline. Noted for post-hackathon (PRD §5).
5. **On-chain level-2 depth query — DeepBook has one (`get_level2_range_and_ticks`), Keystone
   doesn't.** `KeystoneBook` only exposes `bestBid`/`bestAsk`/`getOrder`; aggregated depth-by-tick
   is *not* available on-chain by design — it's meant to be reconstructed off-chain from the
   `LevelChanged` event stream. This sharpens why Phase 4's indexer matters: it's not just
   trade history/charts, the Trade screen's depth chart literally has no other data source.
6. **Quote-simulation (`get_quantity_out`/`get_quantity_in` in DeepBook) — Keystone has no
   equivalent.** A frontend slippage preview ("spend X, get ~Y before you sign") would currently
   need either indexed-depth replication or a static `eth_call` dry-run of `placeMarket` (works,
   but only returns filled qty, no per-level breakdown). Nice-to-have for Trade UX, flagged for
   Phase 5 if time allows, not blocking.
7. **Governance (`state/governance.move`, stake-weighted fee voting) and volume-tiered maker
   rebates (`state/history.move`) — deliberately out of scope**, appropriate hackathon
   simplification vs. Keystone's static admin-set `PairRegistry` fees, not a gap to fix now.
8. **Validates the Phase 4 indexer isn't overbuilt scope creep.** Even DeepBook — a mature,
   production CLOB with its own on-chain epoch volume accounting — still ships a separate
   `crates/indexer` for anything UI-facing. Same architecture Keystone is about to build.

Bounded matching (DeepBook's `max_fills` vs. Keystone's `MAX_MATCHES=20`) is the same pattern in
both — confirms that piece of Keystone's design is standard, not something to revisit.

---

## Phase 4 — The Indexer

Built per PRD §9's architecture (`packages/indexer`: events → SQLite → trades/candles/depth/APY/
stats REST) using the scaffold's intended stack (Hono, drizzle-orm, better-sqlite3).

**Schema**: `orders` (full lifecycle per order id — open/filled/canceled, restart-safe via
`onConflictDoNothing`), `trades` (anonymized public tape straight from `TradeExecuted`, no
identity), `fills` (identity-attributed maker/taker/fee detail from `OrderFilled`),
`reserve_snapshots` (periodic `totalAssets`/`totalSupply` polls, not event-derived — gives
`/api/reserve/apy` a real historical series instead of the engine's naive 2-point
extrapolation), `indexer_state` (singleton `lastIndexedBlock`, advanced only inside the same
SQLite transaction as the batch it covers — crash-safe by construction, no per-row idempotency
keys needed). Used hand-written `CREATE TABLE IF NOT EXISTS` DDL instead of drizzle-kit generated
migrations — one less toolchain step, acceptable for this scope.

**The one genuinely tricky part: recovering a taker order's own remaining/status.**
`OrderFilled(orderId, maker, taker, ...)` only names the *maker's* orderId — a taker order that
fully fills in the same transaction it was placed in gets `OrderPlaced` but no further event ever
reflects its remaining reaching zero. Solved by grouping all logs by transaction hash before
processing: since one Book transaction calls exactly one of `placeLimit`/`placeMarket`/`cancel`,
every `OrderFilled` in that same transaction is necessarily a fill of that transaction's own
`OrderPlaced` order acting as taker (`KeystoneBook._match` only ever fills the incoming order
against pre-existing resting orders on the other side). So `remaining = qty - sum(same-tx
OrderFilled.qty)` recovers the true final state with no extra on-chain reads. Deliberately did
*not* rely on `LevelChanged` for depth (it has an asymmetric emission gap — not emitted when a
level fully depletes, see `KeystoneBook._match`); depth is instead a live `SUM(remaining) GROUP BY
price` aggregation over `orders`, which the taker-correlation fix makes trustworthy.

**Native dependency gotcha**: `better-sqlite3`'s postinstall build script was silently skipped —
pnpm blocks build scripts for unapproved native deps by default (the exact issue flagged as an
open item back in Phase 0/1: "`pnpm approve-builds` for native deps — before Phase 4"). Added
`onlyBuiltDependencies: [better-sqlite3]` to `pnpm-workspace.yaml`, but that alone didn't trigger
a rebuild on an already-resolved lockfile; fixed by running `npx prebuild-install` directly inside
better-sqlite3's own package directory, which fetched a matching prebuilt binary for
Node 20/win32/x64 without needing a full native toolchain.

**Crashed in production ~15 minutes after launch — fixed, real resilience gap, not just a demo
footnote.** A single `eth_getLogs` call to the quicknode RPC endpoint failed with a raw
`fetch failed` (transient network blip); the ingest loop had no per-batch error handling, so it
propagated straight to `runIngestLoop().catch(...)` in `index.ts`, which called `process.exit(1)`
and took the whole service down. This was a real gap, not the flakiness the multi-provider
`fallback()` transport already guards against — that transport handles a *provider* being down;
this was one call to one provider failing outright without viem retrying it. The bots
(`mm-bot`/`reserve-keeper`) already treat per-operation failures as non-fatal (log and continue);
the indexer's ingest loop didn't get the same treatment. Fixed by wrapping `processBatch` in a
try/catch that logs and retries after `POLL_INTERVAL_MS` instead of crashing — safe to retry
blindly because `lastIndexedBlock` only advances inside the same SQLite transaction as the batch's
writes (see schema notes above), so a failed batch can never be double-applied. Verified the fix
by restarting: `lastIndexedBlock` had persisted exactly where the crash happened (52,471,045) and
resumed forward from there — no re-backfill, no data loss, restart-safe by the same design already
proven out for the bots in Phase 3.

**Verification — backfilled from the deploy block (52,288,791, from
`broadcast/Deploy.s.sol/5042002/run-latest.json`) and checked the reconstructed state against
known ground truth from Phases 1-3, order by order.** Exact match on every field: orders 1-2
(DEMO_USER's original Phase 1 resting bids) correctly `filled` by order 3 (a 2-lot sweep); orders
4-7 (both bots) correctly `open` with full `remaining`; order 8 (Reserve's bid) correctly `filled`;
**order 9 (the DEMO_USER market sell) correctly reconstructed as `filled` with `remaining: "0"`
despite the contract emitting no direct event for it** — the taker-correlation logic working
exactly as designed; orders 10/11 (Reserve's cancel-replace) correctly `canceled`/`open`. Fees
summed to exactly 2642 (864 + 864 + 914), matching the live `OrderFilled` fee values reported
during Phase 3. `/api/book/0` correctly aggregates both bots' orders into one combined depth
level per price — the exact on-chain level-2 depth query gap flagged in the DeepBook v3 comparison
above is now closed at the indexer layer, as that comparison anticipated it would need to be.

---

### Phase 5 — Router modal: EURC cross-chain, checked and confirmed unsupported (not assumed)

User asked to cross-check "there's really no rail" for bridging EURC before accepting that
Base/Arbitrum should stay USDC-only in the Router modal — EURC *is* deployed on both Arc and
Base Sepolia (`eurcAddress: '0x808456652fdb597867f38412077A9182bf77359F'` on Base Sepolia, per
`@circle-fin/app-kit`'s own `chains.mjs`), so the question was legitimate, not obviously settled.

Checked both of App Kit's cross-chain mechanisms directly against the installed SDK's type
definitions (v1.10.0) rather than trusting memory:
- `BridgeParams.token` (the CCTP v2 bridge): typed as the literal `'USDC'` — "Defaults to
  'USDC'. If omitted, the provider will use 'USDC' by default."
- Gateway/`unifiedBalance` (the *other*, architecturally distinct cross-chain mechanism —
  custody-account based, not burn-and-mint): `declare const SUPPORTED_TOKENS: readonly
  ["USDC"]`.

Both come back USDC-only, independently, at the type level. This isn't an App Kit
configuration gap — CCTP was purpose-built for USDC specifically; Circle hasn't (as of this
SDK version) extended either of its own cross-chain rails to EURC, despite EURC existing on
both endpoints. Also checked `swap()` for a cross-chain-swap workaround: it's a separate
package (`@circle-fin/swap-kit`) restricted to `SwapChain` (Ethereum/Base/Polygon/Solana
**mainnet** only — no testnets), so not usable here regardless.

**Resolution**: logged as PRD §5 "Phase 6 — Cross-chain EURC" roadmap item, not built now. The
only buildable path today is a non-Circle generic bridge (LayerZero/Wormhole/Axelar all move
arbitrary ERC-20s) — a real option, but a different trust/security model than the Circle-native
rail backing USDC, and a genuinely separate integration, not a quick add. `RouterModal` auto-
restricts the chain picker to Arc-only the moment EURC is selected, with an inline explanation,
rather than silently offering a bridge path that would fail.

### Phase 5 — Earn scope ruling: chain-aware balances, Keystone-only destinations

User's original vision for Earn was a full cross-chain yield aggregator (see arbitrary
third-party protocols across chains, deposit from wherever idle USDC sits) — that's what got
descoped early in this project toward "real yield from our own book," and the user flagged the
tension directly rather than silently accepting a narrower build. Splitting the vision in two
resolved it:

1. **Earn v1 destinations are Keystone venues only** — `KeystoneReserve` now, nothing else.
   Listing third-party ERC-4626 vaults from other protocols is a real idea but a different
   integration entirely (their contracts, their risk, their yield source) — roadmap only
   (PRD §5), not built this hackathon.
2. **Earn is chain-aware**: scan the user's real USDC balance per connected chain, render each
   as "idle balance → real Keystone yield → one-tap deposit" via the Router doors already built,
   rather than requiring the user to already be on Arc to see the vault at all.
3. **Which chains, this pass**: Arc/Base Sepolia/Arbitrum Sepolia via the existing wagmi
   connection — same infra `RouterModal` already uses, no new integration. Solana is a genuine
   stretch, not silently folded in: it needs its own wallet-connection library entirely (wagmi
   is EVM-only; Solana needs `@solana/wallet-adapter-react` or equivalent, a different
   connection flow, different signing). Checked (not assumed) that a real door exists for it
   either way: `BridgeChain["Solana_Devnet"]` **is** present in App Kit's CCTP-support enum
   (`chains.mjs`) — a first grep of that enum missed it (only checked the first 10 lines), a
   second full read confirmed it. So the primitive exists; the wallet-connection work to reach
   it doesn't yet. Ships after the EVM version is solid, not blocking it.
4. **Roadmap only, not built**: (a) an "Earn marketplace" of third-party ERC-4626 vaults across
   chains — the original aggregator vision, rebuilt on Keystone's own rails instead of scraping
   other protocols' APIs; (b) USYC as `KeystoneReserve`'s idle-capital strategy at mainnet (park
   the non-quoting portion of the vault in Circle's tokenized T-bill fund for a Treasury-yield
   floor under the market-making yield) — real, institutionally literate, but USYC requires
   Circle's manual allowlisting + a $100k minimum (see contract-addresses.mdx), so not usable
   in a testnet demo regardless.

---

## Phase 6/7 — Vault deposit routing bugs, and the cross-chain-to-vault dead end (2026-08-04/05)

Found while the user was trying to actually deposit into the Earn vault and it wasn't earning
anything: `VaultTable`'s DEPOSIT button had been wired to the same `useRouterModal().open()`
call as the Trade page's nav Deposit button — which only ever calls `BalanceManager.deposit()`
(a user's personal trading balance). It never called `KeystoneReserve.deposit()` (the actual
ERC-4626 vault). Nobody had ever deposited into the vault through the UI, which is why TVL and
APY sat at (effectively) zero. Fixed by building `useVaultDeposit.ts` (approve + real
`KeystoneReserve.deposit(assets, receiver)`) and, later, folding it into `RouterModal` as a
proper destination selector — see below.

### Smaller real bugs found and fixed along the way

1. **TVL stuck on "…" forever**: `useReserveTVL` did `totalAssets ? ... : null` — a real
   on-chain `0n` is falsy in JS, so "still loading" and "genuinely holds $0" rendered
   identically. Fixed to check `=== undefined` instead.
2. **Missing `chainId` on every Arc-direct contract call**: `useRouterFlow.ts`'s
   `depositDirectArc`/`withdrawDirectArcRaw`, the new `useVaultDeposit.ts`, and even
   `useReserveTVL`'s own read were all omitting `chainId`, silently defaulting to whatever chain
   the connected wallet happened to have active. Surfaced as `returned no data ("0x")` when the
   wallet was still switched to Arbitrum Sepolia from a prior cross-chain Router leg (reading
   Arc's USDC address against Arbitrum state, where that address is not a contract at all).
   Fixed by pinning `chainId: arcTestnet.id` everywhere Arc-direct.
3. **Adding `chainId` alone doesn't prompt a wallet network switch**: confirmed by reading
   `@wagmi/core`'s `writeContract`/`readContract` source directly — they use `chainId` only to
   pick the RPC client, and viem throws `ChainMismatchError` immediately if the wallet's actual
   active chain differs, with no prompt ever shown. The thing that actually triggers the
   wallet's "switch network" popup is calling `switchChain()` first. Added an `ensureChain()`
   helper (checks `getAccount(config).chainId`, calls `switchChain` only if it differs) and wired
   it into every Arc-direct write path.
4. **`kit.retryBridge()` was being called unconditionally on any bridge failure**, including
   failures that need the user to act (rejected wallet prompt, insufficient gas). Circle's SDK
   only supports retrying transient errors — calling `retryBridge()` on a non-retryable failure
   throws its own `"Retry not supported for this result, requires user action"`, masking the
   real error. Fixed by checking the SDK's own `isRetryableError()` on the failed step first and
   surfacing the step's real `errorMessage`/`errorCategory` (e.g. `user_rejected`) otherwise.

### Cross-chain-straight-to-vault: investigated, confirmed not viable with what's installed today

The ask (from a pasted third-party plan) was: bridge USDC from Base/Arbitrum directly into
vault shares, one signature, no Arc gas needed — reusing CCTP v2's "destination hooks" to
forward the mint into a deposit instruction, with the engine's `router-watcher` completing the
final hop.

Both premises were checked against the actual installed code, not assumed:

- **`router-watcher` cannot do this.** Read `packages/engine/src/router-watcher/index.ts` — it
  only watches Transfer events landing in a hardcoded list of *our own* demo wallets
  (`DEPLOYER`, `MM_BOT_A`, `DEMO_USER`, etc.) whose private keys the engine process holds
  locally, and its own code comment says explicitly: "a TEST-AUTOMATION CONVENIENCE, not the
  production trust model... the user's own wallet signs the follow-up deposit." It has no way to
  execute a transaction on behalf of an arbitrary connected user — that would require either
  their private key (which we never have) or a contract-level mechanism that doesn't need one.
- **CCTP v2 hookData/GenericExecutor forwarding is real but not shippable with our SDK.**
  `@circle-fin/app-kit`'s type definitions document `buildForwardingHookData` and
  `buildDepositForGenericExecutorPayload` (living in `@core/utils`) plus a required
  `GenericExecutor` contract address on the destination chain. Neither the `@core/utils` package
  nor those functions exist anywhere in `node_modules` — they're documented but unexported/
  unshipped in the version we have installed. Circle's chain registry (`chains.mjs`) also has no
  `genericExecutor` address configured for Arc Testnet. Using this would mean hand-encoding an
  undocumented magic-byte wire format with no way to verify correctness before spending real
  testnet USDC on live bridge attempts — not something to gamble on 5 days before submission.

**Decision**: defer the one-signature cross-chain-to-vault flow. The actually-viable pattern is
a per-user CREATE2 deposit-address factory — each connected wallet gets a deterministic Arc-side
contract as CCTP mint recipient (beneficiary baked in at deploy time via the CREATE2 salt), plus
a permissionless `sweep()` anyone (a keeper, or eventually the user) can call to forward that
contract's balance into `KeystoneReserve.deposit()`. This is a known, secure, buildable pattern
with no dependency on undocumented Circle internals — but it's genuine multi-day work (factory +
minimal proxy/vault + keeper script) with real security surface for a money-handling contract.
Logged here as a real roadmap item, not built now. **Shipped instead**: `RouterModal` gained a
`destination` selector (`TRADING` vs `VAULT`), Arc-direct/USDC-only for the vault leg — same UI,
different final contract call, no bridging risk. Cross-chain deposits still land in the trading
balance as before; moving that into the vault today is a manual bridge → withdraw → vault-deposit
sequence (or the internal one-flow Trading↔Vault move, see below) until the factory ships.

---

## Still open (carried into Phase 1+)

1. ~~Foundry install + `forge init` + OZ install~~ — done, see Phase 1 section above.
2. `pnpm approve-builds` for native deps — before Phase 4.
3. ArcNS vs InfinityName final pick for S2 — 15-min spike, Phase 4.
4. Router custody flow (bridged deposits → `BalanceManager` directly vs. user wallet on Arc
   first) — PRD open question #3, resolve in Phase 2, informed by the Base Sepolia
   Unified-Balance gap above (Base Sepolia must go through Bridge kit regardless of which
   custody model we pick).
5. Insertion-hint gas profile (`MAX_HINT_SCAN`) — validate in Foundry, Phase 1.
6. Arcscan Etherscan-compatible verification API — confirm endpoint/key format before wiring
   `forge script --verify`, Phase 1.

---

## Reference feed upgraded to Pyth (2026-08-10)

Resolves item 6 above in spirit and the open question from earlier in `reference-feed/update.ts`'s
own doc comment ("Chainlink/Pyth/Stork are all listed as available on Arc... but a specific live
testnet EUR/USD feed address wasn't verified"). It's now verified, three independent ways, not
just found in a doc page and trusted:

1. `docs.pyth.network`'s EVM contract-addresses page lists a row for "Arc Network Testnet" —
   address `0x2880aB155794e7179c9eE2e38200202908C17B43`.
2. `eth_getCode` against that address on Arc Testnet's own RPC returned real proxy bytecode, not
   empty — confirms something is actually deployed there, not a stale/wrong doc entry.
3. Called `getPriceUnsafe()` on it directly with the EUR/USD feed id (`0xa995d0...ec30b`, pulled
   from Pyth's own Hermes API — `hermes.pyth.network/v2/price_feeds` — not scraped off a
   JS-rendered doc table) and got back a live, fresh price (1.15626, published ~75min prior at
   time of check) matching the range Frankfurter had been giving all session.

`reference-feed/update.ts` now reads this on-chain via `getPythEurUsdMid()`
(`packages/engine/src/lib/arc.ts`) instead of calling Frankfurter's REST API, then pushes into
`MockOracle.setMid()` exactly as before — same architecture, upgraded data provenance. Verified
live: real `run-once` push succeeded, tx
`0x264569dbd4a891aab58bafb9f638145377695664c6e88676a5a667c1a97ec506`.

**Still not a fully decentralized read path, and said so in the UI** (Trade page's oracle badge
now reads `PYTH` instead of `SIMULATED`, Docs page tags MockOracle `PYTH-SOURCED` instead of
`SIMULATED` — not `REAL`, deliberately): `reference-feed` reads Pyth on-chain but then still
*pushes* the result into `MockOracle` as a single operator. Consumers (mm-bots, reserve-keeper,
`KeystoneReserve`'s NAV math) all read `MockOracle`, not Pyth directly. Removing that push step
entirely — bots reading Pyth directly, `KeystoneReserve` pointed at a small IPyth-adapter instead
of `MockOracle` — is the further step, and for `KeystoneReserve` specifically means a redeploy
(its `ORACLE` reference is `immutable`) plus migrating the live TVL. Logged as a real next step,
not done here.
