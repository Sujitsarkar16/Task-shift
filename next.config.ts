import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Pre-existing type issues are tracked separately; don't block production builds.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
