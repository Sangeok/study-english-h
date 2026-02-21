import type { NextConfig } from "next";

const rootDir = process.cwd();

const nextConfig: NextConfig = {
  outputFileTracingRoot: rootDir,
  turbopack: {
    root: rootDir,
  },
  experimental: {
    optimizePackageImports: ["@tanstack/react-query", "@prisma/client"],
  },
};

export default nextConfig;
