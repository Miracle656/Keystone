"use client";

import { useCallback, useEffect, useState } from "react";

// Phantom, Solflare, and Backpack all inject this same de facto interface at window.solana /
// window.phantom.solana — the interface @circle-fin/adapter-solana's createSolanaAdapterFromProvider
// itself expects (SolanaWalletProvider). No wallet-adapter-react framework needed for this single
// provider; wiring it directly keeps the surface small.
export interface SolanaProvider {
  isConnected: boolean;
  publicKey?: { toString(): string };
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signTransaction(transaction: unknown): Promise<unknown>;
  signAllTransactions?(transactions: unknown[]): Promise<unknown[]>;
  signMessage?(message: Uint8Array): Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    phantom?: { solana?: SolanaProvider };
    solana?: SolanaProvider;
  }
}

function getInjectedProvider(): SolanaProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.phantom?.solana ?? window.solana;
}

export function useSolanaWallet() {
  const [provider, setProvider] = useState<SolanaProvider | undefined>();
  const [publicKey, setPublicKey] = useState<string | undefined>();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const p = getInjectedProvider();
    setProvider(p);
    if (p?.isConnected && p.publicKey) setPublicKey(p.publicKey.toString());
  }, []);

  const connect = useCallback(async () => {
    const p = getInjectedProvider();
    if (!p) {
      setError("No Solana wallet found — install Phantom or Solflare.");
      return;
    }
    setProvider(p);
    setIsConnecting(true);
    setError(null);
    try {
      const res = await p.connect();
      setPublicKey(res.publicKey.toString());
    } catch {
      setError("Solana wallet connection was rejected.");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await provider?.disconnect();
    setPublicKey(undefined);
  }, [provider]);

  return { provider, publicKey, isConnected: !!publicKey, isConnecting, error, connect, disconnect };
}
