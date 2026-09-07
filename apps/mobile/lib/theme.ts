// Same six design tokens as apps/web (KEYSTONE_PRD.md §8) — kept local to this app rather than
// in @keystone/shared since that package is chain/ABI data only, not UI tokens, and web doesn't
// export them from a shared module either (they're inlined per-component there too).
export const colors = {
  basalt: "#0D0E11",
  limestone: "#EDEAE2",
  gold: "#E8B54D",
  bid: "#2FBF71",
  ask: "#E5484D",
  mortar: "#2A2C33",
  inkFaint: "#8A8D96",
} as const;
