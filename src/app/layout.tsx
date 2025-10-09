import "./globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Meilleur-ski — Comparez, choisissez, skiez !",
  description: "Comparez les prix et trouvez le meilleur ski au meilleur prix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-bg text-text">
        {/* Halo coloré façon ConsoBaby */}
        <div className="bg-brand-blob">
          <Header />
          <main className="container-page py-6">{children}</main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
