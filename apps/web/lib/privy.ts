import type { PrivyClientConfig } from "@privy-io/react-auth";
import { arcTestnet } from "./wagmi";
import { baseSepolia, arbitrumSepolia } from "viem/chains";

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

// loginMethods deliberately omits 'email'/'sms'/social — Keystone isn't adding a Web2-identity
// layer, just replacing "you need a seed phrase" with "use your device's passkey" for the same
// self-custodial EOA wallet. 'wallet' keeps MetaMask/Phantom-style external connect available for
// Mara (already has a wallet) via connectWallet(), separate from the passkey path for Joy.
export const privyConfig: PrivyClientConfig = {
  loginMethods: ["passkey", "wallet"],
  embeddedWallets: {
    createOnLogin: "users-without-wallets",
  },
  defaultChain: arcTestnet,
  supportedChains: [arcTestnet, baseSepolia, arbitrumSepolia],
  appearance: {
    walletChainType: "ethereum-only",
  },
};
