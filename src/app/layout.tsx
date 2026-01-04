// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const site =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://meilleur-ski.com");

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: "Meilleur-ski — Comparez les prix du matos de ski",
  description: "Comparez les prix des skis, fixations et chaussures chez nos marchands partenaires.",
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
        <Providers>
          <Header />
          <main className="container-page py-6">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
