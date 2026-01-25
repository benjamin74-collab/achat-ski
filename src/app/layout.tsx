// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { getSiteConfig } from "@/config/site";

const siteConfig = getSiteConfig();

const siteUrl =
  siteConfig.domain?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://meilleur-ski.com");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Meilleur-ski — Comparez les prix du matos de ski",
  description: "Comparez les prix des skis, fixations et chaussures chez nos marchands partenaires.",
};

type CSSVars = React.CSSProperties & Record<`--${string}`, string>;

function hexToRgbTriplet(hex: string): string {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (full.length !== 6) return "0 0 0";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return "0 0 0";
  return `${r} ${g} ${b}`;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cssVars: CSSVars = {
    // ✅ RGB triplets (pour Tailwind + opacités)
    "--primary": hexToRgbTriplet(siteConfig.colors.primary),
    "--secondary": hexToRgbTriplet(siteConfig.colors.secondary),
    "--accent": hexToRgbTriplet(siteConfig.colors.accent),
    "--background": hexToRgbTriplet(siteConfig.colors.background),
    "--foreground": hexToRgbTriplet(siteConfig.colors.foreground),
    "--muted": hexToRgbTriplet(siteConfig.colors.muted),
    "--muted-foreground": hexToRgbTriplet(siteConfig.colors.mutedForeground),
    "--border": hexToRgbTriplet(siteConfig.colors.border),

    // (optionnel debug)
    "--site-id": `"${siteConfig.id}"`,
  };

  return (
    <html lang="fr" style={cssVars}>
      <head>
        {/* Empêche l'indexation tant que le site n’est pas finalisé */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-white text-ink antialiased">
        <Providers>
          <Header />
          <main className="container-page py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
