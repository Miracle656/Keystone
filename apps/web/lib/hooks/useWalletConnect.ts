import { usePrivy } from "@privy-io/react-auth";

/** Replaces wagmi's useConnect/useDisconnect + manual injected-connector lookup, which stopped
 * working once wallet connection moved to Privy (see lib/wagmi.ts) — Privy owns opening the
 * external-wallet picker and logging out, wagmi hooks elsewhere keep reading the result as before. */
export function useWalletConnect() {
  const { ready, connectWallet, logout } = usePrivy();
  return { ready, connectWallet, disconnectWallet: logout };
}
