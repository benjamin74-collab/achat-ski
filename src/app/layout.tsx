<<<<<<< HEAD
import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app";
const siteName = "Achat-Ski.com";
const siteTitle = "Achat-Ski.com — Comparateur de prix ski";
const siteDescription = "Compare les prix des skis, fixations, chaussures & rando chez Ekosport, Snowleader, Glisshop et +.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s · Achat-Ski.com",
  },
  description: siteDescription,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: siteTitle,
    description: siteDescription,
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    site: "@", // si tu as un handle un jour
  },
=======
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Meilleur-ski — Comparez les prix du matos de ski",
  description: "Comparez les prix des skis, fixations et chaussures chez nos marchands partenaires.",
>>>>>>> feat/brand-ui
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Empêche l'indexation tant que le site n’est pas finalisé */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body className="min-h-screen bg-white text-ink antialiased">
        {/* ✅ Fournit le SessionProvider à tout l’arbre (Header incl.) */}
        <Providers>
          <Header />
          <main className="container-page py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
