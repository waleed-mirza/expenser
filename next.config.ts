import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Bump SW_VERSION to invalidate the service worker cache on deploy.
    NEXT_PUBLIC_SW_VERSION: process.env.SW_VERSION ?? "v1",
  },
};

export default nextConfig;
