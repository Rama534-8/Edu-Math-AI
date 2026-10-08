import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is enabled by default in Next.js 16
  // better-sqlite3 and bcrypt are native Node.js modules that
  // only run server-side — they don't need special Turbopack config
  turbopack: {},

  // Increase body size limit for profile picture uploads (default 1MB is too small)
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
