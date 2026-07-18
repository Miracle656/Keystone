import { createPublicClient, createWalletClient, http, fallback, parseEventLogs, type Address, type Account } from "viem";
import { ARC_TESTNET, BALANCE_MANAGER_ABI, ERC20_ABI, KEYSTONE_BOOK_ABI, MOCK_ORACLE_ABI, KEYSTONE_RESERVE_ABI } from "@keystone/shared";

// Arc's primary public testnet RPC rate-limits fairly aggressively under
// back-to-back calls (hit repeatedly across Phase 0 balance checks, the Phase 2
// round-trip, and the reference-feed push) — a single-endpoint retry/backoff
// wasn't enough on its own. Falling back across all recorded provider endpoints
// (docs.arc.io/arc/tools/node-providers) spreads load and survives one
// provider's rate limit instead of just waiting it out.
const TRANSPORT_OPTS = { retryCount: 3, retryDelay: 1500 };
const arcTransport = fallback(
  [
    ARC_TESTNET.rpcUrls.default.http[0],
    ARC_TESTNET.rpcUrls.blockdaemon.http[0],
    ARC_TESTNET.rpcUrls.drpc.http[0],
    ARC_TESTNET.rpcUrls.quicknode.http[0],
  ].map((url) => http(url, TRANSPORT_OPTS)),
);

export function arcPublicClient() {
  return createPublicClient({ transport: arcTransport, pollingInterval: 2000 });
}

export function arcWalletClient(account: Account) {
  return createWalletClient({ account, transport: arcTransport });
}

const BALANCE_MANAGER_ADDRESS = process.env.BALANCE_MANAGER_ADDRESS as Address;
const KEYSTONE_BOOK_ADDRESS = process.env.KEYSTONE_BOOK_ADDRESS as Address;

