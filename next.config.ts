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
	  {
        protocol: "https",
        hostname: "www.tonton-outdoor.com",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "tonton-outdoor.com",
        pathname: "/media/**",
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