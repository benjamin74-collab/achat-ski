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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-neutral-50 text-neutral-900">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
