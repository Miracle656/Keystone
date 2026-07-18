import type { Address } from "viem";

function requireAddress(envVar: string): Address {
  const value = process.env[envVar];
  if (!value) throw new Error(`Missing ${envVar} in environment (see .env after Phase 1 deploy)`);
  return value as Address;
}

export const BALANCE_MANAGER_ADDRESS = requireAddress("BALANCE_MANAGER_ADDRESS");
export const KEYSTONE_BOOK_ADDRESS = requireAddress("KEYSTONE_BOOK_ADDRESS");
export const MOCK_ORACLE_ADDRESS = requireAddress("MOCK_ORACLE_ADDRESS");
export const KEYSTONE_RESERVE_ADDRESS = requireAddress("KEYSTONE_RESERVE_ADDRESS");
export const USDC_ADDRESS: Address = "0x3600000000000000000000000000000000000000";
export const EURC_ADDRESS: Address = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
export const USDC_EURC_PAIR_ID = 0n;
