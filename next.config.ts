import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qootzfndochmcoijnwxf.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: '/marketplace',
        destination: '/search',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.nimart.ng' }],
        destination: 'https://nimart.ng/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;