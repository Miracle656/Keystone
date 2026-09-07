"use client";

import { useState, type ReactNode } from "react";
import { WagmiProvider } from "@privy-io/wagmi";
import { PrivyProvider } from "@privy-io/react-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import { PRIVY_APP_ID, privyConfig } from "@/lib/privy";

export function Providers({ children }: { children: ReactNode }) {
  // Created once per client instance (not module-level) so SSR never leaks a shared
  // QueryClient across requests — the standard pattern for React Query under Next.js.
  const [queryClient] = useState(() => new QueryClient());

  // Without an App ID (e.g. a fresh clone before Privy setup), still provide WagmiProvider so
  // every existing useAccount()/useConnect() call site doesn't hard-crash for missing context —
  // wallet connect just won't work until NEXT_PUBLIC_PRIVY_APP_ID is set. See apps/web/README.
  if (!PRIVY_APP_ID) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
