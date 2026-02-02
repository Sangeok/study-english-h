import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "@prisma/client"],
  },
};

export default nextConfig;
