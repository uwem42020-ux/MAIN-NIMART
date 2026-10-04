import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,

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
    ];
  },
};

export default nextConfig;