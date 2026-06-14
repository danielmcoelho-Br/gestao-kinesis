// Reloadding to pick up prisma changes
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};


export default nextConfig;
