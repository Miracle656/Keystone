// Palette from the "Keystone Mobile" Claude Design mockup — a close-but-distinct variant of
// web's tokens (KEYSTONE_PRD.md §8): mobile's own background/panel pair is a touch bluer
// (#060D1A/#0B1424/#16233B vs web's flat #0D0E11), matched exactly to the approved design file
// rather than forced onto web's tokens.
export const colors = {
  bg: "#060D1A",
  basalt: "#0B1424",
  panel: "#16233B",
  limestone: "#F5F1E6",
  gold: "#E7B25A",
  bid: "#2FBF71",
  ask: "#E5484D",
  mortar: "rgba(245,241,230,0.08)",
  inkFaint: "rgba(245,241,230,0.45)",
  inkFainter: "rgba(245,241,230,0.35)",
} as const;
