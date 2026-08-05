// Mirrors KeystoneBook.sol's public constants (FLAG_POST_ONLY=1, FLAG_IOC=2) — hardcoded
// rather than read on-chain since they're immutable constants, not configurable state.
export const FLAG_NONE = 0;
export const FLAG_POST_ONLY = 1;
export const FLAG_IOC = 2;

export const PRICE_SCALE = 1_000_000n;
