import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // 👈 disable React Strict Mode
  images: {
    domains: ["i.ytimg.com"],
  },
};

export default nextConfig;
