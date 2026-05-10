import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUNBIRD_API_TOKEN: process.env.NEXT_PUBLIC_SUNBIRD_API_TOKEN,
  },
};

export default nextConfig;
