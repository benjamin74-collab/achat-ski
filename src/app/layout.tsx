// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import { getSiteConfig } from "@/config/site";
import type { SiteConfig } from "@/config/site.types";
import { getFontClasses, getFontFamilyVar } from "@/config/fonts";
import CookieBanner from "@/components/cookies/CookieBanner";

const siteConfig = getSiteConfig();

const siteUrl =
  siteConfig.domain?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://meilleur-ski.com");

/**
 * Metadata dynamique par site
 */
export async function generateMetadata(): Promise<Metadata> {
  const isRobot = siteConfig.id === "meilleur-robot";

  const title = isRobot
    ? "Meilleur Robot — Comparez les meilleurs robots au meilleur prix"
    : "Meilleur Ski — Comparez les prix du matériel de ski";

  const description = isRobot
    ? "Comparez les robots aspirateurs, tondeuses, cuisine et plus : prix, avis et guides pour bien choisir."
    : "Comparez les prix des skis, fixations et chaussures chez nos marchands partenaires.";

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    robots: { index: false, follow: false },
    alternates: {
      canonical: siteUrl,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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

function getBranding(cfg: SiteConfig): {
  name: string;
  tagline: string;
  logoSrc: string;
  logoAlt: string;
} {
  return {
    name: cfg.name || "Meilleur Ski",
    tagline: cfg.tagline || "Comparer & gagner",
    logoSrc: cfg.brand?.logoSrc || "",
    logoAlt: cfg.brand?.logoAlt || cfg.name || "Meilleur Ski",
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cssVars: CSSVars = {
    // couleurs
    "--primary": hexToRgbTriplet(siteConfig.colors.primary),
    "--secondary": hexToRgbTriplet(siteConfig.colors.secondary),
    "--accent": hexToRgbTriplet(siteConfig.colors.accent),
    "--background": hexToRgbTriplet(siteConfig.colors.background),
    "--foreground": hexToRgbTriplet(siteConfig.colors.foreground),
    "--muted": hexToRgbTriplet(siteConfig.colors.muted),
    "--muted-foreground": hexToRgbTriplet(siteConfig.colors.mutedForeground),
    "--border": hexToRgbTriplet(siteConfig.colors.border),

    // fonts (tokens)
    "--font-sans": getFontFamilyVar(siteConfig.fonts.sans),
    "--font-display": getFontFamilyVar(siteConfig.fonts.display),
  };

  const branding = getBranding(siteConfig);

  // charge uniquement les fonts nécessaires au site courant
  const fontClasses = getFontClasses([siteConfig.fonts.sans, siteConfig.fonts.display]);

  return (
    <html
      lang="fr"
      className={fontClasses}
      style={cssVars}
      suppressHydrationWarning
      data-site-id={siteConfig.id}
      data-site-name={branding.name}
      data-site-tagline={branding.tagline}
      data-site-logo={branding.logoSrc}
      data-site-logo-alt={branding.logoAlt}
    >
      <body className="min-h-screen bg-white text-ink antialiased" suppressHydrationWarning>
        <Providers>
          <Header />
          <main className="container-page py-6">{children}</main>
          <Footer />

          {/* ✅ Popin cookies globale (Axeptio-like) */}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}