import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Meilleur-ski — Comparez les prix du matos de ski",
  description: "Comparez les prix des skis, fixations et chaussures chez nos marchands partenaires.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      {/* 🔒 Fond clair explicite + couleur de texte */}
      <body className="min-h-screen bg-white text-ink antialiased">
        <Header />
        <main className="container-page py-6">{children}</main>
		<Footer />
      </body>
    </html>
  );
}
