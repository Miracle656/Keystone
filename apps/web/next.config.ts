import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // @keystone/shared ships raw TS source (no build step) with internal imports written as
  // `./abis.js` — valid TS-ESM (resolves .js specifiers back to sibling .ts files) that tsx
  // handles natively for the engine/indexer packages, but Turbopack doesn't apply the same
  // remapping for an unbundled workspace package by default. transpilePackages routes it
  // through Next's own transform pipeline instead, which does understand it.
  transpilePackages: ["@keystone/shared"],
  turbopack: {
    // Pin the workspace root to the monorepo root — a stray package-lock.json
    // in the Windows user profile dir otherwise confuses root inference.
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
