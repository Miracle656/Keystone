import { formatUnits } from "viem";
import { ERC20_ABI, ARC_TESTNET } from "@keystone/shared";
import { arcPublicClient, depositToBalanceManager } from "../lib/arc.js";
import { loadWallet, type WalletName } from "../lib/wallets.js";
import { logger, explorerTxUrl } from "../lib/logger.js";
import { USDC_ADDRESS, EURC_ADDRESS } from "../router/addresses.js";

const TRACKED_WALLETS: WalletName[] = ["DEPLOYER", "MM_BOT_A", "MM_BOT_B", "RESERVE_KEEPER", "DEMO_USER"];

/**
 * Wallet names allowed to be auto-credited by this process, via
 * ROUTER_WATCHER_AUTO_DEPOSIT_WALLETS (comma-separated, e.g. "DEMO_USER,MM_BOT_A").
 *
 * This is a TEST-AUTOMATION CONVENIENCE, not the production trust model — see
 * DECISIONS.md's Phase 2 custody-flow section. In the real product, a router-watcher
 * only detects arrivals and surfaces them to the UI; the user's own wallet signs the
 * follow-up BalanceManager.deposit(). This auto-deposit path only exists because our
 * own scripted demo already holds every listed wallet's private key.
 */
function autoDepositAllowlist(): Set<WalletName> {
  const raw = process.env.ROUTER_WATCHER_AUTO_DEPOSIT_WALLETS ?? "";
  return new Set(raw.split(",").map((s) => s.trim()).filter(Boolean) as WalletName[]);
}

/** In-memory only — fine for a demo-length run; a long-lived production watcher
 * would persist processed tx hashes (e.g. in the Phase 4 indexer's database) so a
 * restart doesn't risk re-processing the same arrival. */
const processed = new Set<string>();

export async function runRouterWatcher() {
  const wallets = TRACKED_WALLETS.map(loadWallet);
  const byAddress = new Map(wallets.map((w) => [w.address.toLowerCase(), w]));
  const allowlist = autoDepositAllowlist();
  const client = arcPublicClient();

  logger.info(
    { tracked: wallets.map((w) => `${w.name}:${w.address}`), autoDeposit: [...allowlist] },
    "router-watcher: starting, watching USDC + EURC Transfer events on Arc Testnet",
  );

  for (const token of [
    { address: USDC_ADDRESS, symbol: "USDC" },
    { address: EURC_ADDRESS, symbol: "EURC" },
  ]) {
    client.watchContractEvent({
      address: token.address,
      abi: ERC20_ABI,
      eventName: "Transfer",
      onLogs: async (logs) => {
        for (const log of logs) {
          const to = log.args.to?.toLowerCase();
          const wallet = to ? byAddress.get(to) : undefined;
          if (!wallet) continue; // not one of ours

          const key = `${log.transactionHash}:${log.logIndex}`;
          if (processed.has(key)) continue;
          processed.add(key);

          const amount = formatUnits(log.args.value ?? 0n, 6);
          const txUrl = explorerTxUrl("Arc Testnet", log.transactionHash ?? "");
          logger.info({ wallet: wallet.name, token: token.symbol, amount, txUrl }, "router-watcher: arrival detected");

          if (allowlist.has(wallet.name)) {
            logger.info({ wallet: wallet.name }, "router-watcher: wallet is in auto-deposit allowlist, crediting BalanceManager");
            try {
              const depositHash = await depositToBalanceManager(wallet.account, token.address, log.args.value ?? 0n);
              logger.info(
                { wallet: wallet.name, txUrl: explorerTxUrl("Arc Testnet", depositHash) },
                "router-watcher: auto-deposit confirmed",
              );
            } catch (err) {
              logger.error({ wallet: wallet.name, err }, "router-watcher: auto-deposit failed");
            }
          }
        }
      },
      onError: (err) => logger.error({ err }, "router-watcher: subscription error"),
    });
  }

  logger.info({ explorer: ARC_TESTNET.blockExplorers.default.url }, "router-watcher: subscriptions live, waiting for arrivals");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRouterWatcher().catch((err) => {
    logger.error({ err }, "router-watcher: fatal error");
    process.exit(1);
  });
}
