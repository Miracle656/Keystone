import { useLoginWithPasskey, useSignupWithPasskey } from "@privy-io/react-auth";

/** The "Get started" path — distinct from useWalletConnect's "Connect wallet" — for someone who
 * has never held a wallet. signup() creates a brand-new passkey + embedded wallet; login() is for
 * returning to an already-created one. Both auto-create the embedded wallet on success per
 * lib/privy.ts's embeddedWallets.createOnLogin config. */
export function usePasskeyWallet() {
  const { signupWithPasskey, state: signupState } = useSignupWithPasskey();
  const { loginWithPasskey, state: loginState } = useLoginWithPasskey();
  const busy = signupState.status !== "initial" && signupState.status !== "error" && signupState.status !== "done"
    ? true
    : loginState.status !== "initial" && loginState.status !== "error" && loginState.status !== "done";
  return { createWallet: signupWithPasskey, useExistingPasskey: loginWithPasskey, busy };
}
