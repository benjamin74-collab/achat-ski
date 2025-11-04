// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    // Assouplit la résolution des dépendances ESM/CJS côté Node
    // -> évite de nombreux "ERR_REQUIRE_ESM"
    esmExternals: "loose",
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // 1) Empêche tout import de `jsdom` pendant le SSR
      //    (si un import statique traîne côté server, il sera résolu vers `false`)
      config.resolve.alias = {
        ...(config.resolve.alias ?? {}),
        jsdom: false,
      };
    }

    // 2) Filet de sécurité : si Next externalise encore des modules,
    //    on retire `jsdom` et `parse5` de la liste des externals côté serveur
    if (isServer && Array.isArray(config.externals)) {
      config.externals = config.externals.map((external: any) => {
        if (typeof external !== "function") return external;
        return (ctx: any, cb: any) => {
          external(ctx, (err: any, res: any) => {
            if (err) return cb(err);
            if (Array.isArray(res)) {
              // retire jsdom et parse5 des externals
              res = res.filter(
                (name: string) =>
                  !/^jsdom$/.test(name) &&
                  !/^parse5($|\/)/.test(name)
              );
            }
            cb(null, res);
          });
        };
      });
    }

    return config;
  },
};

export default nextConfig;
