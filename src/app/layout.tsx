import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Meilleur-ski — Comparez les prix",
  description: "Comparez les prix de skis, fixations et chaussures.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="font-sans bg-hero-gradient">
        <Header />
        <div className="mx-auto max-w-6xl px-4">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

