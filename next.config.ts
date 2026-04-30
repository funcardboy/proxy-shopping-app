// @ts-nocheck
import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  // Disabling Turbopack strictly by using the experimental flag
  experimental: {
    turbo: {
      // Empty rules to signal we acknowledge turbo but might not use it
    },
  },
  transpilePackages: ["next-pwa"],
};

export default withPWA(nextConfig) as any;
