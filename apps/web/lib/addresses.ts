import type { Address } from "viem";

function requirePublicAddress(name: string, value: string | undefined): Address {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value as Address;
}

// Next.js only inlines NEXT_PUBLIC_* into the client bundle for statically-written
// `process.env.NEXT_PUBLIC_X` references — a dynamic `process.env[name]` lookup can't be
// inlined and silently evaluates to undefined in the browser. Each reference below must stay
// written out literally, not looped or computed from a variable.
export const PAIR_REGISTRY_ADDRESS = requirePublicAddress(
  "NEXT_PUBLIC_PAIR_REGISTRY_ADDRESS",
  process.env.NEXT_PUBLIC_PAIR_REGISTRY_ADDRESS,
);
export const BALANCE_MANAGER_ADDRESS = requirePublicAddress(
  "NEXT_PUBLIC_BALANCE_MANAGER_ADDRESS",
  process.env.NEXT_PUBLIC_BALANCE_MANAGER_ADDRESS,
);
export const KEYSTONE_BOOK_ADDRESS = requirePublicAddress(
  "NEXT_PUBLIC_KEYSTONE_BOOK_ADDRESS",
  process.env.NEXT_PUBLIC_KEYSTONE_BOOK_ADDRESS,
);
export const FEE_COLLECTOR_ADDRESS = requirePublicAddress(
  "NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS",
  process.env.NEXT_PUBLIC_FEE_COLLECTOR_ADDRESS,
);
export const KEYSTONE_RESERVE_ADDRESS = requirePublicAddress(
  "NEXT_PUBLIC_KEYSTONE_RESERVE_ADDRESS",
  process.env.NEXT_PUBLIC_KEYSTONE_RESERVE_ADDRESS,
);
export const MOCK_ORACLE_ADDRESS = requirePublicAddress(
  "NEXT_PUBLIC_MOCK_ORACLE_ADDRESS",
  process.env.NEXT_PUBLIC_MOCK_ORACLE_ADDRESS,
);
export const USDC_ADDRESS = requirePublicAddress("NEXT_PUBLIC_USDC_ADDRESS", process.env.NEXT_PUBLIC_USDC_ADDRESS);
export const EURC_ADDRESS = requirePublicAddress("NEXT_PUBLIC_EURC_ADDRESS", process.env.NEXT_PUBLIC_EURC_ADDRESS);

// Matches packages/engine/src/router/addresses.ts's convention: base=EURC, quote=USDC.
export const USDC_EURC_PAIR_ID = 0n;
