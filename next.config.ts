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
  experimental: {
    // This is the correct field name to force-enable/disable turbopack behavior in some Next versions
    // but the error specifically asks for turbopack: {}
    turbopack: {
      // empty
    }
  },
  transpilePackages: ["next-pwa"],
};

export default withPWA(nextConfig) as any;
