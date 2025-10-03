// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Meilleur-ski — Compare les meilleurs prix ski",
    template: "%s — Meilleur-ski",
  },
  description: "Compare les prix skis, fixations et chaussures chez les meilleurs marchands.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://achat-ski.vercel.app"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-transparent">
      <body className="min-h-dvh antialiased">
        <Header />
        <main className="container mx-auto max-w-6xl px-4 py-6">
          {/* couche “paper” pour le contraste */}
          <div className="rounded-2xl bg-white/95 border border-white/30 shadow-card">{children}</div>
        </main>
        <Footer />
      </body>
    </html>
  );
}
