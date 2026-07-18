import { privateKeyToAccount } from "viem/accounts";

export type WalletName = "DEPLOYER" | "MM_BOT_A" | "MM_BOT_B" | "RESERVE_KEEPER" | "DEMO_USER";

function envKey(name: WalletName): `0x${string}` {
  const key = process.env[`${name}_PRIVATE_KEY`];
  if (!key) throw new Error(`Missing ${name}_PRIVATE_KEY in environment (see .env.example)`);
  return key as `0x${string}`;
}

/** Loads a wallet's raw private key + derived address from the environment. */
export function loadWallet(name: WalletName) {
  const privateKey = envKey(name);
  const account = privateKeyToAccount(privateKey);
  return { name, privateKey, address: account.address, account };
}
