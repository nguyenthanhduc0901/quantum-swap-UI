import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'pino-pretty': false,
    } as typeof config.resolve.alias;
    return config;
  },
};

export default nextConfig;
