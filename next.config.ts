import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable static page caching for dashboard pages
  headers: async () => [
    {
      source: '/admin/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ],
};

export default nextConfig;
