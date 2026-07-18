import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to the monorepo root — a stray package-lock.json
    // in the Windows user profile dir otherwise confuses root inference.
    root: path.join(__dirname, "..", ".."),
  },
};

export default nextConfig;
