// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
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
