import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/ekoweb/image/upload/**",
      },
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        jsdom: false,
      };
    }

    config.resolve.fallback = {
      ...(config.resolve.fallback ?? {}),
      canvas: false,
      encoding: false,
      fs: false,
      path: false,
    };

    return config;
  },
};

export default nextConfig;