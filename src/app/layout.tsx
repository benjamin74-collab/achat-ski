import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import CookieBanner from "@/components/cookies/CookieBanner";
import TrackingScripts from "@/components/tracking/TrackingScripts";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import type { SiteConfig } from "@/config/site.types";
import { getFontClasses, getFontFamilyVar } from "@/config/fonts";
import { getCurrentSiteId, getCurrentSiteUrl } from "@/lib/currentSite";
import AdsenseScript from "@/components/ads/AdsenseScript";
import Script from "next/script";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);
  const siteUrl = await getCurrentSiteUrl();

  const [settings, adSettings] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { siteId },
      select: {
        robotsIndex: true,
        robotsFollow: true,
        robotsNoarchive: true,
      },
    }),
    prisma.adSettings.findUnique({
      where: { siteId },
      select: {
        enabled: true,
        adsenseClient: true,
      },
    }),
  ]);

  const adsenseClient =
    adSettings?.enabled && adSettings.adsenseClient
      ? adSettings.adsenseClient
      : null;

  return {
    metadataBase: new URL(siteUrl),
    title: `${siteConfig.name} — Comparez les meilleurs produits au meilleur prix`,
    description:
      siteConfig.tagline ||
      `Comparez les meilleurs produits sur ${siteConfig.name}.`,
    robots: {
      index: settings?.robotsIndex ?? true,
      follow: settings?.robotsFollow ?? true,
      noarchive: settings?.robotsNoarchive ?? false,
    },
    alternates: {
      canonical: siteUrl,
    },
    other: adsenseClient
      ? {
          "google-adsense-account": adsenseClient,
        }
      : undefined,
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
    name: cfg.name || "Meilleur X",
    tagline: cfg.tagline || "Comparer & gagner",
    logoSrc: cfg.brand?.logoSrc || "",
    logoAlt: cfg.brand?.logoAlt || cfg.name || "Meilleur X",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const [tracking, adSettings] = await Promise.all([
  prisma.trackingSettings.findUnique({
    where: { siteId },
    select: {
      enabledAnalytics: true,
      enabledAds: true,
      enabledGtm: true,
      ga4MeasurementId: true,
      googleAdsId: true,
      googleAdsConversionLabel: true,
      gtmContainerId: true,
    },
    }),
	  prisma.adSettings.findUnique({
		where: { siteId },
		select: {
		  enabled: true,
		  adsenseClient: true,
		},
	  }),
	]);

  const cssVars: CSSVars = {
    "--primary": hexToRgbTriplet(siteConfig.colors.primary),
    "--secondary": hexToRgbTriplet(siteConfig.colors.secondary),
    "--accent": hexToRgbTriplet(siteConfig.colors.accent),
    "--background": hexToRgbTriplet(siteConfig.colors.background),
    "--foreground": hexToRgbTriplet(siteConfig.colors.foreground),
    "--muted": hexToRgbTriplet(siteConfig.colors.muted),
    "--muted-foreground": hexToRgbTriplet(siteConfig.colors.mutedForeground),
    "--border": hexToRgbTriplet(siteConfig.colors.border),
    "--font-sans": getFontFamilyVar(siteConfig.fonts.sans),
    "--font-display": getFontFamilyVar(siteConfig.fonts.display),
  };

  const branding = getBranding(siteConfig);
  const fontClasses = getFontClasses([siteConfig.fonts.sans, siteConfig.fonts.display]);
  const hasGoogleCmp = !!adSettings?.enabled && !!adSettings.adsenseClient;
  
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
		{hasGoogleCmp ? (
		  <Script
			id="adsense-script"
			async
			strategy="afterInteractive"
			src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
			  adSettings!.adsenseClient!
			)}`}
			crossOrigin="anonymous"
		  />
		) : null}
          <TrackingScripts
            enabledAnalytics={tracking?.enabledAnalytics}
            enabledAds={tracking?.enabledAds}
            enabledGtm={tracking?.enabledGtm}
            ga4MeasurementId={tracking?.ga4MeasurementId}
            googleAdsId={tracking?.googleAdsId}
            googleAdsConversionLabel={tracking?.googleAdsConversionLabel}
            gtmContainerId={tracking?.gtmContainerId}
          />

          <Header />
          <main className="container-page py-6">{children}</main>
          <Footer />
          <CookieBanner disabled={hasGoogleCmp} />
        </Providers>
      </body>
    </html>
  );
}