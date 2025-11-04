// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // IMPORTANT : pas d'option "experimental.esmExternals" (Next 15 déconseille fortement)
  // Pas de manipulation des "externals" non plus : ça peut empêcher Next de générer ses manifests.

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Empêcher tout import de jsdom en SSR (si un import statique traîne)
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        jsdom: false,
      };
    }

    // Petit filet de sécu contre des deps Node non dispos côté navigateur
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
