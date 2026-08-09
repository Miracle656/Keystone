import { Connection, PublicKey } from "@solana/web3.js";

// Devnet only — this is a testnet product, and hand-writing a signing adapter against a chain
// we don't control the contracts on is not something to gamble mainnet funds on. Sourced
// straight from @circle-fin/app-kit's own SolanaDevnet chain definition (chains.mjs), not
// guessed: the App Kit's bridge() call already resolves this same address internally when given
// BridgeChain.Solana_Devnet — this constant is only needed here for the balance display.
export const SOLANA_DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
export const SOLANA_DEVNET_RPC = "https://api.devnet.solana.com";
export const SOLANA_DEVNET_EXPLORER = "https://solscan.io/tx";

let connection: Connection | undefined;
export function solanaDevnetConnection(): Connection {
  if (!connection) connection = new Connection(SOLANA_DEVNET_RPC, "confirmed");
  return connection;
}

/** Reads the owner's USDC-devnet SPL token balance. Returns 0 if they have no associated token
 * account yet (never deposited/received devnet USDC) rather than throwing — a real, common state
 * for a fresh wallet, not an error. */
export async function getSolanaDevnetUsdcBalance(owner: string): Promise<number> {
  const conn = solanaDevnetConnection();
  const ownerKey = new PublicKey(owner);
  const mintKey = new PublicKey(SOLANA_DEVNET_USDC_MINT);
  const { value } = await conn.getParsedTokenAccountsByOwner(ownerKey, { mint: mintKey });
  if (value.length === 0) return 0;
  const amount = value[0].account.data.parsed?.info?.tokenAmount?.uiAmount;
  return typeof amount === "number" ? amount : 0;
}
