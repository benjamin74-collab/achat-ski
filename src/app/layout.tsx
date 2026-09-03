import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";
import CookieBanner from "@/components/cookies/CookieBanner";
import TrackingScripts from "@/components/tracking/TrackingScripts";
import { prisma } from "@/lib/prisma";
import { getSiteConfig } from "@/config/site";
import { getFontClasses, getFontFamilyVar } from "@/config/fonts";
import { getCurrentSiteId, getCurrentSiteUrl } from "@/lib/currentSite";

export async function generateMetadata(): Promise<Metadata> {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);
  const siteUrl = await getCurrentSiteUrl();

  const [settings, adSettings] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { siteId },
      select: {
        name: true,
        tagline: true,
        robotsIndex: true,
        robotsFollow: true,
        robotsNoarchive: true,
        faviconSrc: true,
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

  const siteName = settings?.name || siteConfig.name;
  const siteTagline = settings?.tagline || siteConfig.tagline;
  const favicon =
    settings?.faviconSrc || siteConfig.brand.faviconSrc || "/favicon.ico";

  return {
    metadataBase: new URL(siteUrl),

    title: `${siteName} — Comparez les meilleurs produits au meilleur prix`,

    description:
      siteTagline || `Comparez les meilleurs produits sur ${siteName}.`,

    robots: {
      index: settings?.robotsIndex ?? true,
      follow: settings?.robotsFollow ?? true,
      noarchive: settings?.robotsNoarchive ?? false,
    },

    alternates: {
      canonical: siteUrl,
    },

    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
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

  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;

  if (full.length !== 6) return "0 0 0";

  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return "0 0 0";
  }

  return `${r} ${g} ${b}`;
}

function firstFilled(...values: Array<string | null | undefined>): string {
  return values.find((value) => typeof value === "string" && value.trim() !== "") ?? "";
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteId = await getCurrentSiteId();
  const siteConfig = getSiteConfig(siteId);

  const [settings, tracking, adSettings] = await Promise.all([
    prisma.siteSettings.findUnique({
      where: { siteId },
    }),

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

  const fontSans = firstFilled(settings?.fontSans, siteConfig.fonts.sans);
  const fontDisplay = firstFilled(settings?.fontDisplay, siteConfig.fonts.display);

  const cssVars: CSSVars = {
    "--primary": hexToRgbTriplet(firstFilled(settings?.primary, siteConfig.colors.primary)),
    "--secondary": hexToRgbTriplet(firstFilled(settings?.secondary, siteConfig.colors.secondary)),
    "--accent": hexToRgbTriplet(firstFilled(settings?.accent, siteConfig.colors.accent)),
    "--background": hexToRgbTriplet(firstFilled(settings?.background, siteConfig.colors.background)),
    "--foreground": hexToRgbTriplet(firstFilled(settings?.foreground, siteConfig.colors.foreground)),
    "--muted": hexToRgbTriplet(firstFilled(settings?.muted, siteConfig.colors.muted)),
    "--muted-foreground": hexToRgbTriplet(
      firstFilled(settings?.mutedForeground, siteConfig.colors.mutedForeground),
    ),
    "--border": hexToRgbTriplet(firstFilled(settings?.border, siteConfig.colors.border)),
    "--font-sans": getFontFamilyVar(fontSans as never),
    "--font-display": getFontFamilyVar(fontDisplay as never),
  };

  const branding = {
    name: firstFilled(settings?.name, siteConfig.name, "Meilleur X"),
    tagline: firstFilled(settings?.tagline, siteConfig.tagline, "Comparer & gagner"),
    logoSrc: firstFilled(settings?.logoSrc, siteConfig.brand.logoSrc),
    logoAlt: firstFilled(settings?.logoAlt, siteConfig.brand.logoAlt, siteConfig.name, "Meilleur X"),
  };

  const fontClasses = getFontClasses([fontSans as never, fontDisplay as never]);

  const adsenseClient =
  adSettings?.enabled && adSettings.adsenseClient
    ? adSettings.adsenseClient
    : null;

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

          <TrackingScripts
		  enabledAnalytics={tracking?.enabledAnalytics}
		  enabledAds={tracking?.enabledAds}
		  enabledGtm={tracking?.enabledGtm}
		  ga4MeasurementId={tracking?.ga4MeasurementId}
		  googleAdsId={tracking?.googleAdsId}
		  googleAdsConversionLabel={tracking?.googleAdsConversionLabel}
		  gtmContainerId={tracking?.gtmContainerId}
		  adsenseClient={adsenseClient}
		/>

          <Header />
          <main className="container-page py-6">{children}</main>
          <Footer />
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}