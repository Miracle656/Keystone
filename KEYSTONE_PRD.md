# KEYSTONE — Product Requirements Document
**Version:** 2.0 (supersedes APO_PRD.md) · **Date:** 13 July 2026 · **Author:** Dev Sultan
**Hackathon:** Encode Club × Arc — Programmable Money Hackathon (Final: Sun 9 Aug 2026, AoE)
**Tracks entered:** DeFi (primary) + Agentic Economy (secondary — same project, genuinely qualifies for both)

---

## 0. TL;DR

**Keystone** is the on-chain liquidity layer for Arc. A keystone is the load-bearing center stone of an arch — the piece that locks the structure together and lets it span. That's the product in one image: **the load-bearing market of Arc, spanning every chain USDC lives on.**

Three layers, one protocol:

1. **The Book** — a permissionless, fully on-chain central limit order book (CLOB) for stablecoin pairs on Arc. Flagship pair: **USDC/EURC** (on-chain FX — one of Arc's four flagship use cases). Matching happens on-chain; every fill is a verifiable event.
2. **The Router** — the cross-chain door. USDC from **any supported chain** (Base, Arbitrum, and beyond) enters via **Circle Gateway Unified Balance** and **CCTP v2** (App Kits `unifiedBalance` / `bridge`), trades on Arc, and exits to any chain. One balance in, Arc execution, any chain out.
3. **Earn** — an ERC-4626 vault (**Keystone Reserve**) that provides passive liquidity to the Book. Depositors earn **real yield**: maker fees and spread capture from actual trading. One number, growing, with receipts.

**Two surfaces at launch:** a **Pro Trade view** (ladder, depth chart, order ticket) and a **simple Earn view** (one number + analytics). **Display currency is a user setting** — USD, EUR, BRL, NGN, JPY, MXN, PHP, KRW, whatever — never an identity. Keystone is global infrastructure; no flag on it.

**One-liner:** *"The on-chain order book for internet money — any chain in, Arc execution, real yield out."*

---

## 1. The thesis (why this, why Arc, why now)

Fully on-chain order books have been **economically impossible on EVM chains**. Every place, cancel, and match is a transaction; on chains with volatile gas, market makers refreshing quotes hundreds of times a day bleed to death, so serious books went off-chain (dYdX-style) or died. The one great counterexample — DeepBook on Sui — proved native CLOBs work **when execution is sub-second and fees are negligible and predictable**.

Arc is the first EVM chain with exactly those properties: deterministic sub-second finality (~780ms benchmarks) and **flat, sub-cent, dollar-denominated fees** with fee-smoothing designed for financial workloads. The enabling conditions for an on-chain book now exist on an EVM chain — and the slot is **empty**. Circle's own StableFX is a *permissioned RFQ venue for institutions*; Circle's roadmap references native stablecoin-swap infrastructure *eventually*. Today, nobody has built the **permissionless public order book** — for traders, apps, and agents.

The global expansion path is written on Arc's own partner list: regional stablecoin issuers for **BRL (BRLA), JPY (JPYC), MXN (MXNB), PHP (PHPC), KRW (KRW1), CAD (QCAD), AUD (AUDF)** are onboarding to Arc. Every one of those is a future pair on the Book. Keystone's endgame: **the FX venue for internet money.**

And the third leg: the documented friction in stablecoin usage worldwide isn't fees — it's *coordination* across tokens, networks, and liquidity. The Router erases it: Gateway + CCTP make "which chain am I on" a non-question.

---

## 2. Personas (deliberately multi-geo)

**P1 — Mara, 31, Lisbon. Independent trader.**
Trades EUR/USD exposure via stablecoins. Hates CEX custody, hates RFQ opacity. Wants: a tight USDC/EURC book, transparent depth, on-chain settlement she can verify, withdrawal to wherever her capital lives.

**P2 — Joy, 26, Manila. Saver.**
Local currency wobbles; she wants dollar yield without learning what a bridge is. Wants: deposit → one number growing → PHP display. Never sees the word "orderbook."

**P3 — Rafael, 29, São Paulo. Bot builder.**
Runs quoting strategies. Wants: a clean contract interface, deterministic events, cheap cancel-replace (Arc's flat fees make his loop viable for the first time on EVM), and eventually an SDK.

**P4 — Judge / Circle reviewer.**
Wants: real activity on Arc testnet, correct deep use of Circle primitives (Gateway, CCTP, App Kits, EURC), honest simulation labels, a team building for six months, and a reason this *needed* Arc. Keystone's thesis IS that reason.

---

## 3. Product principles

1. **On-chain-ness is the product.** Matching on-chain. Every order, cancel, and fill is an event with a hash. If we're ever forced to choose, we shrink the book — we never move matching off-chain.
2. **Global by default.** Currency is a display preference. Copy, examples, and marketing never anchor to one country.
3. **Real yield only.** Earn APY comes from fees and spread actually captured on the Book. No drips, no fake numbers. If yield is low, we show low.
4. **Two speeds, one venue.** Pro and simple surfaces share the same book and the same truth.
5. **Agents are participants, not chatbots.** Market-making agents trade on the Book (Agentic track). Conversational interfaces (WhatsApp/Telegram AI, multi-language) are the **Phase 2 access layer**, post-hackathon — the venue comes first.
6. **Honest demo.** Simulated components (reference-price oracle, display FX rates, any mock token) are labeled in code and UI. Bootstrap liquidity comes from our own disclosed bots — like every new venue in history.

---

## 4. Scope

### 4.1 MVP — must have (judged 9 Aug)

**The Book**
- **M1. `KeystoneBook`** (Solidity, Arc testnet): pair registry (tick size, lot size); **limit + market orders**; cancel; **price-time priority** (FIFO within price level); maker/taker fees in bps routed to `FeeCollector`; **bounded matching** (max fills per tx with partial-fill rest/resume) so no order can exceed gas limits; escrowed internal balances via `BalanceManager` (deposit once, trade many, withdraw on demand); full event surface (`OrderPlaced/OrderCanceled/OrderFilled/TradeExecuted`).
- **M2. Launch pairs:** `USDC/EURC` (flagship — both from Circle's faucet, both first-class on Arc) and `USDC/USDT` (if no canonical testnet USDT on Arc exists, deploy `MockUSDT` clearly labeled; verify in sprint 1). `USDC/cirBTC` is a Could.

**The Router**
- **M3.** Deposit USDC from **Arc, Base Sepolia, Arbitrum Sepolia** into Keystone balance via App Kit **`unifiedBalance.deposit()` / `bridge()` (CCTP v2)**; withdraw from Keystone to **any supported chain**. Honest multi-step pending UI on the bridge path (per Circle's bridge-error-recovery guidance).

**Earn**
- **M4. `KeystoneReserve`** (ERC-4626, Arc): deposits USDC; a `ReserveKeeper` places passive symmetric quotes around mid on the flagship pair within inventory bounds; harvests maker fees + spread into the vault. Share price only ever reflects **real captured value**. Fallback if quoting v1 slips: fee-share model (vault holds a claim on `FeeCollector`) — still real yield, ship the quoting version if at all possible.

**Liquidity & agents**
- **M5.** Two seed **market-maker agents** (TypeScript): quote around a reference mid (labeled mock oracle with realistic EUR/USD rate), inventory-aware spread widening, cancel-replace loop. These make the book alive on day one AND are the Agentic-track entry verbatim: *agents with decision logic tied to real signals, autonomous settlement, no human in the loop.*

**Surfaces**
- **M6. Trade view (pro):** pair selector, order-book ladder, **depth chart**, recent-trades tape, order ticket (limit/market), open orders, balances, candle chart (from indexer).
- **M7. Earn view (simple):** one balance in display currency, live APY, deposit/withdraw, earnings-over-time chart, "where the yield comes from" breakdown (fees vs spread).
- **M8. Router UI:** deposit/withdraw modals with chain picker and honest step indicators.
- **M9. Display-currency setting:** USD / EUR / BRL / NGN / JPY / MXN / PHP / KRW (+more); demo FX rates labeled `demo rate`.
- **M10. Transparency page:** live volume, trade count, spreads, book depth, Reserve TVL/APY — every number one tap from **testnet.arcscan.app**; includes a "verify a fill" widget (paste tx hash → decoded fill).

### 4.2 Should have
- S1. Order flags: **post-only** and **IOC**.
- S2. **`.arc` name resolution** in the trades tape and leaderboard via **InfinityName** on Arc testnet (contract `0x76a816…d9De`, one `getPrimaryDomain` read) — show `mara.arc` instead of `0x9f…`. Cheap, high polish.
- S3. Public **API/docs page** (contract addresses, ABIs, event schemas, bot quickstart) — plants the "infrastructure" flag for judges and for Rafael.
- S4. Leaderboard (volume, PnL-lite) — seeds the daily-return loop for traders.
- S5. Light/dark mode (dark default).

### 4.3 Could have (only after S-items)
- C1. `USDC/cirBTC` pair.
- C2. Reserve **grid strategy v2** (multiple ladder levels, dynamic spread).
- C3. Read-only **Telegram price bot** (teaser of the Phase 2 conversational layer — read-only, no trading).
- C4. Mint **keystone.arc** + protocol identity page.

### 4.4 Won't have (hackathon) — this list is law
- Mainnet anything. ❌
- Conversational/AI trading interfaces (WhatsApp/Telegram AI is **Phase 2, post-hackathon** — stated on the roadmap slide, absent from the build). ❌
- Margin, perps, leverage, lending. ❌
- Off-chain matching engine. If matching costs bite, we shrink book depth and pair count — never the on-chain property. ❌
- Token, points, airdrop mechanics. ❌
- Building our own name service (integrate InfinityName; never build). ❌

---

## 5. Post-hackathon roadmap (the accelerator slide)

**Phase 2 — Access:** conversational trading & saving via **WhatsApp/Telegram AI agents, multi-language** ("buy €500 of EURC", "how's my vault doing?") sitting on the same Book; mobile PWA→native.
**Phase 3 — Pairs:** regional stablecoin listings as issuers land on Arc mainnet (BRLA, JPYC, MXNB, PHPC, KRW1, QCAD, AUDF) → the internet-FX venue.
**Phase 4 — Agents as customers:** agent SDK; x402-gated premium market-data feeds; the Reserve as programmable liquidity for third-party strategies.
**Phase 5 — Matching-engine maturity** (benchmarked against DeepBook v3, the production Sui CLOB): on-chain level-2 depth queries and quote-simulation ("spend X, get Y") view functions so the Trade UI doesn't depend solely on the indexer; a scalable order-book data structure (skip-list/B-tree-style, replacing the current bounded-hint-scan insertion) once order density outgrows demo scale; gas-spike-aware taker-fee adjustment as an additional congestion/MEV defense layered on top of Arc's already-strong deterministic BFT ordering; on-chain governance and volume-tiered maker rebates once there's real trading volume to govern.
**Phase 6 — Cross-chain EURC:** the Router's deposit/withdraw doors are USDC-only today because both of Circle's own cross-chain mechanisms (CCTP v2 bridge, Gateway unified balance) are USDC-only at the SDK level (`token?: 'USDC'`, `SUPPORTED_TOKENS: ["USDC"]` — confirmed directly against `@circle-fin/app-kit`'s type definitions, not assumed), even though EURC itself is deployed on both Arc and Base Sepolia. Revisit if/when Circle extends CCTP/Gateway to EURC; until then, a non-Circle generic bridge (LayerZero, Wormhole, Axelar — all support arbitrary ERC-20s) is the only buildable path, at the cost of a different trust/security model than the Circle-native rail backing USDC today. EURC deposits/withdrawals stay Arc-direct-only (fully real, no bridge needed) in the meantime.
**Phase 7 — Earn as a cross-chain yield front door:** two extensions once v1 (Keystone-only destinations) is proven. (a) **Earn marketplace** — list third-party ERC-4626 vaults from other protocols/chains as additional deposit destinations alongside `KeystoneReserve`, with the Router moving the money; the original "aggregate yield across every chain" vision, rebuilt on Keystone's own rails instead of scraping other protocols' APIs. (b) **USYC as idle-capital strategy** — at mainnet, park the portion of `KeystoneReserve`'s capital that isn't actively quoting in Circle's tokenized T-bill fund (USYC) for a Treasury-yield floor underneath the market-making yield: trading yield on top of T-bill yield. Confirmed real (Arc's own contract-addresses page lists it) but institutional-only today (Circle allowlisting + $100k minimum) — not usable in a testnet demo regardless of engineering effort.
**Production hygiene:** audits, licensed on/off-ramp partners for fiat doors, jurisdiction analysis.

---

## 6. User flows (for UI design)

**F1 — Trader (Mara):** Landing → Launch app → connect wallet → Deposit modal → picks **Base** → App Kit bridge/unified-balance flow with step indicator → balance credited → Trade view → places limit buy USDC/EURC 2 ticks under mid → order rests in ladder (highlighted "yours") → MM bot crosses it → row flashes, fill toast with tx hash → open orders updates → later withdraws profits **to Arbitrum** in one modal.

**F2 — Saver (Joy):** Landing → "Earn" → connect → deposit USDC (any chain door) → Earn view: one number in **PHP**, APY badge, sparkline → returns daily; taps "where does this come from?" → plain-language breakdown + receipts.

**F3 — Judge verification:** Transparency page → pick any trade → "verify a fill" → decoded event + arcscan link → checks Reserve on the ladder (its quotes visibly resting) → replays a Router deposit from Base Sepolia with faucet funds per README.

**F4 — Bot builder (Rafael):** Docs page → copies bot quickstart → runs example quoter against testnet → his orders appear on the public ladder within seconds.

**F5 — Demo money-shot (video):** split screen — order ticket on the left, arcscan on the right. Place limit → bot takes it → `TradeExecuted` event confirmed on-chain **in ~1 second**. Then the Router: deposit lands from Base, trades instantly. Then Earn: Reserve quotes visible on the ladder, APY ticking from real fees.

---

## 7. Screen inventory (Claude Design: build these)

| # | Screen | Purpose | Key components | States |
|---|--------|---------|----------------|--------|
| 1 | Landing | Thesis → convert | Hero (Keystone Arch signature — see §8), thesis strip ("On-chain books were impossible on EVM. Arc changed the physics."), live stats bar (volume, trades, TVL, avg spread), two CTAs: **Trade** / **Earn**, honesty section | default |
| 2 | Trade | The venue | Pair selector, ladder (bids/asks, user orders highlighted), depth chart, candle chart, trades tape (with `.arc` names), order ticket (limit/market, post-only/IOC), open orders, balances strip | empty book, thin book, live, order lifecycle (pending/resting/partial/filled/canceled), error |
| 3 | Earn | One number | Balance (display currency), APY badge, deposit/withdraw, earnings chart, yield-source breakdown, Reserve status pill ("quoting now") | empty, funded, loading |
| 4 | Deposit modal (Router) | Any chain in | Chain picker (Arc/Base/Arbitrum logos), amount, review, multi-step pending (Detected → Bridging → Credited), success | each step, error with plain fix |
| 5 | Withdraw modal (Router) | Any chain out | Amount+Max, destination chain, review (fees line), pending, receipt | steps, error |
| 6 | Portfolio | My stuff | Book balances, open orders summary, Reserve position, router history | empty, populated |
| 7 | Transparency / Stats | Trust | Volume/trades/spread/TVL tiles, verify-a-fill widget, recent protocol events feed with explorer links | populated |
| 8 | Docs / API | Builders | Addresses, ABIs, event schemas, bot quickstart code block | default |
| 9 | Settings | Utility | Display currency picker, light/dark, raw-values toggle | default |

**Component library:** ladder row, depth chart, candle chart, trades-tape row (address→`.arc` chip), order ticket, order-status chip, chain badge, step indicator, stat tile, APY badge, currency picker, honesty badge (`demo rate`/`mock`), toast system, skeletons, empty states with one action.

---

## 8. Design brief (for Claude Design)

**Subject world:** load-bearing architecture meets market microstructure — arches, keystones, mortar, span; ladders, spreads, fills. **Audience:** pro traders (dark-terminal literacy) and everyday savers (clarity above all), sharing one system. **The page's single job:** make on-chain market activity feel *fast, solid, and provable.*

**Aesthetic direction:** industrial neobrutalism, dark-first. Hard 1.5–2px borders, hard offset shadows (no blur), 0–2px radius, flat fills, dense-but-disciplined data layout. Chunky press states (shadow collapses). Explicitly avoid the generic AI looks (cream+serif+terracotta; plain black+acid-green; broadsheet hairlines) — this is stone and signal, not a template.

**Design tokens:**
- **Color (6):** `Basalt #0D0E11` (background), `Limestone #EDEAE2` (primary text / inverse surfaces), `Keystone Gold #E8B54D` (brand, signature accents, mid-price), `Bid Green #2FBF71`, `Ask Red #E5484D`, `Mortar #2A2C33` (borders, dividers, muted). Light mode: swap Basalt/Limestone, keep Gold/Green/Red, Mortar lightens to `#C9C4B8`.
- **Type:** Display — **Archivo Expanded** (Black/Bold): headers, pair tickers, hero (the arch-y name is a bonus, the width and authority are the point). Body — **Inter**. Data — **JetBrains Mono**, tabular numerals in every ladder, tape, and money figure.
- **Layout:** Trade view is desktop-first (12-col grid: ladder | chart+ticket | tape) collapsing to tabbed mobile; Earn is mobile-first single column (430px), centered on desktop. Landing: full-bleed hero, then stats bar, then split Trade/Earn doors.
- **Signature element — THE KEYSTONE ARCH:** the depth chart is rendered as the two shoulders of an arch (bids rising from the left, asks from the right) meeting at the spread, with a **gold keystone block marking mid-price** that "locks" with a subtle settle animation on every executed trade. On Landing, the hero is this arch built live from real testnet book data. Spend all the boldness here; everything else stays quiet and precise.
- **Motion:** keystone pulse per trade; ladder row flash on quote updates; count-up on Earn balance; one orchestrated Landing load (arch assembles stone-by-stone from live levels). Respect `prefers-reduced-motion`.
- **Copy voice:** on Trade — precise trader vocabulary, zero fluff ("Place limit order", "Post-only", "Filled 0.42 @ 1.1512"). On Earn — plain second person, zero jargon ("Your money is quoting on the market and earning the fees"). Errors say what happened and the fix. No country-anchored copy anywhere; currency examples rotate (€, R$, ₦, ¥, ₱).

---

## 9. System architecture

```
┌────────────────────────── apps/web (Next.js 15) ───────────────────────────┐
│  Landing · Trade (ladder/depth/candles/ticket) · Earn · Router modals ·    │
│  Portfolio · Transparency · Docs · Settings                                │
│  wagmi/viem · TanStack Query · charts · reads indexer + chain              │
└───────────────▲───────────────────────────────────────────▲────────────────┘
                │ REST/WS                                   │ user-signed txs
┌───────────────┴───────────────┐               ┌───────────┴────────────────┐
│  packages/engine (TS)         │               │        User wallet         │
│  • mm-bot ×2: quote around    │               └────────────────────────────┘
│    mock-oracle mid, inventory │      Circle App Kits SDK
│    bounds, cancel-replace     │  ┌─────────────────────────────┐
│  • reserve-keeper: vault      │  │ unifiedBalance.deposit /    │
│    quoting + fee harvest      │──▶ spend (Gateway) ·           │
│  • router-watcher: credits    │  │ bridge() (CCTP v2)          │
│    incoming bridge deposits   │  └─────────────────────────────┘
└───────┬───────────────────────┘
        │ contract calls                          events
┌───────▼─────────────────────────────────────────────────────────────────────┐
│                    ARC TESTNET (chain 5042002) — the venue                  │
│  PairRegistry · KeystoneBook (matching, price-time FIFO, bounded fills) ·   │
│  BalanceManager (escrow) · FeeCollector · KeystoneReserve (ERC-4626) ·      │
│  MockOracle [SIMULATED, labeled] · MockUSDT [only if needed, labeled]       │
└───────┬─────────────────────────────────────────────────────────────────────┘
        │ Gateway / CCTP v2 (App Kit)
┌───────▼──────────────────────────────┐   ┌────────────────────────────────┐
│ BASE SEPOLIA / ARBITRUM SEPOLIA:     │   │ packages/indexer: events →     │
│ user USDC sources (Router doors)     │   │ SQLite → trades/candles/depth/ │
└──────────────────────────────────────┘   │ APY/stats REST                 │
                                           └────────────────────────────────┘
```

**REAL on testnet:** the Book and every match, fill, cancel, and fee; escrow accounting; Reserve share accounting and captured yield; Gateway unified-balance deposits; CCTP v2 legs; sub-second Arc settlement; every receipt on arcscan.
**SIMULATED (labeled):** reference-mid oracle (realistic EUR/USD etc.), display FX rates, MockUSDT if no canonical testnet USDT, and the fact that bootstrap liquidity is our own disclosed bots.

---

## 10. Hackathon fit (judge mapping)

| Judging signal | How Keystone hits it |
|---|---|
| DeFi: "Advanced programmable logic using USDC or EURC" | A matching engine in Solidity operating directly on USDC/EURC — about as advanced as programmable stablecoin logic gets. |
| DeFi: "Conditional flows, onchain automation, multi-step settlement" | Order lifecycle (rest→partial→fill→settle), bounded matching with resumption, Reserve keeper automation. |
| DeFi: "Cross-chain liquidity using Arc as a settlement hub" | The Router, verbatim: Gateway + CCTP in, Arc execution, any chain out. |
| DeFi: "Demonstrate why stablecoin-native infrastructure changes what's possible" | **The thesis itself:** flat sub-cent USDC fees + sub-second finality make an on-chain CLOB economically rational on EVM for the first time. Keystone *cannot exist* on Ethereum L1. |
| Agentic: "agents that manage wallets and rebalance funds across chains / clear decision logic tied to real signals / autonomous settlement" | The MM agents and ReserveKeeper: real signals (mid, inventory, spread), autonomous quoting and settlement, zero human loop, on-chain audit trail. |
| Tools checklist | Arc ✓ USDC ✓ EURC ✓ CCTP ✓ Gateway ✓ App Kits ✓. |
| "Something you'll work on in 6 months" | Roadmap: mainnet venue → regional-stablecoin pairs from Arc's own issuer list → conversational access layer → agent SDK. We're building the public market infrastructure Circle's roadmap implies. |
| Execution > complexity | One book done properly, invariant-tested, everything replayable on arcscan. |

**3-minute video beats:** (0:00) thesis — why no EVM chain has an on-chain order book, and what Arc changed · (0:30) split-screen: place a limit, a bot crosses it, `TradeExecuted` on arcscan in ~1s · (1:10) Router: deposit from Base Sepolia via Gateway, trade instantly, withdraw to Arbitrum · (1:45) Earn: Reserve's quotes visible on the ladder, APY ticking from *real* fees, Joy's one-number view in ₱ · (2:20) Transparency page + honest real-vs-simulated slide · (2:40) roadmap: seven regional stablecoins → the FX venue for internet money; Phase 2 = trade by chat.

---

## 11. Milestones vs checkpoints

| Date | Checkpoint | Deliverable |
|---|---|---|
| Jul 16 | (Devvit ships — other hackathon) | — |
| **Jul 19** | **CP1: project + team + idea** | Paste §13 blurb; repo initialized; keystone.arc minted |
| Jul 17–25 | Sprint 1 — the Book | `KeystoneBook` + `BalanceManager` + `FeeCollector` deployed to Arc; invariant/fuzz tests green; MM bots trading USDC/EURC live; minimal ladder UI reading the real book |
| **Jul 26** | **CP2: repo + progress** | Above — a living on-chain order book with autonomous makers is a monster mid-submission |
| Jul 27–Aug 3 | Sprint 2 — Router + Earn | Gateway/CCTP doors both directions; KeystoneReserve quoting + real APY; indexer (trades/candles/depth) |
| Aug 3–6 | Sprint 3 — Surfaces | Claude-Design UI integrated: Trade, Earn, Transparency, Docs; `.arc` resolution; S-items |
| Aug 7–8 | Freeze + package | Video, deck, README, judge replay guide, CI green |
| **Aug 9** | **CP3: FINAL** | Deployed MVP on Arc, public repo, 3-min video, deck — zero placeholders |

---

## 12. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Matching gas blow-ups (the classic on-chain CLOB killer) | Bounded `maxMatches` per tx with rest/resume; tick+lot sizes keep levels coarse; capped book depth per side; caller-provided insertion hints with bounded fallback scan; fuzz tests targeting worst-case paths. Arc's flat low fees are the safety net that makes cancel-replace viable at all. |
| No canonical testnet USDT on Arc | Verify in sprint 1; else `MockUSDT`, loudly labeled; USDC/EURC carries the demo regardless (both faucet-native). |
| App Kit `KIT_KEY` / Console access delay | Register console.circle.com day 1; fallback: drive Gateway + CCTP v2 contracts directly via viem (docs: contract-addresses). |
| Gateway/bridge edge cases & latency | Build the multi-step pending UI first-class per `/app-kit/references/bridge-error-recovery`; router-watcher retries idempotently. |
| RPC flakiness (Arc or Base Sepolia) | Retry/backoff wrapper, indexer as read cache, record the demo video early as insurance. |
| Faucet limits (need USDC + EURC treasuries for bots/Reserve) | Farm faucet.circle.com **daily from day 1** across deployer / bots / reserve / demo wallets. |
| "Keystone" trademark adjacency (hardware wallet exists) | Different category; brand as **Keystone** with handles `keystone.exchange` / KeystoneDEX; keystone.arc minted; revisit naming legal at accelerator stage. |
| Scope creep | §4.4 is law. C-items only after S-items. The cut line is always *smaller book, fewer pairs* — never off-chain matching. |
| Windows dev env | Foundry under WSL2; Node/pnpm native; both documented in README. |

---

## 13. Checkpoint 1 blurb (paste-ready)

> **Keystone — the on-chain order book for internet money.**
> Fully on-chain CLOBs have been economically impossible on EVM chains: volatile gas kills the place/cancel/match loop. Arc changes the physics — sub-second deterministic finality and flat, sub-cent USDC fees — and Keystone is the first permissionless order book built for it. **The Book:** on-chain matching for stablecoin pairs, flagship USDC/EURC (on-chain FX). **The Router:** USDC from any chain in via **Gateway Unified Balance + CCTP v2**, Arc execution, any chain out. **Earn:** an ERC-4626 reserve that quotes the book passively — depositors earn *real* maker fees and spread, shown as one simple number in their own display currency (USD, EUR, BRL, JPY, PHP…). Liquidity is bootstrapped by autonomous market-making agents with decision logic tied to live signals — our Agentic-track entry acts, it doesn't chat. Roadmap: regional stablecoin pairs as Arc's issuers (BRLA, JPYC, MXNB, PHPC, KRW1, QCAD, AUDF) reach mainnet, then a conversational access layer. Tracks: **DeFi + Agentic Economy.** Demo: testnet-live, matching fully on-chain, every fill replayable on arcscan; simulated pieces (reference oracle, display FX) clearly labeled.

---

## 14. Open questions (resolve in sprint 1)
1. Canonical testnet USDT on Arc — exists? (Else MockUSDT.) Check `/arc/references/contract-addresses` + faucet.
2. Exact App Kits npm package names + viem adapter — confirm via docs.arc.io/app-kit and llms.txt.
3. Router custody flow: do bridged deposits credit `BalanceManager` directly, or land in user wallet on Arc first? Pick the flow with the fewest trust assumptions and document in `DECISIONS.md`.
4. Insertion-hint design for price levels: client-supplied hint + bounded scan fallback — validate gas profile in Foundry before committing.
5. InfinityName vs ArcNS reliability for the S2 `.arc` integration — 15-minute spike, pick one.
