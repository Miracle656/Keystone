/** One-off: grant RESERVE_KEEPER_ROLE on the live KeystoneReserve to the RESERVE_KEEPER
 * wallet. Deploy.s.sol only grants this role to $RESERVE_KEEPER_ADDRESS, defaulting to the
 * deployer if that env var is unset -- which it was at deploy time, so the role landed on
 * DEPLOYER instead of the wallet the keeper process actually signs with. DEPLOYER holds
 * DEFAULT_ADMIN_ROLE, so it can grant the role after the fact without a redeploy. */
import { keccak256, toBytes } from "viem";
import { loadWallet } from "./lib/wallets.js";
import { arcWalletClient, arcPublicClient } from "./lib/arc.js";
import { KEYSTONE_RESERVE_ADDRESS } from "./router/addresses.js";
import { logger, explorerTxUrl } from "./lib/logger.js";

const ACCESS_CONTROL_ABI = [
  {
    type: "function",
    name: "grantRole",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "hasRole",
    inputs: [
      { name: "role", type: "bytes32" },
      { name: "account", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;

async function main() {
  const deployer = loadWallet("DEPLOYER");
  const keeper = loadWallet("RESERVE_KEEPER");
  const role = keccak256(toBytes("RESERVE_KEEPER_ROLE"));

  const publicClient = arcPublicClient();
  const already = await publicClient.readContract({
    address: KEYSTONE_RESERVE_ADDRESS,
    abi: ACCESS_CONTROL_ABI,
    functionName: "hasRole",
    args: [role, keeper.address],
  });
  if (already) {
    logger.info({ keeper: keeper.address }, "RESERVE_KEEPER_ROLE already granted, nothing to do");
    return;
  }

  const walletClient = arcWalletClient(deployer.account);
  const hash = await walletClient.writeContract({
    address: KEYSTONE_RESERVE_ADDRESS,
    abi: ACCESS_CONTROL_ABI,
    functionName: "grantRole",
    args: [role, keeper.address],
  });
  await publicClient.waitForTransactionReceipt({ hash });
  logger.info({ keeper: keeper.address, txUrl: explorerTxUrl("Arc Testnet", hash) }, "granted RESERVE_KEEPER_ROLE");
}

main().catch((err) => {
  logger.error({ err }, "grant-reserve-keeper-role: failed");
  process.exit(1);
});
