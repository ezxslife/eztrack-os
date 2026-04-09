import type { NextConfig } from "next";
import { resolve } from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@eztrack/api", "@eztrack/shared", "@eztrack/ui"],
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