/** Approves + deposits `amount` (token base units) into BalanceManager on Arc, from `account`. */
export async function depositToBalanceManager(account: Account, token: Address, amount: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const allowance = await publicClient.readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, BALANCE_MANAGER_ADDRESS],
  });
  if (allowance < amount) {
    const approveHash = await walletClient.writeContract({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [BALANCE_MANAGER_ADDRESS, amount],
      chain: null,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const depositHash = await walletClient.writeContract({
    address: BALANCE_MANAGER_ADDRESS,
    abi: BALANCE_MANAGER_ABI,
    functionName: "deposit",
    args: [token, amount],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash: depositHash });
  return depositHash;
}

/** Withdraws `amount` (token base units) from BalanceManager on Arc to `account`'s own wallet. */
export async function withdrawFromBalanceManager(account: Account, token: Address, amount: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const hash = await walletClient.writeContract({
    address: BALANCE_MANAGER_ADDRESS,
    abi: BALANCE_MANAGER_ABI,
    functionName: "withdraw",
    args: [token, amount],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function placeLimit(
  account: Account,
  pairId: bigint,
  isBid: boolean,
  price: bigint,
  qty: bigint,
  flags = 0,
  levelHint = 0n,
) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const hash = await walletClient.writeContract({
    address: KEYSTONE_BOOK_ADDRESS,
    abi: KEYSTONE_BOOK_ABI,
    functionName: "placeLimit",
    args: [pairId, isBid, price, qty, flags, levelHint],
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // writeContract only gives the tx hash, not placeLimit's return values — decode
  // the orderId from the OrderPlaced event instead (always emitted, even if the
  // order fully fills within the same tx).
  const [placed] = parseEventLogs({ abi: KEYSTONE_BOOK_ABI, eventName: "OrderPlaced", logs: receipt.logs });
  if (!placed) throw new Error(`placeLimit: OrderPlaced event not found in receipt (tx ${hash})`);

  return { hash, receipt, orderId: placed.args.orderId };
}

/** IOC marketable order: crosses the book up to `worstPrice`, refunds any unfilled remainder. */
export async function placeMarket(account: Account, pairId: bigint, isBid: boolean, qty: bigint, worstPrice: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const hash = await walletClient.writeContract({
    address: KEYSTONE_BOOK_ADDRESS,
    abi: KEYSTONE_BOOK_ABI,
    functionName: "placeMarket",
    args: [pairId, isBid, qty, worstPrice],
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const [placed] = parseEventLogs({ abi: KEYSTONE_BOOK_ABI, eventName: "OrderPlaced", logs: receipt.logs });
  if (!placed) throw new Error(`placeMarket: OrderPlaced event not found in receipt (tx ${hash})`);
  const fills = parseEventLogs({ abi: KEYSTONE_BOOK_ABI, eventName: "OrderFilled", logs: receipt.logs });

  return { hash, receipt, orderId: placed.args.orderId, fills };
}

export async function cancelOrder(account: Account, orderId: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const hash = await walletClient.writeContract({
    address: KEYSTONE_BOOK_ADDRESS,
    abi: KEYSTONE_BOOK_ABI,
    functionName: "cancel",
    args: [orderId],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function balanceManagerBalance(account: Address, token: Address) {
  return arcPublicClient().readContract({
    address: BALANCE_MANAGER_ADDRESS,
    abi: BALANCE_MANAGER_ABI,
    functionName: "balanceOf",
    args: [account, token],
  });
}

export async function walletBalance(account: Address, token: Address) {
  return arcPublicClient().readContract({
    address: token,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [account],
  });
}

export async function getOrder(orderId: bigint) {
  return arcPublicClient().readContract({
    address: KEYSTONE_BOOK_ADDRESS,
    abi: KEYSTONE_BOOK_ABI,
    functionName: "getOrder",
    args: [orderId],
  });
}

export async function bestBidAsk(pairId: bigint) {
  const client = arcPublicClient();
  const [bid, ask] = await Promise.all([
    client.readContract({ address: KEYSTONE_BOOK_ADDRESS, abi: KEYSTONE_BOOK_ABI, functionName: "bestBid", args: [pairId] }),
    client.readContract({ address: KEYSTONE_BOOK_ADDRESS, abi: KEYSTONE_BOOK_ABI, functionName: "bestAsk", args: [pairId] }),
  ]);
  return { bid, ask };
}

export async function getOracleMid(oracleAddress: Address, base: Address, quote: Address) {
  return arcPublicClient().readContract({
    address: oracleAddress,
    abi: MOCK_ORACLE_ABI,
    functionName: "getMid",
    args: [base, quote],
  });
}

export async function setOracleMid(account: Account, oracleAddress: Address, base: Address, quote: Address, mid1e18: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);
  const hash = await walletClient.writeContract({
    address: oracleAddress,
    abi: MOCK_ORACLE_ABI,
    functionName: "setMid",
    args: [base, quote, mid1e18],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

// ── KeystoneReserve ─────────────────────────────────────────────────────────────

export async function reserveDeposit(account: Account, reserveAddress: Address, quoteToken: Address, assets: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const allowance = await publicClient.readContract({
    address: quoteToken,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: [account.address, reserveAddress],
  });
  if (allowance < assets) {
    const approveHash = await walletClient.writeContract({
      address: quoteToken,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [reserveAddress, assets],
      chain: null,
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  const hash = await walletClient.writeContract({
    address: reserveAddress,
    abi: KEYSTONE_RESERVE_ABI,
    functionName: "deposit",
    args: [assets, account.address],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function reservePlaceQuote(
  account: Account,
  reserveAddress: Address,
  isBid: boolean,
  price: bigint,
  qty: bigint,
  levelHint = 0n,
) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const hash = await walletClient.writeContract({
    address: reserveAddress,
    abi: KEYSTONE_RESERVE_ABI,
    functionName: "placeQuote",
    args: [isBid, price, qty, levelHint],
    chain: null,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // KeystoneReserve.placeQuote forwards to KeystoneBook.placeLimit internally, so
  // the same OrderPlaced event decoding works here too.
  const [placed] = parseEventLogs({ abi: KEYSTONE_BOOK_ABI, eventName: "OrderPlaced", logs: receipt.logs });
  if (!placed) throw new Error(`reservePlaceQuote: OrderPlaced event not found in receipt (tx ${hash})`);

  return { hash, receipt, orderId: placed.args.orderId };
}

export async function reserveCancelQuote(account: Account, reserveAddress: Address, orderId: bigint) {
  const publicClient = arcPublicClient();
  const walletClient = arcWalletClient(account);

  const hash = await walletClient.writeContract({
    address: reserveAddress,
    abi: KEYSTONE_RESERVE_ABI,
    functionName: "cancelQuote",
    args: [orderId],
    chain: null,
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function reserveTotalAssetsAndSupply(reserveAddress: Address) {
  const client = arcPublicClient();
  const [totalAssets, totalSupply] = await Promise.all([
    client.readContract({ address: reserveAddress, abi: KEYSTONE_RESERVE_ABI, functionName: "totalAssets" }),
    client.readContract({ address: reserveAddress, abi: KEYSTONE_RESERVE_ABI, functionName: "totalSupply" }),
  ]);
  return { totalAssets, totalSupply };
}
